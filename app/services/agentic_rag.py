import os
import json
import time
from typing import List, Dict, Any, Tuple
from app.services.llm import generate_answer

def is_decomposition_enabled() -> bool:
    return os.getenv("ENABLE_QUERY_DECOMPOSITION", "true").lower() == "true"

def is_self_correct_enabled() -> bool:
    return os.getenv("ENABLE_SELF_CORRECT", "true").lower() == "true"

def is_confidence_scoring_enabled() -> bool:
    return os.getenv("ENABLE_CONFIDENCE_SCORING", "true").lower() == "true"

def get_self_correct_threshold() -> float:
    try:
        return float(os.getenv("SIMILARITY_THRESHOLD_SELF_CORRECT", "0.35"))
    except ValueError:
        return 0.35

def get_low_confidence_threshold() -> float:
    try:
        return float(os.getenv("CONFIDENCE_THRESHOLD_LOW", "0.25"))
    except ValueError:
        return 0.25


def decompose_query_if_needed(query: str) -> Dict[str, Any]:
    """
    Decomposes a compound/multi-part question into 2-4 sub-questions if needed.
    Fails open gracefully if decomposition is disabled or errors occur.
    """
    if not is_decomposition_enabled() or len(query.split()) < 6:
        return {"is_decomposed": False, "sub_queries": [query], "reasoning": None}

    prompt = f"""You are an AI query planner for a Retrieval-Augmented Generation (RAG) system.
Assess if the following user question is compound/multi-part (e.g. comparing two different policies, dishes, or procedures).

Question: "{query}"

Respond strictly with a JSON object in this format:
{{
  "is_compound": true,
  "sub_queries": ["sub query 1", "sub query 2"],
  "reasoning": "brief explanation"
}}

Rules:
- If simple/single-topic: set "is_compound": false and "sub_queries": [].
- If compound: set "is_compound": true and generate 2-4 focused sub-questions.
- JSON ONLY, no extra text.
"""
    try:
        raw_resp = generate_answer(question=prompt, context="", model_id="gemini-3.1-flash-lite")
        # Extract JSON from response
        json_match = raw_resp.strip()
        if "```json" in json_match:
            json_match = json_match.split("```json")[1].split("```")[0].strip()
        elif "```" in json_match:
            json_match = json_match.split("```")[1].split("```")[0].strip()

        data = json.loads(json_match)
        if data.get("is_compound") and isinstance(data.get("sub_queries"), list) and len(data["sub_queries"]) > 1:
            return {
                "is_decomposed": True,
                "sub_queries": data["sub_queries"][:4],
                "reasoning": data.get("reasoning", "Multi-part query decomposed for deep retrieval")
            }
    except Exception as err:
        print(f"[Agentic RAG] Decomposition fail open: {err}")

    return {"is_decomposed": False, "sub_queries": [query], "reasoning": None}


def self_correct_query_if_needed(query: str, max_similarity_score: float) -> Tuple[str, bool]:
    """
    If retrieval confidence is below threshold, rewrites the query once to broaden matching.
    """
    threshold = get_self_correct_threshold()
    if not is_self_correct_enabled() or max_similarity_score >= threshold:
        return query, False

    print(f"[Agentic RAG] Low similarity score ({max_similarity_score:.3f} < {threshold}). Self-correcting query...")
    prompt = f"""The user asked: "{query}"
Initial RAG search returned poor match scores. Please reformulate and broaden this query to improve keyword and semantic search matching over restaurant menus and SOP documents.

Return ONLY the single reformulated query string with no explanation or quotes.
"""
    try:
        rewritten = generate_answer(question=prompt, context="", model_id="gemini-3.1-flash-lite")
        cleaned = rewritten.strip().strip('"')
        if cleaned and len(cleaned) > 3:
            return cleaned, True
    except Exception as err:
        print(f"[Agentic RAG] Self-correction fallback: {err}")

    return query, False


def evaluate_confidence(retrieved_chunks: List[Dict[str, Any]]) -> Tuple[float, bool]:
    """
    Computes confidence score from retrieved chunk scores.
    Returns (confidence_score, is_low_confidence).
    """
    if not retrieved_chunks:
        return 0.0, True

    # Extract score values
    scores = [c.get("score", 0.0) for c in retrieved_chunks if isinstance(c, dict)]
    if not scores:
        return 0.5, False

    top_score = max(scores)
    avg_top3 = sum(sorted(scores, reverse=True)[:3]) / min(3, len(scores))
    confidence = round((top_score * 0.6) + (avg_top3 * 0.4), 3)

    threshold = get_low_confidence_threshold()
    is_low = is_confidence_scoring_enabled() and (confidence < threshold)
    return confidence, is_low
