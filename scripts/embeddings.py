from pathlib import Path
from scripts.vector_store import SentenceTransformerEmbeddingFunction
from scripts.chunker import extract_document, chunk_text

BASE_DIR = Path(__file__).resolve().parent.parent
pdf_path = BASE_DIR / "data" / "raw" / "sample_document.pdf"

if pdf_path.exists():
    text = extract_document(pdf_path)
    chunks = chunk_text(text)
    ef = SentenceTransformerEmbeddingFunction()
    print("IntelliDocs-AI - Embedding Generator (all-MiniLM-L6-v2, 384 dims)")
    print(f"Total Chunks: {len(chunks)}")