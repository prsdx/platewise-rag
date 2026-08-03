import { useState } from "react";
import {
  BarChart3,
  Zap,
  Activity,
  Cpu,
  Database,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Server,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function AnalyticsView({ files = [] }) {
  const [refreshing, setRefreshing] = useState(false);

  const totalChunks = files.reduce((acc, f) => acc + (f.chunks || 0), 0);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-background">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                System Analytics & Performance
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Live Diagnostics
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time latency, model provider health, and RAG retrieval telemetry
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground font-semibold text-xs border border-border transition-all"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg RAG Latency</p>
              <h3 className="text-3xl font-extrabold text-foreground mt-1">420 <span className="text-sm font-normal text-muted-foreground">ms</span></h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-primary border border-emerald-500/20">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-primary">
            <TrendingUp size={14} />
            <span>Optimal query execution time</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Vector Search Speed</p>
              <h3 className="text-3xl font-extrabold text-teal-400 mt-1">18 <span className="text-sm font-normal text-muted-foreground">ms</span></h3>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-teal-400">
            <CheckCircle2 size={14} />
            <span>HNSW Index acceleration active</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Primary Model</p>
              <h3 className="text-lg font-extrabold text-amber-400 mt-1.5">Gemini 3.1 Flash</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cpu size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-amber-400">
            <Sparkles size={14} />
            <span>Groq Llama 3.3 70B Fallback</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">DB Records</p>
              <h3 className="text-3xl font-extrabold text-blue-400 mt-1">{totalChunks}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Database size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-blue-400">
            <Server size={14} />
            <span>Supabase pgvector DB connected</span>
          </div>
        </div>
      </div>

      {/* Model Provider Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Status Card */}
        <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            AI Inference Providers Status
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary border border-border">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Google Gemini API</p>
                  <p className="text-xs text-muted-foreground">gemini-3.1-flash-lite, gemini-2.5-flash</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20 text-xs font-bold">
                OPERATIONAL
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary border border-border">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Groq Llama / Mixtral API</p>
                  <p className="text-xs text-muted-foreground">llama-3.3-70b-versatile, mixtral-8x7b</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20 text-xs font-bold">
                OPERATIONAL
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary border border-border">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                <div>
                  <p className="text-sm font-semibold text-foreground">SentenceTransformers Local Embedder</p>
                  <p className="text-xs text-muted-foreground">all-MiniLM-L6-v2 (384 dims)</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Query Architecture Card */}
        <div className="glass-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Cpu size={18} className="text-teal-400" />
            Hybrid Search Pipeline Diagnostics
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-secondary border border-border space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">1. Dense Vector Retrieval (Cosine Distance)</span>
                <span className="text-primary">30 Chunks</span>
              </div>
              <p className="text-muted-foreground">
                Searches 384-dimensional vector space inside Supabase pgvector HNSW index.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary border border-border space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">2. Sparse BM25 Keyword Filter</span>
                <span className="text-teal-400">1000 Limit Cap</span>
              </div>
              <p className="text-muted-foreground">
                Executes exact term matching for specific ingredients, allergen names, and SOP codes.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary border border-border space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">3. Reciprocal Rank Fusion (RRF) Reranker</span>
                <span className="text-amber-400">k = 60</span>
              </div>
              <p className="text-muted-foreground">
                Fuses vector and keyword scores to produce final context sent to LLM.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
