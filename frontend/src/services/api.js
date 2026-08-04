import axios from "axios";
import { supabase } from "../config/supabase";

// In production (Vercel), requests to /api/* are proxied to Render via vercel.json rewrites.
// In local dev, Vite proxies /api/* to http://127.0.0.1:8000 via vite.config.js.
// This means ALL requests are same-origin → CORS is completely eliminated.
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Persistent Session ID generator per browser/device
function getSessionId() {
  let sid = localStorage.getItem("platewise_session_id");
  if (!sid) {
    sid = "sess_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("platewise_session_id", sid);
  }
  return sid;
}

const api = axios.create({
  baseURL: API_URL,
});

// Attach X-Session-ID + Authorization headers to every request
api.interceptors.request.use(async (config) => {
  config.headers["X-Session-ID"] = getSessionId();

  // Attach Supabase auth token if user is logged in
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers["Authorization"] = `Bearer ${session.access_token}`;
    } else {
      // Mock auth — attach mock token from localStorage
      const mockUser = localStorage.getItem("platewise_mock_user");
      if (mockUser) {
        const parsed = JSON.parse(mockUser);
        config.headers["Authorization"] = `Bearer mock_${parsed.uid}`;
      }
    }
  } catch (err) {
    // Silently fail — request proceeds without auth header
    console.warn("Failed to attach auth token:", err);
  }

  return config;
});


/**
 * Upload multiple documents.
 *
 * Phase 1 — HTTP transfer: progress 0→99 (phase: "uploading")
 * Phase 2 — Backend indexing: progress 0→99 (phase: "indexing")
 * Done     — progress 100 (phase: "completed")
 *
 * onProgress receives: { phase: "uploading"|"indexing"|"completed", percent: 0-100 }
 */
export async function uploadDocuments(files, onProgress = () => {}) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    // ── Phase 1: transfer bytes to server ──────────────────────────────────
    const uploadRes = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (!event.total) return;
        // Cap at 99 so the bar never shows 100% until indexing is also done
        const pct = Math.min(99, Math.round((event.loaded * 100) / event.total));
        onProgress({ phase: "uploading", percent: pct });
      },
    });

    const { job_id } = uploadRes.data;

    // ── Phase 2: poll the background indexing job ──────────────────────────
    onProgress({ phase: "indexing", percent: 0 });

    const POLL_INTERVAL_MS = 3000;   // poll every 3 s
    const MAX_WAIT_MS = 10 * 60 * 1000; // give up after 10 minutes
    const startedAt = Date.now();

    while (Date.now() - startedAt < MAX_WAIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      const statusRes = await api.get(`/upload/status/${job_id}`);
      const data = statusRes.data;

      if (data.status === "completed") {
        onProgress({ phase: "completed", percent: 100 });
        return data; // { status, uploaded, total_documents, progress }
      }

      // Still processing — report progress so the bar moves
      onProgress({ phase: "indexing", percent: data.progress ?? 0 });
    }

    throw new Error(
      "Document indexing is taking longer than expected. " +
      "It will complete in the background — please refresh the Documents tab in a minute."
    );
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
      error.message ||
      "Failed to upload documents."
    );
  }
}

/**
 * Ask a question with streaming response.
 */
export async function askQuestion(question, documentName = null, modelId = null, onChunk = () => {}) {
  const sessionId = getSessionId();
  const headers = {
    "Content-Type": "application/json",
    "X-Session-ID": sessionId,
  };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else {
      const mockUser = localStorage.getItem("platewise_mock_user");
      if (mockUser) {
        const parsed = JSON.parse(mockUser);
        headers["Authorization"] = `Bearer mock_${parsed.uid}`;
      }
    }
  } catch (err) {}

  const response = await fetch(`${API_URL}/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question, document_name: documentName, model_id: modelId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to generate answer.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let done = false;
  let fullAnswer = "";
  let finalSources = [];
  let finalChunks = [];
  let finalMetrics = null;
  let buffer = "";

  let finalIsCached = false;
  let finalConfidenceScore = 0.95;
  let finalIsLowConfidence = false;
  let finalReasoningTrace = null;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop(); // Keep the last incomplete chunk in the buffer
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === "metadata") {
              finalSources = data.sources || [];
              finalChunks = data.retrieved_chunks || [];
              finalIsCached = data.is_cached || false;
              finalConfidenceScore = data.confidence_score || 0.95;
              finalIsLowConfidence = data.is_low_confidence || false;
              finalReasoningTrace = data.reasoning_trace || null;
            } else if (data.type === "chunk") {
              fullAnswer += data.text;
              onChunk(fullAnswer);
            } else if (data.type === "done") {
              finalMetrics = data.metrics || null;
            }
          } catch (e) {
            console.error("SSE JSON Parse Error on line:", line, e);
          }
        }
      }
    }
  }

  return {
    answer: fullAnswer,
    sources: finalSources,
    retrieved_chunks: finalChunks,
    metrics: finalMetrics,
    is_cached: finalIsCached,
    confidence_score: finalConfidenceScore,
    is_low_confidence: finalIsLowConfidence,
    reasoning_trace: finalReasoningTrace,
  };
}

/**
 * Compare two or more uploaded documents.
 */
export async function compareDocuments({
  documents,
  comparisonType = "detailed",
  customPrompt = null,
}) {
  try {
    const response = await api.post("/compare", {
      documents,
      comparison_type: comparisonType,
      custom_prompt: customPrompt,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail ||
      "Failed to compare documents."
    );
  }
}

/**
 * Delete a single document from the vector store.
 */
export async function deleteDocument(filename) {
  try {
    const response = await api.delete(`/documents/${encodeURIComponent(filename)}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete document:", error);
  }
}

/**
 * Clear all documents from the vector store.
 */
export async function clearAllDocuments() {
  try {
    const response = await api.post("/clear");
    return response.data;
  } catch (error) {
    console.error("Failed to clear documents:", error);
  }
}

/**
 * Get all indexed documents.
 */
export async function getDocuments() {
  try {
    const response = await api.get("/documents");
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.documents)) return data.documents;
    if (data && Array.isArray(data.files)) return data.files;
    return [];
  } catch (error) {
    console.error("Failed to get documents:", error);
    return [];
  }
}

export default api;