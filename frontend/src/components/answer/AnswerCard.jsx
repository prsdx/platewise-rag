import { useState, useContext } from "react";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Sparkles,
  ShieldCheck,
  Loader2,
  User,
  Download,
  FileText,
  FileJson,
  Cpu,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { ToastContext } from "../../context/ToastContext";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import SourceCitations from "../ui/SourceCitations";
import RetrievedChunksPanel from "../ui/RetrievedChunksPanel";

export default function AnswerCard({
  question,
  answer,
  sources,
  retrievedChunks = [],
  metrics = null,
  loading,
}) {
  const { showToast } = useContext(ToastContext);
  const [highlightedChunkId, setHighlightedChunkId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const safeSources = Array.isArray(sources) ? sources : [];
  const safeChunks = Array.isArray(retrievedChunks) ? retrievedChunks : [];

  const copyAnswer = async () => {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (showToast) showToast("✓ Copied answer to clipboard", "success");
    } catch (err) {
      if (showToast) showToast("Failed to copy answer", "error");
    }
  };

  const downloadAnswer = (format) => {
    if (!answer) return;

    let content = answer;
    let filename = `platewise-answer-${new Date().getTime()}`;
    let mimeType = "text/plain";

    if (format === "txt") {
      content = answer;
      filename += ".txt";
      mimeType = "text/plain";
    } else if (format === "markdown") {
      content = `# PlateWise AI Answer\n\n${answer}\n\n## Sources\n${
        safeSources.map((s) => `- ${typeof s === "string" ? s : s.document_name}`).join("\n") || "No sources"
      }`;
      filename += ".md";
      mimeType = "text/markdown";
    } else if (format === "json") {
      content = JSON.stringify(
        {
          question,
          answer,
          sources,
          retrievedChunks,
          metrics,
          generatedAt: new Date().toISOString(),
        },
        null,
        2
      );
      filename += ".json";
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    if (showToast) showToast(`Downloaded as ${format.toUpperCase()}`, "success");
  };

  const handleSelectCitation = ({ docName, pageNum, chunkNum }) => {
    const chunkKey = `chunk-${docName}-p${pageNum || 1}-c${chunkNum || 1}`;
    setHighlightedChunkId(chunkKey);
    setShowThinking(true);
    setTimeout(() => {
      const elem = document.getElementById(chunkKey);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  };

  if (!loading && !answer && !question) {
    return null;
  }

  const embedTime = metrics?.embedding_time_ms ? `${metrics.embedding_time_ms} ms` : "< 15 ms";
  const totalTime = metrics?.total_time_ms ? `${(metrics.total_time_ms / 1000).toFixed(2)}s` : null;
  const llmModel = metrics?.llm_model;

  return (
    <div className="glass-card rounded-3xl border border-border overflow-hidden shadow-xl transition-all duration-300 flex flex-col my-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary/40 shrink-0 gap-4">
        {/* Left: Title & Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center text-primary">
              <Sparkles size={16} />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">PlateWise AI Intelligence</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-primary text-[11px] font-bold border border-emerald-500/20">
              <ShieldCheck size={12} />
              Grounded
            </span>

            {llmModel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-[11px] font-bold border border-border">
                <Cpu size={12} className="text-primary" />
                {llmModel.startsWith("gemini") ? `Gemini: ${llmModel.replace("gemini-", "")}` : llmModel}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={copyAnswer}
            disabled={!answer}
            className={`p-2 rounded-xl border border-border bg-secondary hover:bg-muted transition text-xs flex items-center gap-1.5 disabled:opacity-30 ${
              copied ? "text-primary border-emerald-500/30 bg-emerald-500/10" : "text-muted-foreground"
            }`}
            title="Copy Answer"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>

          {/* Download */}
          <div className="relative group">
            <button
              disabled={!answer}
              className="p-2 rounded-xl border border-border bg-secondary hover:bg-muted text-muted-foreground transition text-xs flex items-center gap-1.5 disabled:opacity-30"
              title="Download Answer"
            >
              <Download size={14} />
            </button>
            <div className="absolute right-0 mt-1 w-36 glass-card border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-20 p-1">
              <button
                onClick={() => downloadAnswer("txt")}
                className="w-full text-left px-3 py-1.5 hover:bg-accent rounded-lg flex items-center gap-2 text-xs font-semibold text-foreground"
              >
                <FileText size={13} /> Text (.txt)
              </button>
              <button
                onClick={() => downloadAnswer("markdown")}
                className="w-full text-left px-3 py-1.5 hover:bg-accent rounded-lg flex items-center gap-2 text-xs font-semibold text-foreground"
              >
                <FileText size={13} /> Markdown (.md)
              </button>
              <button
                onClick={() => downloadAnswer("json")}
                className="w-full text-left px-3 py-1.5 hover:bg-accent rounded-lg flex items-center gap-2 text-xs font-semibold text-foreground"
              >
                <FileJson size={13} /> JSON (.json)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4 flex flex-col">
        {/* User Question */}
        {question && (
          <div className="rounded-2xl border border-border bg-secondary/40 p-4 flex items-start gap-3 border-l-4 border-l-emerald-500">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-primary border border-emerald-500/20 flex items-center justify-center shrink-0">
              <User size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Executive Prompt
              </span>
              <p className="text-sm font-semibold text-foreground leading-relaxed whitespace-pre-wrap">
                {question}
              </p>
            </div>
          </div>
        )}

        {/* Collapsible Search and Thought Process */}
        {!loading && retrievedChunks && retrievedChunks.length > 0 && (
          <div className="rounded-2xl border border-border bg-secondary/40 overflow-hidden transition-all">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary/60 hover:bg-secondary transition text-left text-xs font-semibold text-muted-foreground gap-4"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search size={14} className="text-primary shrink-0" />
                <span className="truncate text-foreground">
                  RAG Telemetry: Retrieved {retrievedChunks.length} document passages
                </span>
                <span className="hidden sm:inline-flex items-center font-mono text-[10px] bg-muted px-2 py-0.5 rounded text-primary border border-border">
                  RRF Hybrid Search ({embedTime})
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[11px] font-medium">{showThinking ? "Hide Chunks" : "Inspect Chunks"}</span>
                {showThinking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {showThinking && (
              <div className="border-t border-border bg-secondary/80 p-3">
                <RetrievedChunksPanel
                  retrievedChunks={retrievedChunks}
                  highlightedChunkId={highlightedChunkId}
                />
              </div>
            )}
          </div>
        )}

        {/* Answer Content */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 min-h-[140px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-10">
              <Loader2 size={26} className="animate-spin text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Generating grounded culinary answer...
              </span>
              <span className="text-xs text-muted-foreground">
                Scanning pgvector database embeddings
              </span>
            </div>
          ) : answer ? (
            <MarkdownRenderer content={answer} />
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed text-center py-4">
              Enter a question above to inspect menus, recipes, or food safety guidelines.
            </p>
          )}
        </div>

        {/* Citations */}
        {!loading && sources && sources.length > 0 && (
          <SourceCitations sources={sources} onSelectCitation={handleSelectCitation} />
        )}
      </div>

      {/* Footer Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-t border-border bg-secondary/40 text-muted-foreground text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Cpu size={13} className="text-primary" />
            <span>Embedder: <strong className="text-foreground">all-MiniLM-L6-v2</strong></span>
          </div>

          {totalTime && (
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Clock size={13} className="text-teal-400" />
              <span>Latency: <strong className="text-foreground">{totalTime}</strong></span>
            </div>
          )}
        </div>

        <span className="font-mono text-[10px] text-muted-foreground">PlateWise RAG Engine</span>
      </div>
    </div>
  );
}