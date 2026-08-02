import os
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "scripts"))

from scripts.vector_store import process_document

def ingest_all():
    docs_dir = BASE_DIR / "data" / "sample_docs"
    
    print(f"Ingesting documents from {docs_dir}")
    
    for item in docs_dir.iterdir():
        if item.is_file() and item.name != "README.txt":
            try:
                # Set a common session_id for the benchmark to query against globally
                # Actually, the benchmark uses get_collection() and searches without session_id
                # so we will ingest them with no session_id (global pool).
                process_document(str(item), session_id=None)
            except Exception as e:
                print(f"Failed to process {item.name}: {e}")

if __name__ == "__main__":
    ingest_all()
