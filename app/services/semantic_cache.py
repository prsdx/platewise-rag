import os
import time
import numpy as np
from typing import Dict, Any, Optional
from app.services.vector_store import _model

def is_cache_enabled() -> bool:
    return os.getenv("ENABLE_SEMANTIC_CACHING", "true").lower() == "true"

def get_cache_threshold() -> float:
    try:
        return float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.92"))
    except ValueError:
        return 0.92


class SemanticCache:
    def __init__(self):
        # List of dicts: {"query": str, "vector": np.ndarray, "response": dict, "timestamp": float}
        self.entries = []
        self.total_queries = 0
        self.cache_hits = 0

    def _cosine_similarity(self, v1: np.ndarray, v2: np.ndarray) -> float:
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))

    def get(self, query: str, document_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not is_cache_enabled() or not self.entries:
            return None

        self.total_queries += 1
        threshold = get_cache_threshold()
        query_vector = np.array(_model.encode(query))

        best_sim = 0.0
        best_entry = None

        for entry in self.entries:
            # Respect document context scope
            if entry.get("document_name") != document_name:
                continue

            sim = self._cosine_similarity(query_vector, entry["vector"])
            if sim > best_sim:
                best_sim = sim
                best_entry = entry

        if best_entry and best_sim >= threshold:
            self.cache_hits += 1
            hit_rate = round((self.cache_hits / max(1, self.total_queries)) * 100, 1)
            print(f"[Semantic Cache] HIT! Similarity: {best_sim:.4f} >= {threshold}. Hit Rate: {hit_rate}%")
            resp = dict(best_entry["response"])
            resp["is_cached"] = True
            resp["cache_similarity"] = round(best_sim, 3)
            return resp

        return None

    def put(self, query: str, response: Dict[str, Any], document_name: Optional[str] = None):
        if not is_cache_enabled():
            return

        query_vector = np.array(_model.encode(query))
        self.entries.append({
            "query": query,
            "vector": query_vector,
            "response": response,
            "document_name": document_name,
            "timestamp": time.time()
        })
        # Keep cache bounded to last 100 entries to maintain high speed
        if len(self.entries) > 100:
            self.entries.pop(0)

    def invalidate(self):
        """Invalidate cache when documents are modified/uploaded."""
        print("[Semantic Cache] Invalidating all cache entries due to document mutation.")
        self.entries.clear()

    def get_stats(self) -> Dict[str, Any]:
        hit_rate = round((self.cache_hits / max(1, self.total_queries)) * 100, 1) if self.total_queries > 0 else 0.0
        return {
            "total_queries": self.total_queries,
            "cache_hits": self.cache_hits,
            "hit_rate_pct": hit_rate,
            "cached_entries": len(self.entries)
        }

# Global singleton cache instance
semantic_cache = SemanticCache()
