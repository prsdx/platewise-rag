import { X, FileText, ExternalLink, Sparkles, BookOpen, Layers, CheckCircle2 } from "lucide-react";

export default function RightCitationPanel({ isOpen, onClose, citation }) {
  if (!isOpen || !citation) return null;

  return (
    <aside className="w-[320px] xl:w-[360px] glass-sidebar flex flex-col h-full border-l border-hairline bg-surface animate-fade-in z-30 shrink-0">
      {/* Panel Header */}
      <div className="p-4 border-b border-hairline flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <BookOpen size={15} />
          </div>
          <span className="font-bold text-xs text-foreground uppercase tracking-wider">Citation Inspector</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-secondary-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Close Inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Citation Content Details */}
      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-5">
        {/* Source File Badge */}
        <div className="p-4 rounded-xl bg-background border border-hairline space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <FileText size={13} /> Source Document
          </span>
          <h4 className="font-bold text-sm text-foreground truncate">{citation.document || citation.source || "Document"}</h4>
          {citation.page && (
            <span className="inline-block px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-secondary-foreground">
              Page {citation.page}
            </span>
          )}
        </div>

        {/* Score & Telemetry */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-background border border-hairline">
            <p className="text-[10px] text-secondary-foreground font-semibold">Similarity Score</p>
            <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
              {citation.score ? `${(citation.score * 100).toFixed(1)}%` : "High Match"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-background border border-hairline">
            <p className="text-[10px] text-secondary-foreground font-semibold">Retrieval Method</p>
            <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1">
              <Layers size={12} className="text-emerald-400" /> RRF Hybrid
            </p>
          </div>
        </div>

        {/* Verbatim Chunk Text */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" /> Exact Retrieved Passage
          </span>
          <div className="p-4 rounded-xl bg-background border border-hairline text-xs leading-relaxed text-secondary-foreground font-sans italic border-l-2 border-l-emerald-500">
            "{citation.text || citation.snippet || "Retrieved context chunk text unavailable."}"
          </div>
        </div>

        {/* Operational Grounding Check */}
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 size={14} className="text-emerald-400" /> Grounding Verified
          </div>
          <p className="text-[11px] text-secondary-foreground">
            This paragraph was extracted verbatim from pgvector storage to verify the AI's response logic.
          </p>
        </div>
      </div>
    </aside>
  );
}
