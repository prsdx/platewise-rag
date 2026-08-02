import json
import time
from pathlib import Path
import sys
import os
import statistics

# Add scripts directory to path to import backend modules
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "app"))

from app.services.vector_store import get_collection, _model
from app.services.search import retrieve_relevant_chunks

def load_test_cases():
    test_file = BASE_DIR / "eval" / "test_questions.json"
    with open(test_file, "r", encoding="utf-8") as f:
        return json.load(f)

def run_dense_only(query, collection, k=5):
    """
    Simulates a pure Dense Vector Search pipeline bypassing BM25 and RRF.
    """
    start_time = time.perf_counter()
    try:
        query_embedding = _model.encode(query, show_progress_bar=False).tolist()
        results = collection.query(
            data=query_embedding,
            limit=k,
            include_metadata=True,
            include_value=False
        )
        # vecs query returns [(id, metadata)] when include_value=False
        retrieved_docs = [row[1].get("document_name") for row in results if row[1]]
    except Exception as e:
        print(f"Dense search failed: {e}")
        retrieved_docs = []
        
    latency = (time.perf_counter() - start_time) * 1000
    return retrieved_docs, latency

def run_hybrid(query, k=5):
    """
    Uses the production Hybrid pipeline.
    """
    start_time = time.perf_counter()
    try:
        results = retrieve_relevant_chunks(query, n_results=k)
        retrieved_chunks = results.get("retrieved_chunks", [])
        retrieved_docs = [c.get("document_name") for c in retrieved_chunks]
    except Exception as e:
        print(f"Hybrid search failed: {e}")
        retrieved_docs = []
        
    # We use our own timing wrapper to be consistent with dense
    latency = (time.perf_counter() - start_time) * 1000
    return retrieved_docs, latency

def run_benchmark():
    test_cases = load_test_cases()
    collection = get_collection()
    
    dense_hits = 0
    hybrid_hits = 0
    
    dense_latencies = []
    hybrid_latencies = []
    
    print(f"Running retrieval benchmark on {len(test_cases)} cases...\n")
    
    for i, case in enumerate(test_cases):
        q = case["question"]
        expected = case["expected_document"]
        
        # Disable print statements from search.py for clean output
        sys.stdout = open(os.devnull, 'w')
        
        # Dense
        d_docs, d_lat = run_dense_only(q, collection, k=5)
        if expected in d_docs:
            dense_hits += 1
        dense_latencies.append(d_lat)
        
        # Hybrid
        h_docs, h_lat = run_hybrid(q, k=5)
        if expected in h_docs:
            hybrid_hits += 1
        hybrid_latencies.append(h_lat)
        
        # Restore stdout
        sys.stdout = sys.__stdout__
        
        print(f"[{i+1}/{len(test_cases)}] Q: {q[:50]}...")
        print(f"  Expected: {expected}")
        print(f"  Dense Hit: {'✅' if expected in d_docs else '❌'} | Hybrid Hit: {'✅' if expected in h_docs else '❌'}")
        
    
    # Calculate metrics
    dense_hit_rate = (dense_hits / len(test_cases)) * 100
    hybrid_hit_rate = (hybrid_hits / len(test_cases)) * 100
    
    dense_p50 = statistics.median(dense_latencies)
    dense_p95 = statistics.quantiles(dense_latencies, n=20)[18]  # approx 95th percentile
    
    hybrid_p50 = statistics.median(hybrid_latencies)
    hybrid_p95 = statistics.quantiles(hybrid_latencies, n=20)[18]

    print("\n" + "="*50)
    print("BENCHMARK RESULTS")
    print("="*50)
    print(f"Dense-Only  | HitRate@5: {dense_hit_rate:.1f}% | p50: {dense_p50:.1f}ms | p95: {dense_p95:.1f}ms")
    print(f"Hybrid(RRF) | HitRate@5: {hybrid_hit_rate:.1f}% | p50: {hybrid_p50:.1f}ms | p95: {hybrid_p95:.1f}ms")
    
    # Write to results.md
    results_path = BASE_DIR / "eval" / "results.md"
    
    markdown_content = f"""# PlateWise Retrieval Benchmark Results

*Auto-generated on {time.strftime('%Y-%m-%d %H:%M:%S')}*

| Configuration | Hit-Rate @k=5 | p50 Latency (ms) | p95 Latency (ms) |
|---------------|---------------|------------------|------------------|
| **Dense-only** | {dense_hit_rate:.1f}% | {dense_p50:.1f} | {dense_p95:.1f} |
| **Hybrid (BM25 + RRF)** | {hybrid_hit_rate:.1f}% | {hybrid_p50:.1f} | {hybrid_p95:.1f} |

### Test Dataset
- **Size**: {len(test_cases)} Q&A pairs
- **Metric**: Hit-Rate @k=5 (Did the expected source document appear in the top 5 chunks?)
- **Dense Model**: `all-MiniLM-L6-v2` (384d)
- **Sparse Model**: Okapi BM25 (pure-Python)
- **Rank Fusion**: Reciprocal Rank Fusion (k=60)
"""
    
    with open(results_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)
        
    print(f"\nResults saved to {results_path}")
    
    # Optionally update README.md table here
    readme_path = BASE_DIR / "README.md"
    if readme_path.exists():
        with open(readme_path, "r", encoding="utf-8") as f:
            readme_text = f.read()
            
        # Regex replace the table in README
        import re
        table_pattern = r"\| Config \| Hit-Rate @k=5 \| p50 Latency \| p95 Latency \|\n\|--------\|--------------\|-------------\|-------------\|\n\| Dense-only \| .*? \| .*? \| .*? \|\n\| Hybrid \(BM25 \+ RRF\) \| .*? \| .*? \| .*? \|"
        new_table = f"| Config | Hit-Rate @k=5 | p50 Latency | p95 Latency |\n|--------|--------------|-------------|-------------|\n| Dense-only | {dense_hit_rate:.1f}% | {dense_p50:.1f}ms | {dense_p95:.1f}ms |\n| Hybrid (BM25 + RRF) | {hybrid_hit_rate:.1f}% | {hybrid_p50:.1f}ms | {hybrid_p95:.1f}ms |"
        
        updated_readme = re.sub(table_pattern, new_table, readme_text)
        
        # If the regex didn't match the exact spacing, fallback
        if updated_readme == readme_text:
             table_pattern2 = r"\| Dense-only \| TBD \| TBD \| TBD \|\n\| Hybrid \(BM25 \+ RRF\) \| TBD \| TBD \| TBD \|"
             new_table2 = f"| Dense-only | {dense_hit_rate:.1f}% | {dense_p50:.1f}ms | {dense_p95:.1f}ms |\n| Hybrid (BM25 + RRF) | {hybrid_hit_rate:.1f}% | {hybrid_p50:.1f}ms | {hybrid_p95:.1f}ms |"
             updated_readme = re.sub(table_pattern2, new_table2, readme_text)

        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(updated_readme)
        print("Updated README.md benchmark table.")

if __name__ == "__main__":
    run_benchmark()
