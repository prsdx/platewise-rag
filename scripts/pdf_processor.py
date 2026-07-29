from pathlib import Path
from scripts.vector_store import process_document

def process_pdf(pdf_path):
    """
    Process an uploaded PDF using sentence-transformers (all-MiniLM-L6-v2) embeddings.
    """
    res = process_document(pdf_path)
    return res["chunks"]