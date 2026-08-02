import { useState, useContext } from "react";
import {
  User,
  Sparkles,
  ShieldCheck,
  Cpu,
  Copy,
  Check,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  FileText,
  FileJson,
  Zap,
  AlertTriangle,
  GitFork,
  RefreshCw,
} from "lucide-react";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import SourceCitations from "../ui/SourceCitations";
import RetrievedChunksPanel from "../ui/RetrievedChunksPanel";
import { ToastContext } from "../../context/ToastContext";

export default function ChatMessage({ message, userProfile, onSelectCitation }) {
  const { showToast } = useContext(ToastContext);
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [highlightedChunkId, setHighlightedChunkId] = useState(null);

  const isUser = message.sender === "user";

  const copyText = async () => {
    if (!message.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (showToast) showToast("✓ Copied to clipboard", "success");
    } catch (e) {}
  };

  const handleSelectCitation = ({ docName, pageNum, chunkNum, text, snippet, score }) => {
    const chunkKey = `chunk-${docName}-p${pageNum || 1}-c${chunkNum || 1}`;
    setHighlightedChunkId(chunkKey);
    setShowThinking(true);
    if (onSelectCitation) {
      onSelectCitation({
        document: docName,
        page: pageNum,
        chunk: chunkNum,
        text: text || snippet,
        score: score,
      });
    }
  };

  // Latency metrics
  const metrics = message.metrics;
  const embedTime = metrics?.embedding_time_ms ? `${metrics.embedding_time_ms} ms` : "< 15 ms";
  const totalTime = metrics?.total_time_ms ? `${(metrics.total_time_ms / 1000).toFixed(2)}s` : null;
  const llmModel = metrics?.llm_model;

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3 my-4 animate-fade-in">
        <div className="max-w-2xl bg-emerald-500/10 border border-emerald-500/20 rounded-2xl rounded-tr-sm p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
              {userProfile?.name || "Executive Chef"}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
            {message.text}
          </p>
        </div>

        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
          <User size={16} />
        </div>
      </div>
    );
  }

  // AI Message
  return (
    <div className="flex items-start gap-3 my-4 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
        <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center text-emerald-400">
          <Sparkles size={16} />
        </div>
      </div>

      <div className="flex-1 glass-card rounded-3xl border border-border overflow-hidden shadow-xl space-y-4 p-5 max-w-4xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-foreground">PlateWise AI</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              <ShieldCheck size={11} /> Grounded
            </span>
            {message.is_cached && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20" title="Instant response from semantic cache">
                <Zap size={11} className="text-emerald-400 fill-emerald-400" /> Instant Answer ⚡
              </span>
            )}
            {message.is_low_confidence && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                <AlertTriangle size={11} /> Low Confidence
              </span>
            )}
            {llmModel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold border border-border">
                <Cpu size={11} className="text-emerald-400" /> {llmModel.replace("gemini-", "")}
              </span>
            )}
          </div>

          <button
            onClick={copyText}
            className={`p-1.5 rounded-lg border border-border bg-secondary hover:bg-muted transition text-xs flex items-center gap-1 ${
              copied ? "text-emerald-400 border-emerald-500/30" : "text-muted-foreground"
            }`}
            title="Copy Answer"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>

        {/* Decomposed Query Reasoning Trace */}
        {message.reasoning_trace?.is_decomposed && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <GitFork size={13} /> Sub-Query Decomposition Active
            </div>
            <p className="text-muted-foreground text-[11px]">
              {message.reasoning_trace.reasoning || "Question split into sub-queries for parallel vector retrieval:"}
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-foreground font-mono">
              {message.reasoning_trace.sub_queries?.map((sq, idx) => (
                <li key={idx}>"{sq}"</li>
              ))}
            </ul>
          </div>
        )}

        {/* Message Content */}
        <div className={`text-sm ${message.is_low_confidence ? "p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5" : ""}`}>
          {message.loading && !message.text ? (
            <div className="flex items-center gap-2 text-slate-400 py-2">
              <Loader2 size={16} className="animate-spin text-emerald-400" />
              <span className="text-xs font-semibold">Generating grounded culinary response...</span>
            </div>
          ) : (
            <MarkdownRenderer content={message.text || ""} />
          )}
        </div>

        {/* Collapsible Chunks Telemetry */}
        {!message.loading && message.retrievedChunks && message.retrievedChunks.length > 0 && (
          <div className="rounded-xl border border-border bg-secondary/40 overflow-hidden">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full flex items-center justify-between px-3 py-2 bg-secondary/60 hover:bg-secondary transition text-left text-xs font-semibold text-muted-foreground gap-4"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate text-foreground text-[11px]">
                  RAG Search: {message.retrievedChunks.length} chunks retrieved ({embedTime})
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>{showThinking ? "Hide" : "Inspect"}</span>
                {showThinking ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>
            </button>

            {showThinking && (
              <div className="border-t border-border bg-secondary/80 p-3">
                <RetrievedChunksPanel
                  retrievedChunks={message.retrievedChunks}
                  highlightedChunkId={highlightedChunkId}
                />
              </div>
            )}
          </div>
        )}

        {/* Source Citations */}
        {!message.loading && message.sources && message.sources.length > 0 && (
          <SourceCitations sources={message.sources} onSelectCitation={handleSelectCitation} />
        )}
      </div>
    </div>
  );
}
