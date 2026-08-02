import sys
from pathlib import Path

# Add scripts directory to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT / "app"))

# We no longer need to mock chromadb.EmbeddingFunction since we use pgvector and sentence-transformers directly.
