import sys
from pathlib import Path

# Add scripts directory to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT / "app"))
# Flat-layout imports used by older tests: `from chunker import ...`, `from readers.csv_reader import ...`
sys.path.append(str(PROJECT_ROOT / "app" / "services"))
# Package-style internal imports: app/services/*.py use `from app.services.x import ...`
sys.path.append(str(PROJECT_ROOT))

# We no longer need to mock chromadb.EmbeddingFunction since we use pgvector and sentence-transformers directly.
