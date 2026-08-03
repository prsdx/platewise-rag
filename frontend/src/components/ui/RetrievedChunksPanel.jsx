import { useState } from "react";
import {
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  Cpu,
  Hash,
  Search,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export default function RetrievedChunksPanel({
  retrievedChunks = [],
  highlightedChunkId = null,
  onChunkClick = null
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedChunks, setExpandedChunks] = useState({});

  if (!retrievedChunks || retrievedChunks.length === 0) {
    return null;
  }

  const toggleChunkExpand = (id) => {
    setExpandedChunks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="mt-6 border border-border rounded-2xl bg-card overflow-hidden shadow-sm transition-all duration-300">
      {/* Panel Header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 bg-secondary hover:bg-muted transition-colors text-left border-b border-border"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Layers size={16} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground tracking-tight">
                Retrieved Context Chunks
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                RAG Pipeline Engine
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Top {retrievedChunks.length} document passages retrieved via Hybrid RRF (SentenceTransformers + BM25)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground bg-background px-2.5 py-1 rounded-lg border border-border">
            {retrievedChunks.length} Chunks
          </span>
          {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Panel Content */}
      {isOpen && (
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
          {retrievedChunks.map((chunk, idx) => {
            const chunkIdKey = `chunk-${chunk.document_name}-p${chunk.page}-c${chunk.chunk}`;
            const isHighlighted = highlightedChunkId === chunkIdKey || highlightedChunkId === chunk.chunk_id;
            const isExpanded = expandedChunks[chunk.chunk_id] ?? true;

            // Score color determination
            const score = chunk.score || 85;
            let scoreBg = "bg-emerald-500";
            let scoreTextColor = "text-emerald-600 dark:text-emerald-400";
            let scoreBorderColor = "border-emerald-500/30";
            if (score < 60) {
              scoreBg = "bg-amber-500";
              scoreTextColor = "text-amber-600 dark:text-amber-400";
              scoreBorderColor = "border-amber-500/30";
            } else if (score < 40) {
              scoreBg = "bg-rose-500";
              scoreTextColor = "text-rose-600 dark:text-rose-400";
              scoreBorderColor = "border-rose-500/30";
            }

            return (
              <div
                key={chunk.chunk_id || idx}
                id={chunkIdKey}
                className={`rounded-xl border transition-all duration-300 p-4 ${
                  isHighlighted
                    ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-500/5 shadow-md scale-[1.01]"
                    : "border-border/70 bg-card hover:border-border hover:shadow-sm"
                }`}
              >
                {/* Chunk Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <FileText size={14} className="text-indigo-500 shrink-0" />
                    <span className="font-semibold text-xs text-foreground truncate max-w-[220px] md:max-w-[320px]">
                      {chunk.document_name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border/50 shrink-0">
                      Page {chunk.page} • Chunk {chunk.chunk}
                    </span>
                  </div>

                  {/* Similarity / Relevance Score Badge & Progress Bar */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">Relevance:</span>
                      <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden border border-border/40">
                        <div
                          className={`h-full ${scoreBg} transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold font-mono ${scoreTextColor}`}>
                        {score}%
                      </span>
                    </div>

                    <button
                      onClick={() => toggleChunkExpand(chunk.chunk_id)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition"
                      title={isExpanded ? "Collapse Chunk" : "Expand Chunk"}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Hybrid Search Rank Details */}
                <div className="flex flex-wrap items-center gap-2 my-2 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/80 border border-border/50">
                    <Cpu size={10} className="text-indigo-500" />
                    Dense Vector Rank: <strong className="text-foreground">{chunk.dense_rank ? `#${chunk.dense_rank}` : 'N/A'}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/80 border border-border/50">
                    <Search size={10} className="text-emerald-500" />
                    BM25 Rank: <strong className="text-foreground">{chunk.bm25_rank ? `#${chunk.bm25_rank}` : 'N/A'}</strong>
                  </span>
                  {chunk.rrf_score && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/80 border border-border/50 font-mono">
                      RRF Fusion Score: {chunk.rrf_score}
                    </span>
                  )}
                </div>

                {/* Chunk Text Content */}
                {isExpanded && (
                  <div className="mt-2.5 p-3 rounded-lg bg-secondary/30 border border-border/50 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap select-text overflow-x-auto max-h-[220px]">
                    {chunk.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
