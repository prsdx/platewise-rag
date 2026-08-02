import sys
import os
from pathlib import Path

# Add app directory to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT / "app"))
sys.path.append(str(PROJECT_ROOT))

from app.services.vector_store import _model

EMBEDDING_DIM = 384


def test_sentence_transformer_embedding_init():
    """
    Test SentenceTransformer model initialization.
    """
    assert _model is not None


def test_sentence_transformer_embedding_dimension():
    """
    Test that the sentence-transformer embedding produces 384-dim vectors.
    No API key needed — runs entirely locally.
    """
    test_text = "Hello world, testing sentence-transformer embeddings."
    embeddings = _model.encode([test_text]).tolist()
    assert len(embeddings) == 1
    assert len(embeddings[0]) == EMBEDDING_DIM  # all-MiniLM-L6-v2 dimension is 384


def test_sentence_transformer_embedding_batch():
    """
    Test batch embedding generation.
    """
    texts = ["First document chunk.", "Second document chunk.", "Third document chunk."]
    embeddings = _model.encode(texts).tolist()
    assert len(embeddings) == 3
    for emb in embeddings:
        assert len(emb) == EMBEDDING_DIM


def test_sentence_transformer_empty_input():
    """
    Test that empty input is handled cleanly.
    """
    embeddings = _model.encode([]).tolist()
    assert len(embeddings) == 0
