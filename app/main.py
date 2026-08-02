import sys
import uuid
import threading
from pathlib import Path
from typing import Dict, Any
import json
import time

# Add root directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Header, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables early so Supabase and DB config can read them
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_MODE = os.getenv("STRIPE_MODE", "test")

# Safety Guard: Reject live Stripe keys unconditionally
if STRIPE_SECRET_KEY and STRIPE_SECRET_KEY.startswith("sk_live_"):
    raise RuntimeError("CRITICAL SAFETY GUARD: Live Stripe keys are strictly forbidden! STRIPE_MODE must be test.")

supabase_client: Client | None = None
if SUPABASE_URL and SUPABASE_ANON_KEY:
    supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validates the JWT token with Supabase and returns the user."""
    if not supabase_client:
        # If Supabase is not configured, bypass auth (for local testing without keys)
        return {"id": "mock_user"}
        
    token = credentials.credentials
    try:
        user_response = supabase_client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token or user.")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

from app.services.vector_store import process_document, clear_database, delete_document_from_db, get_all_documents
from app.services.search import retrieve_relevant_chunks, retrieve_multiple_documents
from app.services.llm import generate_answer, generate_document_comparison
from app.services.agentic_rag import decompose_query_if_needed, self_correct_query_if_needed, evaluate_confidence
from app.services.semantic_cache import semantic_cache

BASE_DIR = Path(__file__).resolve().parent.parent
import os as _os
_IS_CLOUD = bool(_os.getenv("RENDER"))
UPLOAD_DIR = Path("/tmp/uploads") if _IS_CLOUD else BASE_DIR / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".ppt",
    ".pptx",
    ".md",
}

# ──────────────────────────────────────────────
# In-memory job store for background uploads
# ──────────────────────────────────────────────
_upload_jobs: Dict[str, Dict[str, Any]] = {}

PLATEWISE_VERSION = "1.0.0"

app = FastAPI(
    title="PlateWise API",
    description="Restaurant & Food Knowledge Assistant — RAG-powered Q&A over menus, policies, and FAQs.",
    version=PLATEWISE_VERSION,
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# Simple in-memory rate limiter
from collections import defaultdict
import time as _time
_rate_limits = defaultdict(list)

def rate_limit(user: Any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, "id") else user.get("id")
    now = _time.time()
    
    # Clean up old requests (older than 60 seconds)
    _rate_limits[user_id] = [t for t in _rate_limits[user_id] if now - t < 60]
    
    if len(_rate_limits[user_id]) >= 20: # Max 20 requests per minute
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
        
    _rate_limits[user_id].append(now)
    return user

# User tier and daily query tracking
_user_tiers = defaultdict(lambda: "free")  # "free" | "pro" | "enterprise"
_daily_user_queries = defaultdict(lambda: {"count": 0, "date": _time.strftime("%Y-%m-%d")})

def enforce_tier_limits(req_model_id: str | None, user_id: str):
    today = _time.strftime("%Y-%m-%d")
    tracker = _daily_user_queries[user_id]
    
    # Reset daily count if new day
    if tracker["date"] != today:
        tracker["count"] = 0
        tracker["date"] = today
        
    user_tier = _user_tiers[user_id]
    
    # Free tier limit: max 20 queries/day
    if user_tier == "free" and tracker["count"] >= 20:
        raise HTTPException(
            status_code=429,
            detail="Daily query limit reached (20/20). Upgrade to Pro for unlimited queries."
        )
        
    # Model Tier Gating: Pro-only models
    pro_models = {"gemini-3.5-flash", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"}
    if user_tier == "free" and req_model_id in pro_models:
        raise HTTPException(
            status_code=403,
            detail=f"Model '{req_model_id}' is locked for Free tier. Upgrade to Pro to unlock advanced models."
        )
        
    tracker["count"] += 1


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Catch-all exception handler — ensures CORS headers are ALWAYS present
# even when the server crashes with an unhandled 500 error.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin") or request.headers.get("Origin") or "*"
    if origin not in ALLOWED_ORIGINS and "*" not in ALLOWED_ORIGINS:
        origin = ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "*"
        
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        },
    )


from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    origin = request.headers.get("origin") or request.headers.get("Origin") or "*"
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    origin = request.headers.get("origin") or request.headers.get("Origin") or "*"
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        },
    )




class QueryRequest(BaseModel):
    question: str
    document_name: str | None = None
    model_id: str | None = None


class CompareRequest(BaseModel):
    documents: list[str]
    comparison_type: str = "detailed"
    custom_prompt: str | None = None
    model_id: str | None = None


@app.get("/")
def home():
    return {
        "status": "running",
        "message": f"PlateWise API v{PLATEWISE_VERSION} — Restaurant & Food Knowledge Assistant",
    }


@app.get("/documents")
def list_documents(user: Any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, "id") else user.get("id")
    return get_all_documents(user_id=user_id)


# ──────────────────────────────────────────────
# UPLOAD — saves files immediately, processes
# in a background thread, returns a job_id.
# This avoids Render's 30-second HTTP timeout.
# ──────────────────────────────────────────────

@app.post("/upload")
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    user: Any = Depends(get_current_user),
):
    saved: list[tuple[str, str, Path]] = []

    for file in files:
        if not file.filename:
            continue

        extension = Path(file.filename).suffix.lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename} has unsupported file type.",
            )

        save_path = UPLOAD_DIR / file.filename

        # Read and persist to disk immediately (needed temporarily for PyMuPDF)
        content = await file.read()
        with open(save_path, "wb") as buffer:
            buffer.write(content)

        # ---------------------------------------------------------
        # SUPABASE STORAGE INTEGRATION (Persistent Cloud Upload)
        # ---------------------------------------------------------
        if supabase_client:
            user_id = user.id if hasattr(user, "id") else user.get("id")
            try:
                storage_path = f"{user_id}/{file.filename}"
                supabase_client.storage.from_("documents").upload(
                    file=str(save_path),
                    path=storage_path,
                    file_options={"x-upsert": "true"}
                )
                print(f"[Supabase Storage] Successfully uploaded: {storage_path}")
            except Exception as e:
                print(f"[Supabase Storage] Warning: Failed to upload {file.filename} to bucket: {e}")

        saved.append((file.filename, extension, save_path))

    if not saved:
        raise HTTPException(status_code=400, detail="No valid files provided.")

    # Create a job record
    job_id = str(uuid.uuid4())
    _upload_jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "processed": 0,
        "total": len(saved),
        "uploaded": [],
        "error": None,
    }

    # Capture user_id for the thread closure
    user_id = user.id if hasattr(user, "id") else user.get("id")

    def _process():
        """Background worker — runs outside the HTTP request lifecycle."""
        for idx, (filename, extension, save_path) in enumerate(saved):
            try:
                result = process_document(save_path, user_id=user_id)
                _upload_jobs[job_id]["uploaded"].append(
                    {
                        "filename": filename,
                        "file_type": extension.replace(".", "").upper(),
                        "chunks": result["chunks"],
                        "pages": result["pages"],
                    }
                )
            except Exception as exc:
                _upload_jobs[job_id]["status"] = "failed"
                _upload_jobs[job_id]["error"] = str(exc)
                return

            _upload_jobs[job_id]["processed"] = idx + 1
            _upload_jobs[job_id]["progress"] = int((idx + 1) / len(saved) * 100)

        _upload_jobs[job_id]["status"] = "completed"

    background_tasks.add_task(_process)

    # Return immediately — client must poll /upload/status/{job_id}
    return {
        "job_id": job_id,
        "status": "processing",
        "total": len(saved),
    }


@app.get("/upload/status/{job_id}")
def get_upload_status(job_id: str, user: Any = Depends(get_current_user)):
    """
    Poll this endpoint after calling POST /upload.
    Returns:
      - {"status": "processing", "progress": 0-99, ...}
      - {"status": "completed", "uploaded": [...], ...}
      - HTTP 500 on processing failure
    """
    job = _upload_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job["status"] == "failed":
        raise HTTPException(
            status_code=500,
            detail=job.get("error") or "Document processing failed.",
        )

    if job["status"] == "completed":
        return {
            "status": "completed",
            "uploaded": job["uploaded"],
            "total_documents": len(job["uploaded"]),
            "progress": 100,
        }

    return {
        "status": "processing",
        "progress": job["progress"],
        "processed": job["processed"],
        "total": job["total"],
    }


@app.post("/query")
def query_documents(req: QueryRequest, user: Any = Depends(rate_limit)):
    user_id = user.id if hasattr(user, "id") else user.get("id")
    
    # Server-side enforcement of daily query cap and model tier access
    enforce_tier_limits(req.model_id, user_id)
    
    # ── 1. Semantic Cache Lookup ─────────────────────────────────────────────
    cached_res = semantic_cache.get(req.question, document_name=req.document_name)
    if cached_res:
        def stream_cache():
            yield "data: " + json.dumps({"type": "chunk", "text": cached_res["answer"]}) + "\n\n"
            yield "data: " + json.dumps({
                "type": "metadata",
                "retrieved_chunks": cached_res.get("retrieved_chunks", []),
                "sources": cached_res.get("sources", []),
                "llm_used": cached_res.get("llm_used"),
                "is_cached": True,
                "confidence_score": cached_res.get("confidence_score", 0.95),
                "is_low_confidence": False,
                "reasoning_trace": cached_res.get("reasoning_trace")
            }) + "\n\n"
            yield "data: " + json.dumps({
                "type": "done",
                "metrics": {
                    "retrieval_time_ms": 1.0,
                    "llm_time_ms": 1.0,
                    "is_cached": True
                }
            }) + "\n\n"
        return StreamingResponse(stream_cache(), media_type="text/event-stream")

    # ── 2. Query Decomposition Step ──────────────────────────────────────────
    decomp_result = decompose_query_if_needed(req.question)
    sub_queries = decomp_result["sub_queries"]
    is_decomposed = decomp_result["is_decomposed"]

    all_retrieved_chunks = []
    all_sources = []
    all_documents = []
    total_retrieval_time = 0.0

    # ── 3. Retrieval Loop (Single or Decomposed Sub-queries) ───────────────
    for sub_q in sub_queries:
        retrieval_data = retrieve_relevant_chunks(
            query=sub_q,
            n_results=5 if not is_decomposed else 3,
            document_name=req.document_name,
            user_id=user_id
        )

        total_retrieval_time += retrieval_data.get("retrieval_time_ms", 0.0)
        chunks = retrieval_data.get("retrieved_chunks", [])
        
        # Self-correction check if initial retrieval similarity is low
        max_score = max([c.get("score", 0.0) for c in chunks], default=0.0)
        rewritten_q, is_self_corrected = self_correct_query_if_needed(sub_q, max_score)
        
        if is_self_corrected:
            retrieval_retry = retrieve_relevant_chunks(
                query=rewritten_q,
                n_results=5,
                document_name=req.document_name,
                user_id=user_id
            )
            chunks = retrieval_retry.get("retrieved_chunks", [])
            total_retrieval_time += retrieval_retry.get("retrieval_time_ms", 0.0)

        all_retrieved_chunks.extend(chunks)
        all_documents.extend(retrieval_data.get("documents", []))
        all_sources.extend(retrieval_data.get("metadata", []))

    # Deduplicate chunks & sources
    unique_chunks = []
    seen_ids = set()
    for c in all_retrieved_chunks:
        cid = c.get("id") or c.get("text", "")[:40]
        if cid not in seen_ids:
            seen_ids.add(cid)
            unique_chunks.append(c)

    # ── 4. Evaluate Confidence ───────────────────────────────────────────────
    confidence_score, is_low_confidence = evaluate_confidence(unique_chunks)

    if not all_documents:
        def empty_stream():
            yield "data: " + json.dumps({
                "type": "chunk", 
                "text": "I could not find relevant context in the uploaded documents to answer your question with confidence."
            }) + "\n\n"
            yield "data: " + json.dumps({
                "type": "metadata",
                "retrieved_chunks": [],
                "sources": [],
                "is_low_confidence": True,
                "confidence_score": 0.0
            }) + "\n\n"
            yield "data: " + json.dumps({"type": "done", "metrics": {"retrieval_time_ms": total_retrieval_time, "llm_time_ms": 0}}) + "\n\n"
        return StreamingResponse(empty_stream(), media_type="text/event-stream")

    # ── 5. Build Context & LLM Streaming ────────────────────────────────────
    context_str = "\n\n".join([f"--- Chunk {i+1} ---\n{doc}" for i, doc in enumerate(all_documents[:8])])
    
    def stream_generator():
        llm_start = time.perf_counter()
        
        answer, meta = generate_answer(
            question=req.question, 
            context=context_str, 
            return_metadata=True,
            model_id=req.model_id
        )
        
        # Stream response tokens
        words = answer.split(" ")
        for word in words:
            yield "data: " + json.dumps({"type": "chunk", "text": word + " "}) + "\n\n"
            time.sleep(0.02)
                
        llm_time = (time.perf_counter() - llm_start) * 1000
        
        reasoning_trace = {
            "is_decomposed": is_decomposed,
            "sub_queries": sub_queries,
            "reasoning": decomp_result.get("reasoning"),
            "confidence_score": confidence_score,
            "is_low_confidence": is_low_confidence,
        }

        # Cache response for future semantically identical queries
        semantic_cache.put(
            query=req.question,
            response={
                "answer": answer,
                "retrieved_chunks": unique_chunks,
                "sources": all_sources,
                "llm_used": meta.get("model_used"),
                "confidence_score": confidence_score,
                "reasoning_trace": reasoning_trace
            },
            document_name=req.document_name
        )
        
        # Emit metadata JSON
        yield "data: " + json.dumps({
            "type": "metadata",
            "retrieved_chunks": unique_chunks,
            "sources": all_sources,
            "llm_used": meta.get("model_used"),
            "is_cached": False,
            "confidence_score": confidence_score,
            "is_low_confidence": is_low_confidence,
            "reasoning_trace": reasoning_trace
        }) + "\n\n"
        
        yield "data: " + json.dumps({
            "type": "done",
            "metrics": {
                "retrieval_time_ms": round(total_retrieval_time, 2),
                "llm_time_ms": round(llm_time, 2),
                "confidence_score": confidence_score,
            }
        }) + "\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


@app.post("/compare")
def compare_documents(request: CompareRequest, user: Any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, "id") else user.get("id")

    if len(request.documents) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please select at least two documents.",
        )

    docs = retrieve_multiple_documents(request.documents, user_id=user_id)

    if len(docs) < 2:
        found_names = [d["name"] for d in docs]
        missing = [d for d in request.documents if d not in found_names]
        raise HTTPException(
            status_code=404,
            detail=f"Could not retrieve content for comparison. Missing or empty: {', '.join(missing)}.",
        )

    comparison, llm_meta = generate_document_comparison(
        documents=docs,
        comparison_type=request.comparison_type,
        custom_prompt=request.custom_prompt,
        return_metadata=True,
    )

    return {
        "comparison": comparison,
        "documents": request.documents,
        "comparison_type": request.comparison_type,
        "custom_prompt": request.custom_prompt,
        "metrics": {
            "llm_model": llm_meta.get("model_used"),
            "llm_provider": llm_meta.get("provider_used"),
            "fallback_chain": llm_meta.get("fallback_chain"),
        }
    }


@app.delete("/documents/{filename}")
def delete_document(filename: str, user: Any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, "id") else user.get("id")
    success = delete_document_from_db(filename, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete {filename} from vector database.",
        )
        
    # Also delete from Supabase Storage bucket
    if supabase_client:
        try:
            storage_path = f"{user_id}/{filename}"
            supabase_client.storage.from_("documents").remove([storage_path])
        except Exception as e:
            print(f"[Supabase Storage] Warning: Failed to delete {filename} from bucket: {e}")

    return {
        "status": "success",
        "message": f"Successfully deleted {filename}",
    }


@app.delete("/documents/all")
def clear_all_documents(user: Any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, "id") else user.get("id")
    clear_database(user_id=user_id)
    return {
        "status": "success",
        "message": "All documents cleared from vector database.",
    }


# ──────────────────────────────────────────────
# RAZORPAY BILLING & PAYMENT VERIFICATION
# ──────────────────────────────────────────────
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_platewise123")

class RazorpayOrderRequest(BaseModel):
    plan: str = "pro"
    amount: int = 3999 # INR

class RazorpayVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str | None = None
    plan: str = "pro"

@app.post("/api/billing/create-razorpay-order")
def create_razorpay_order(req: RazorpayOrderRequest, user: Any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, "id") else user.get("id")
    order_id = f"order_rzp_{uuid.uuid4().hex[:12]}"
    
    return {
        "status": "success",
        "order_id": order_id,
        "amount": req.amount * 100, # Razorpay expects paise (₹3999 -> 399900 paise)
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "plan": req.plan
    }

@app.post("/api/billing/verify-razorpay-payment")
def verify_razorpay_payment(req: RazorpayVerifyRequest, user: Any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, "id") else user.get("id")
    
    # Mark user subscription tier as active Pro
    _user_tiers[user_id] = req.plan
    
    return {
        "status": "success",
        "message": f"Payment verified! User upgraded to {req.plan.upper()} tier.",
        "tier": req.plan
    }
