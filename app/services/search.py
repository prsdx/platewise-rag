import math
import re
from pathlib import Path
from collections import OrderedDict

import os
from dotenv import load_dotenv

# Load .env
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

from app.services.vector_store import get_collection, _model

# ------------------------------------------------
# BM25 Keyword Search Implementation
# ------------------------------------------------

class BM25:
    def __init__(self, corpus, k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.avg_doc_len = 0
        self.doc_lengths = []
        self.doc_term_freqs = []
        self.idf = {}
        self._initialize(corpus)

    def _tokenize(self, text):
        return re.findall(r'\w+', text.lower())

    def _initialize(self, corpus):
        total_len = 0
        term_doc_freq = {}

        for doc in corpus:
            tokens = self._tokenize(doc)
            doc_len = len(tokens)
            self.doc_lengths.append(doc_len)
            total_len += doc_len

            tf = {}
            for token in tokens:
                tf[token] = tf.get(token, 0) + 1
            self.doc_term_freqs.append(tf)

            for token in tf.keys():
                term_doc_freq[token] = term_doc_freq.get(token, 0) + 1

        self.avg_doc_len = total_len / self.corpus_size if self.corpus_size > 0 else 0

        for term, freq in term_doc_freq.items():
            self.idf[term] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1.0)

    def get_scores(self, query):
        query_tokens = self._tokenize(query)
        scores = []
        for i in range(self.corpus_size):
            score = 0.0
            doc_len = self.doc_lengths[i]
            tf = self.doc_term_freqs[i]
            for token in query_tokens:
                if token in tf:
                    term_freq = tf[token]
                    numerator = term_freq * (self.k1 + 1)
                    denominator = term_freq + self.k1 * (1 - self.b + self.b * doc_len / self.avg_doc_len)
                    score += self.idf.get(token, 0.0) * (numerator / denominator)
            scores.append(score)
        return scores


