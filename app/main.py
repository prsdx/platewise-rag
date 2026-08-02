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
load_dotenv(BASE_DIR / ".env")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

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
    
    # 1. Retrieve chunks
    retrieval_data = retrieve_relevant_chunks(
        query=req.question,
        n_results=5,
        document_name=req.document_name,
        user_id=user_id
    )

    documents = retrieval_data.get("documents", [])
    
    if not documents:
        # Fallback to no chunks instead of crashing
        def empty_stream():
            yield "data: " + json.dumps({"type": "chunk", "text": "I don't have any context to answer that based on the uploaded documents."}) + "\n\n"
            yield "data: " + json.dumps({"type": "done", "metrics": {"retrieval_time_ms": retrieval_data["retrieval_time_ms"], "llm_time_ms": 0}}) + "\n\n"
        return StreamingResponse(empty_stream(), media_type="text/event-stream")

    # 2. Build context
    context_str = "\n\n".join([f"--- Chunk {i+1} ---\n{doc}" for i, doc in enumerate(documents)])
    
    def stream_generator():
        llm_start = time.perf_counter()
        
        # Get full answer and metadata
        answer, meta = generate_answer(
            question=req.question, 
            context=context_str, 
            return_metadata=True,
            model_id=req.model_id
        )
        
        # Simulate streaming for the frontend
        words = answer.split(" ")
        for word in words:
            yield "data: " + json.dumps({"type": "chunk", "text": word + " "}) + "\n\n"
            time.sleep(0.02)
                
        llm_time = (time.perf_counter() - llm_start) * 1000
        
        # Send metadata at the end
        yield "data: " + json.dumps({
            "type": "metadata",
            "retrieved_chunks": retrieval_data.get("retrieved_chunks", []),
            "sources": retrieval_data.get("metadata", []),
            "llm_used": meta.get("model_used")
        }) + "\n\n"
        
        yield "data: " + json.dumps({
            "type": "done",
            "metrics": {
                "retrieval_time_ms": round(retrieval_data["retrieval_time_ms"], 2),
                "llm_time_ms": round(llm_time, 2)
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


@app.post("/clear")
def clear_all_documents(user: Any = Depends(get_current_user)):
    user_id = user.id if hasattr(user, "id") else user.get("id")
    clear_database(user_id=user_id)
    
    # Also clear from Supabase Storage bucket (optional, but good for completeness)
    if supabase_client:
        try:
            # We would need to list and delete, but skipping for now to keep it simple,
            # as clearing all documents might be a heavy operation for storage.
            pass
        except Exception:
            pass
            
    return {
        "status": "success",
        "message": "All documents cleared from vector database.",
    }