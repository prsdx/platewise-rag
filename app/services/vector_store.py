import re
import os
import uuid
from pathlib import Path
from datetime import datetime

import vecs
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# Load .env
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

from app.services.chunker import chunk_text
from app.services.document_processor import extract_document

# ------------------------------------------------
# Paths
# ------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = Path("/tmp/uploads") if bool(os.getenv("RENDER")) else BASE_DIR / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------
# Initialize Supabase vecs & Model
# ------------------------------------------------
DB_CONNECTION = os.environ.get("DATABASE_URL")
if not DB_CONNECTION:
    print("[WARN] DATABASE_URL is missing. Please set it in .env")

# Initialize embedding model
try:
    _model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Sentence-Transformer initialized (all-MiniLM-L6-v2, 384 dims).")
except Exception as e:
    print(f"[ERROR] Failed to initialize Sentence-Transformer: {e}")
    _model = None


def get_collection():
    """
    Returns the Supabase vecs collection for document embeddings.
    """
    if not DB_CONNECTION:
        raise RuntimeError("DATABASE_URL is not set.")
    vx = vecs.create_client(DB_CONNECTION)
    # all-MiniLM-L6-v2 uses 384 dimensions
    return vx.get_or_create_collection(name="platewise_docs", dimension=384)


def _split_text_by_pages(text):
    page_pattern = re.compile(r'\n?---\s*Page\s+(\d+)\s*---\n?')
    parts = page_pattern.split(text)
    if len(parts) == 1:
        return [(1, text)]
    pages = []
    i = 1
    while i < len(parts) - 1:
        page_num = int(parts[i])
        page_text = parts[i + 1].strip()
        if page_text:
            pages.append((page_num, page_text))
        i += 2
    return pages if pages else [(1, text)]


def process_document(file_path, user_id=None):
    file_path = Path(file_path)
    print(f"Processing : {file_path.name} | User: {user_id}")

    extracted = extract_document(file_path)
    if isinstance(extracted, dict):
        text = extracted.get("text", "")
        pages = extracted.get("pages", 1)
    else:
        text = extracted
        pages = 1

    if not text.strip():
        raise ValueError("No text could be extracted from the document.")

    page_segments = _split_text_by_pages(text)
    all_chunks = []
    all_page_nums = []

    for page_num, page_text in page_segments:
        page_chunks = chunk_text(
            text=page_text,
            chunk_size=800,
            overlap_sentences=2,
        )
        for chunk in page_chunks:
            all_chunks.append(chunk)
            all_page_nums.append(page_num)

    if not all_chunks:
        raise ValueError("No chunks could be generated.")

    print(f"Generated {len(all_chunks)} chunks. Creating embeddings...")
    embeddings = _model.encode(all_chunks, show_progress_bar=False).tolist()

    collection = get_collection()

    # Create HNSW index for production performance if not exists
    # Default uses cosine distance
    try:
        collection.create_index(measure=vecs.IndexMeasure.cosine_distance)
    except Exception:
        pass

    # Delete existing if any
    try:
        if user_id:
            collection.delete(filters={"$and": [{"document_name": {"$eq": file_path.name}}, {"user_id": {"$eq": user_id}}]})
        else:
            collection.delete(filters={"document_name": {"$eq": file_path.name}})
    except Exception:
        pass

    records = []
    for i in range(len(all_chunks)):
        chunk_id = str(uuid.uuid4())
        meta_entry = {
            "document_name": file_path.name,
            "document_type": file_path.suffix.replace(".", "").upper(),
            "chunk": i + 1,
            "page": all_page_nums[i],
            "upload_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "text": all_chunks[i]  # Storing text in metadata since vecs doesn't have a dedicated document column
        }
        if user_id:
            meta_entry["user_id"] = user_id
        
        records.append((chunk_id, embeddings[i], meta_entry))

    print("Upserting records into Supabase pgvector...")
    collection.upsert(records=records)
    print(f"Successfully upserted {len(records)} chunks.")

    return {"chunks": len(all_chunks), "pages": pages}


def get_all_documents(user_id=None) -> list[dict]:
    try:
        collection = get_collection()
        
        filters = {"user_id": {"$eq": user_id}} if user_id else {}
        
        # Querying with a dummy vector of 384 zeros to get all documents (up to 1000 for listing)
        dummy_vector = [0.0] * 384
        results = collection.query(
            data=dummy_vector,
            limit=1000,
            filters=filters,
            include_metadata=True,
            include_value=False
        )

        doc_info = {}
        for row in results:
            # row is a tuple (id, metadata)
            meta = row[1]
            doc_name = meta.get("document_name")
            if not doc_name:
                continue

            if doc_name not in doc_info:
                doc_path = UPLOAD_DIR / doc_name
                size = doc_path.stat().st_size if doc_path.exists() else 0
                doc_info[doc_name] = {
                    "name": doc_name,
                    "type": meta.get("document_type", ""),
                    "chunks": 0,
                    "pages": 1,
                    "size": size,
                }

            doc_info[doc_name]["chunks"] += 1
            doc_info[doc_name]["pages"] = max(doc_info[doc_name]["pages"], meta.get("page", 1))

        return list(doc_info.values())
    except Exception as e:
        print(f"[WARN] Failed to retrieve documents from Supabase: {e}")
        return []


def delete_document_from_db(document_name: str, user_id=None) -> bool:
    try:
        collection = get_collection()
        if user_id:
            collection.delete(filters={"$and": [{"document_name": {"$eq": document_name}}, {"user_id": {"$eq": user_id}}]})
        else:
            collection.delete(filters={"document_name": {"$eq": document_name}})
        print(f"Deleted '{document_name}' from Supabase.")
        return True
    except Exception as e:
        print(f"[WARN] Failed to delete '{document_name}': {e}")
        return False


def clear_database(user_id=None):
    try:
        collection = get_collection()
        if user_id:
            collection.delete(filters={"user_id": {"$eq": user_id}})
            print(f"Cleared database for user: {user_id}")
        else:
            # Drop the whole collection if no user provided
            vx = vecs.create_client(DB_CONNECTION)
            vx.delete_collection("platewise_docs")
            print("Dropped collection 'platewise_docs'.")
    except Exception as e:
        print(f"[WARN] Failed to clear database: {e}")