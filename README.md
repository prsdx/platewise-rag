# 🍽️ PlateWise — Restaurant & Food Knowledge Assistant

> **An AI-powered Retrieval-Augmented Generation (RAG) system for the food-delivery industry.
> Ask natural-language questions about restaurant menus, food safety, delivery SLAs, refund
> policies, and FSSAI compliance — and get cited, grounded answers.**

<p align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)
![ChromaDB](https://img.shields.io/badge/Vector%20DB-ChromaDB-green)
![SentenceTransformers](https://img.shields.io/badge/Embeddings-SentenceTransformers-orange)
![Gemini](https://img.shields.io/badge/LLM-Google%20Gemini-4285F4?logo=google)
![License](https://img.shields.io/badge/License-MIT-yellow)

</p>

---

## 🎯 What is PlateWise?

PlateWise is a **Food Knowledge Hub** — a RAG system built for a food-delivery company's
internal support and operations team. It ingests:

- 🍛 **Restaurant menus** (PDF) — with dietary tags (V/VG/GF) and allergen info
- 📋 **Policy documents** (DOCX/TXT) — refund, cancellation, delivery SLA, FSSAI compliance
- ❓ **FAQ documents** (TXT/MD) — customer and restaurant partner FAQs
- 📊 **Structured data** (CSV) — restaurant directory with cuisine, rating, delivery time

**Example queries it handles well:**
- *"Which dishes on the Spice Garden menu are vegan?"*
- *"What's the refund policy if an order arrives more than 30 minutes late?"*
- *"Does this restaurant have a valid FSSAI hygiene certificate on file?"*
- *"Summarize the cancellation policy for restaurant partners."*
- *"Which restaurants in Bengaluru have a rating above 4.5?"*

---

## 🏗️ Architecture

```
User Query
    │
    ▼
React Frontend (Vite SPA)
    │  POST /query/stream  (SSE streaming)
    │  X-API-Key header
    ▼
FastAPI Backend  ──  Auth Middleware (X-API-Key)
    │
    ├── POST /upload    → Ingestion Pipeline
    │       │
    │       ├── PDF Reader    (PyMuPDF)
    │       ├── DOCX Reader   (python-docx)
    │       ├── TXT/MD Reader (native)
    │       └── CSV Reader    (pandas → row-to-text)
    │               │
    │               └── Recursive Sentence Chunker (800 chars / 2-sentence overlap)
    │                       │
    │                       └── SentenceTransformer Embeddings (all-MiniLM-L6-v2, 384d)
    │                               │
    │                               └── ChromaDB (persistent HNSW vector store)
    │
    └── POST /query/stream → Hybrid Retrieval → LLM Generation
            │
            ├── Dense Vector Search  (ChromaDB cosine similarity)
            ├── BM25 Keyword Search  (pure-Python Okapi BM25)
            └── Reciprocal Rank Fusion (RRF k=60)
                    │
                    └── Top-k Context Chunks
                            │
                            └── Gemini LLM Fallback Cascade
                                    ├── gemini-3.1-flash-lite  (primary)
                                    ├── gemini-3.5-flash       (429 fallback)
                                    ├── gemini-2.5-flash       (429 fallback)
                                    └── mock extractor         (offline fallback)
                                            │
                                            └── Streamed Answer + Citations (SSE)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend API | FastAPI + Uvicorn | Async REST, SSE streaming |
| Vector DB | ChromaDB 1.5.9 | Persistent HNSW, local |
| Embeddings | SentenceTransformers `all-MiniLM-L6-v2` | 384-dim, fully local — no API |
| Sparse Search | Okapi BM25 (pure Python) | No external dependency |
| Rank Fusion | Reciprocal Rank Fusion (k=60) | Fuses dense + sparse rankings |
| LLM | Google Gemini (multi-model cascade) | `gemini-3.1-flash-lite` primary |
| Frontend | React 19 + Vite 8 | SPA in `frontend/` |
| CSV Ingestion | pandas | Row-to-text conversion |
| Auth | API Key middleware | `X-API-Key` header |
| Deployment | Render (backend) + Vercel (frontend) | |

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- A Google Gemini API key ([get one free](https://aistudio.google.com/))

### 1. Clone & Configure

```bash
git clone https://github.com/prsdx/platewise-rag.git
cd platewise-rag

# Copy the env template
cp .env.example scripts/.env
# Edit scripts/.env and fill in your GEMINI_API_KEY and PLATEWISE_API_KEY
```

### 2. Backend

```bash
python -m venv venv
source venv/bin/activate        # Linux/macOS
# .\venv\Scripts\Activate.ps1  # Windows PowerShell

pip install -r requirements.txt
```

### 3. Run Backend

```bash
python -m uvicorn scripts.api:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
# React UI: http://localhost:5173
```

### 5. Ingest Sample Data

Upload the files from `data/sample_docs/` via the UI, or curl:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-API-Key: your_secret_key" \
  -F "files=@data/sample_docs/spice_garden_menu.txt"
```

### 6. Run Tests

```bash
pytest --tb=short
```

---

## 📊 Retrieval Benchmark Results

See [`eval/results.md`](eval/results.md) for the full benchmark.

| Config | Hit-Rate @k=5 | p50 Latency | p95 Latency |
|--------|--------------|-------------|-------------|
| Dense-only | TBD | TBD | TBD |
| Hybrid (BM25 + RRF) | TBD | TBD | TBD |

> Run `python eval/retrieval_benchmark.py` to regenerate results.

---

## 🐳 Docker

```bash
# Build
docker build -t platewise-api .

# Run (supply .env file)
docker run --env-file scripts/.env -p 8000:8000 platewise-api
```

---

## 📂 Project Structure

```
platewise-rag/
├── frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── components/        # UI components (chat, upload, sources)
│   │   ├── context/           # AuthContext, ToastContext, ChatHistoryContext
│   │   └── services/api.js    # API client with streaming support
│   └── index.html
├── scripts/                   # Backend application code
│   ├── api.py                 # FastAPI REST server + auth middleware
│   ├── llm.py                 # LLM fallback cascade + streaming generator
│   ├── search.py              # Hybrid search: BM25 + dense + RRF
│   ├── vector_store.py        # ChromaDB ingestion & retrieval
│   ├── chunker.py             # Sentence-aware recursive chunker
│   ├── document_processor.py  # Pluggable document extractor dispatcher
│   ├── readers/               # Per-format extractors
│   │   ├── pdf_reader.py
│   │   ├── docx_reader.py
│   │   ├── csv_reader.py      # NEW: CSV row-to-text converter
│   │   ├── txt_reader.py
│   │   └── md_reader.py
│   └── app.py                 # Streamlit UI (alternative to React)
├── eval/                      # Retrieval benchmarking
│   ├── retrieval_benchmark.py # Benchmark script (dense vs hybrid)
│   ├── test_questions.json    # 18 Q&A pairs with known source docs
│   └── results.md             # Auto-generated benchmark results
├── tests/                     # Pytest test suite
│   ├── test_chunker.py
│   ├── test_csv_reader.py
│   ├── test_auth.py
│   ├── test_health.py
│   ├── test_search.py
│   ├── test_vector_store.py
│   └── test_rag_pipeline.py
├── data/
│   └── sample_docs/           # 15 synthetic food-domain demo documents
├── docs/
│   ├── adr/                   # Architecture Decision Records
│   ├── design_doc.md
│   └── tech_stack.md
├── Dockerfile                 # Multi-stage backend container
├── docker-compose.yml         # Local convenience compose
├── render.yaml                # Render deployment config
├── requirements.txt
└── .env.example               # Environment variable template
```

---

## 🔐 Authentication

All API endpoints (except `/` and `/docs`) require an `X-API-Key` header:

```bash
curl -H "X-API-Key: your_secret_key" http://localhost:8000/documents
```

Set `PLATEWISE_API_KEY` in `scripts/.env`. The React frontend reads this key from the
login modal and passes it automatically on every request.

---

## ⚠️ Known Limitations

1. **Citation granularity is chunk-level**, not exact-sentence — answers cite the chunk
   where the evidence was found, not the specific line.
2. **Scanned image PDFs** without an embedded text layer cannot be indexed (no OCR).
3. **BM25 index is rebuilt in-memory** on first query after server restart — adds ~1s
   latency on cold start with large document sets.
4. **No persistent user sessions** — the session ID is client-generated; clearing browser
   storage loses the session's document index.
5. **Streaming citations** arrive as a final SSE event after the text stream — there is
   a brief gap between the last token and citation rendering.

---

## 🚀 Live Demo

- **Frontend:** TBD (deploy to Vercel)
- **Backend API:** TBD (deploy to Render)

> API key for the live demo available on request.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
