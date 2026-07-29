import sys
import os
from pathlib import Path

# Add scripts directory to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "scripts"))

from scripts.vector_store import SentenceTransformerEmbeddingFunction, EMBEDDING_DIM


def test_sentence_transformer_embedding_init():
    """
    Test SentenceTransformerEmbeddingFunction initialization.
    """
    ef = SentenceTransformerEmbeddingFunction()
    assert ef.model_name == "all-MiniLM-L6-v2"
    assert ef._model is not None


def test_sentence_transformer_embedding_dimension():
    """
    Test that the sentence-transformer embedding function produces 384-dim vectors.
    No API key needed — runs entirely locally.
    """
    ef = SentenceTransformerEmbeddingFunction()
    test_text = "Hello world, testing sentence-transformer embeddings."
    embeddings = ef([test_text])
    assert len(embeddings) == 1
    assert len(embeddings[0]) == EMBEDDING_DIM  # all-MiniLM-L6-v2 dimension is 384


def test_sentence_transformer_embedding_batch():
    """
    Test batch embedding generation.
    """
    ef = SentenceTransformerEmbeddingFunction()
    texts = ["First document chunk.", "Second document chunk.", "Third document chunk."]
    embeddings = ef(texts)
    assert len(embeddings) == 3
    for emb in embeddings:
        assert len(emb) == EMBEDDING_DIM


def test_sentence_transformer_empty_input():
    """
    Test that empty input is handled cleanly.
    """
    import pytest
    ef = SentenceTransformerEmbeddingFunction()
    with pytest.raises(ValueError):
        ef([])