class LRUCache:
    def __init__(self, maxsize=10):
        self.cache = OrderedDict()
        self.maxsize = maxsize

    def get(self, key):
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]

    def set(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.maxsize:
            self.cache.popitem(last=False)

_BM25_CACHE = LRUCache(maxsize=10)


def retrieve_relevant_chunks(query, n_results=10, document_name=None, user_id=None):
    import time
    start_time = time.perf_counter()

    try:
        collection = get_collection()
    except Exception:
        raise RuntimeError("No documents indexed yet. Please upload a document first.")

    print("\n" + "=" * 80)
    print(f"HYBRID SEARCH QUERY (Supabase pgvector) | User: {user_id}")
    print("=" * 80)

    conditions = []
    if user_id:
        conditions.append({"user_id": {"$eq": user_id}})
    if document_name:
        conditions.append({"document_name": {"$eq": document_name}})

    if not conditions:
        where_clause = {}
    elif len(conditions) == 1:
        where_clause = conditions[0]
    else:
        where_clause = {"$and": conditions}

    # 1. DENSE VECTOR SEARCH
    query_embedding = _model.encode(query, show_progress_bar=False).tolist()
    
    try:
        # vecs query returns [(id, distance, metadata)]
        vector_results = collection.query(
            data=query_embedding,
            limit=30,
            filters=where_clause,
            include_metadata=True,
            include_value=True # We need distance
        )
    except Exception as exc:
        raise RuntimeError("Embedding failed, please try again") from exc

    vec_ids = []
    id_to_doc = {}
    id_to_meta = {}

    for row in vector_results:
        vid, distance, vmeta = row
        vec_ids.append(vid)
        id_to_doc[vid] = vmeta.get("text", "")
        id_to_meta[vid] = vmeta

    if not vec_ids:
        return {
            "documents": [],
            "metadata": [],
            "retrieved_chunks": [],
            "retrieval_time_ms": 0.0,
        }

    # 2. BM25 KEYWORD SEARCH
    # We fetch all documents for this user/document_name. 
    dummy_vector = [0.0] * 384
    all_data = collection.query(
        data=dummy_vector,
        limit=5000,
        filters=where_clause,
        include_metadata=True,
        include_value=False
    )
    
    all_ids = []
    all_docs = []
    for row in all_data:
        aid, ameta = row
        all_ids.append(aid)
        doc_text = ameta.get("text", "")
        all_docs.append(doc_text)
        id_to_doc[aid] = doc_text
        id_to_meta[aid] = ameta

    cache_key = tuple(sorted(all_ids))
    cached_val = _BM25_CACHE.get(cache_key)
    
    if cached_val is not None:
        bm25_scorer = cached_val
    else:
        bm25_scorer = BM25(all_docs)
        _BM25_CACHE.set(cache_key, bm25_scorer)

    bm25_scores = bm25_scorer.get_scores(query)

    bm25_ranked = sorted(zip(all_ids, bm25_scores), key=lambda x: x[1], reverse=True)
    bm25_top_n = min(15, len(bm25_ranked))
    bm25_ids = [bid for bid, bscore in bm25_ranked[:bm25_top_n]]

    # 3. RECIPROCAL RANK FUSION (RRF)
    k = 60
    rrf_scores = {}

    for rank, rid in enumerate(vec_ids, start=1):
        rrf_scores[rid] = rrf_scores.get(rid, 0.0) + (1.0 / (k + rank))

    for rank, rid in enumerate(bm25_ids, start=1):
        rrf_scores[rid] = rrf_scores.get(rid, 0.0) + (1.0 / (k + rank))

    sorted_candidates = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
    top_candidates = sorted_candidates[:n_results]

    final_documents = []
    final_metadata = []
    retrieved_chunks = []
    max_rrf = 2.0 / 61.0 

    for i, (cid, score) in enumerate(top_candidates, start=1):
        doc_text = id_to_doc.get(cid, "")
        doc_meta = id_to_meta.get(cid, {})
        final_documents.append(doc_text)
        final_metadata.append(doc_meta)

        vec_rank = vec_ids.index(cid) + 1 if cid in vec_ids else None
        bm25_rank = bm25_ids.index(cid) + 1 if cid in bm25_ids else None
        rel_score = min(99.9, round((score / max_rrf) * 100, 1))

        retrieved_chunks.append({
            "chunk_id": cid,
            "document_name": doc_meta.get("document_name", "Unknown"),
            "document_type": doc_meta.get("document_type", ""),
            "page": doc_meta.get("page", 1),
            "chunk": doc_meta.get("chunk", 1),
            "score": rel_score,
            "rrf_score": round(score, 5),
            "dense_rank": vec_rank,
            "bm25_rank": bm25_rank,
            "text": doc_text,
        })

    retrieval_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
    return {
        "documents": final_documents,
        "metadata": final_metadata,
        "retrieved_chunks": retrieved_chunks,
        "retrieval_time_ms": retrieval_time_ms,
    }


def retrieve_document_content(document_name, user_id=None):
    try:
        collection = get_collection()
    except Exception:
        raise RuntimeError("No documents indexed yet. Please upload a document first.")

    conditions = [{"document_name": {"$eq": document_name}}]
    if user_id:
        conditions.append({"user_id": {"$eq": user_id}})
    
    where_clause = {"$and": conditions} if len(conditions) > 1 else conditions[0]

    # Dummy vector to get all chunks
    dummy_vector = [0.0] * 384
    results = collection.query(
        data=dummy_vector,
        limit=1000,
        filters=where_clause,
        include_metadata=True,
        include_value=False
    )

    if not results:
        return {
            "name": document_name,
            "content": "",
            "metadata": [],
        }

    documents = []
    metadata = []
    for row in results:
        meta = row[1]
        metadata.append(meta)
        documents.append(meta.get("text", ""))

    paired = sorted(
        zip(documents, metadata),
        key=lambda x: x[1].get("chunk", 0)
    )

    full_text = "\n\n".join(chunk for chunk, _ in paired)

    return {
        "name": document_name,
        "content": full_text,
        "metadata": metadata,
    }


def retrieve_multiple_documents(document_names, user_id=None):
    documents = []
    for name in document_names:
        doc = retrieve_document_content(name, user_id)
        if doc["content"].strip():
            documents.append(doc)
    return documents