import os
import pytest
from app.services.agentic_rag import decompose_query_if_needed, evaluate_confidence, get_low_confidence_threshold
from app.services.semantic_cache import SemanticCache

def test_query_decomposition_simple():
    query = "What is the price of Margherita Pizza?"
    result = decompose_query_if_needed(query)
    assert isinstance(result, dict)
    assert "is_decomposed" in result
    assert "sub_queries" in result
    # Simple query should not decompose
    assert result["is_decomposed"] is False
    assert result["sub_queries"] == [query]

def test_evaluate_confidence_high():
    chunks = [
        {"text": "Sample text", "score": 0.85},
        {"text": "Sample text 2", "score": 0.75},
        {"text": "Sample text 3", "score": 0.65},
    ]
    confidence, is_low = evaluate_confidence(chunks)
    assert confidence > 0.5
    assert is_low is False

def test_evaluate_confidence_low():
    chunks = [
        {"text": "Irrelevant chunk", "score": 0.10},
    ]
    confidence, is_low = evaluate_confidence(chunks)
    assert confidence < 0.25
    assert is_low is True

def test_semantic_cache_hit_and_miss():
    cache = SemanticCache()
    os.environ["ENABLE_SEMANTIC_CACHING"] = "true"
    os.environ["CACHE_SIMILARITY_THRESHOLD"] = "0.90"

    q1 = "What are the vegan pizza options available on the menu?"
    resp1 = {"answer": "Margherita and Veggie Delight", "retrieved_chunks": [], "sources": []}
    
    # Cache put
    cache.put(query=q1, response=resp1, document_name="menu.txt")

    # Cache hit for identical / near-identical query
    hit_resp = cache.get(q1, document_name="menu.txt")
    assert hit_resp is not None
    assert hit_resp["is_cached"] is True
    assert hit_resp["answer"] == "Margherita and Veggie Delight"

    # Cache miss for completely unrelated query
    miss_resp = cache.get("What is the refund policy for late deliveries?", document_name="menu.txt")
    assert miss_resp is None

def test_semantic_cache_invalidation():
    cache = SemanticCache()
    q = "What is the store opening time?"
    cache.put(query=q, response={"answer": "9 AM"}, document_name=None)
    assert cache.get(q) is not None

    # Invalidate
    cache.invalidate()
    assert cache.get(q) is None
