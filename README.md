# PlateWise 2.0 - AI Document Intelligence SaaS

![PlateWise Banner](https://img.shields.io/badge/PlateWise-AI_Document_Intelligence-4f46e5?style=for-the-badge)

PlateWise is a production-ready, AI-native SaaS application designed to transform raw documents (PDFs, DOCX, TXT) into actionable intelligence. It uses advanced Hybrid RAG (Retrieval-Augmented Generation), Supabase for multi-tenant isolation, and a dynamic LLM cascade supporting both proprietary (Google Gemini, OpenAI, Claude) and open-source models (Llama 3, Mixtral via Groq).

Built originally for food delivery operations and restaurant compliance, the engine is fully generalized for any document-heavy enterprise workflow.

## 🚀 Key Features

- **Hybrid RAG Retrieval Engine:** Combines `pgvector` semantic embeddings with BM25 keyword search using Reciprocal Rank Fusion (RRF) for unparalleled accuracy.
- **Dynamic LLM Cascade:** Intelligently routes queries. Automatically falls back on quota limits. Supports Gemini 1.5/3.5, GPT-4o, Claude 3.5, and Groq-powered Open Source models.
- **Premium UI/UX:** Built with React & Tailwind CSS. Features "Quiet Chrome" design, smooth micro-animations, and dynamic dashboards inspired by top-tier SaaS (Linear, Vercel).
- **Secure Authentication:** Integrated with Supabase Auth for Magic Links, Email/Password, and Google OAuth.
- **Multi-Tenant Architecture:** Fully isolated PostgreSQL database preventing data leakage between users.

---

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, React Router
- **Backend:** Python 3.12, FastAPI, Uvicorn, LangChain/LlamaIndex paradigms
- **Database / Auth:** Supabase (PostgreSQL + pgvector + GoTrue Auth)
- **AI Inference:** Google GenAI SDK, Groq SDK
- **Document Parsers:** PyMuPDF, python-docx, python-pptx

---

## ⚙️ Local Development Setup

Follow these instructions to get PlateWise running on your local machine.

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A [Supabase](https://supabase.com/) account (Free tier is fine)
- A [Groq API Key](https://console.groq.com) (Free)
- A [Google Gemini API Key](https://aistudio.google.com/) (Free)

### 2. Environment Variables
Clone the repository and set up your `.env` file in the root backend directory:

```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase, Gemini, and Groq keys.

### 3. Backend Setup

Create a virtual environment and install the dependencies:

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Start the FastAPI server:
```bash
uvicorn scripts.api:app --reload
```
The API will run on `http://localhost:8000`.

### 4. Frontend Setup

Open a new terminal window, navigate to the `frontend` directory, and install npm packages:

```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The web app will run on `http://localhost:5173`.

---

## ☁️ Deployment

- **Frontend:** Deploys seamlessly to [Vercel](https://vercel.com) using the included `vercel.json` configuration.
- **Backend:** Designed to be containerized and deployed to services like Render, Railway, or AWS App Runner.
- **Database:** Supabase handles cloud persistence automatically.

---

## 📜 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built with ❤️ for modern operations.*
