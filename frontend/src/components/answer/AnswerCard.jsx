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
  FileText as FileTxt,
  Zap,
  Cpu,
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
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
    let filename = `intellidocs-answer-${new Date().getTime()}`;
    let mimeType = "text/plain";

    if (format === "txt") {
      content = answer;
      filename += ".txt";
      mimeType = "text/plain";
    } else if (format === "markdown") {
      content = `# AI Generated Answer\n\n${answer}\n\n## Sources\n${
        sources?.map((s) => `- ${typeof s === 'string' ? s : s.document_name}`).join("\n") || "No sources"
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

  // Latency metrics calculations
  const embedTime = metrics?.embedding_time_ms ? `${metrics.embedding_time_ms} ms` : "< 15 ms";
  const totalTime = metrics?.total_time_ms ? `${(metrics.total_time_ms / 1000).toFixed(2)}s` : null;
  const llmModel = metrics?.llm_model;
  const fallbackChain = metrics?.fallback_chain;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card shrink-0 gap-4">

        {/* Left: Title & Badges */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 border border-indigo-400/30 shrink-0">
              <Sparkles size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground whitespace-nowrap">
                IntelliDocs AI Answer
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
              <ShieldCheck size={12} />
              Grounded Response
            </span>

            {/* Model Badge */}
            {llmModel && (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 whitespace-nowrap"
                title={`Fallback chain: ${fallbackChain || "N/A"}`}
              >
                <Cpu size={12} className="text-slate-400" />
                {llmModel === "mock" ? "Mock Offline AI" : llmModel.startsWith("gemini") ? `Gemini: ${llmModel.replace("gemini-", "")}` : llmModel}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            onClick={copyAnswer}
            disabled={!answer}
            className={`p-2 rounded-lg border border-border bg-card hover:bg-secondary transition text-sm flex items-center gap-1 disabled:opacity-40 ${
              copied ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Copy Answer"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>

          {/* Download Dropdown */}
          <div className="relative group">
            <button
              disabled={!answer}
              className="p-2 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition text-sm flex items-center gap-1 disabled:opacity-40"
              title="Download Answer"
            >
              <Download size={14} />
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-20 p-1">
              <button
                onClick={() => downloadAnswer("txt")}
                className="w-full text-left px-3 py-1.5 hover:bg-secondary rounded-lg flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <FileTxt size={14} />
                Text (.txt)
              </button>
              <button
                onClick={() => downloadAnswer("markdown")}
                className="w-full text-left px-3 py-1.5 hover:bg-secondary rounded-lg flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <FileText size={14} />
                Markdown (.md)
              </button>
              <button
                onClick={() => downloadAnswer("json")}
                className="w-full text-left px-3 py-1.5 hover:bg-secondary rounded-lg flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <FileJson size={14} />
                JSON (.json)
              </button>
            </div>
          </div>

          <button
            className="p-2 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-emerald-600 transition"
            title="Helpful"
          >
            <ThumbsUp size={14} />
          </button>

          <button
            className="p-2 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-rose-600 transition"
            title="Not Helpful"
          >
            <ThumbsDown size={14} />
          </button>
        </div>

      </div>

      {/* Body */}
      <div className="p-6 space-y-4 flex flex-col">

        {/* User Question Quote */}
        {question && (
          <div className="rounded-xl border border-border bg-secondary/40 p-4 flex items-start gap-3 border-l-4 border-l-indigo-500 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border shrink-0 mt-0.5">
              <User size={16} className="text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Your Question
              </span>
              <p className="text-base font-semibold text-foreground leading-relaxed whitespace-pre-wrap">
                {question}
              </p>
            </div>
          </div>
        )}

        {/* Collapsible Search and Thought Process (like ChatGPT / Gemini Thinking accordion) */}
        {!loading && retrievedChunks && retrievedChunks.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-secondary/20 overflow-hidden transition-all duration-200 shrink-0">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary/40 hover:bg-secondary/60 transition text-left text-xs font-bold text-muted-foreground gap-4"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search size={14} className="text-indigo-500 shrink-0" />
                <span className="truncate">
                  RAG Pipeline Search: retrieved {retrievedChunks.length} passages
                </span>
                <span className="hidden sm:inline-flex items-center font-mono text-[10px] bg-card px-1.5 py-0.5 rounded border border-border/50 whitespace-nowrap">
                  RRF Hybrid Search ({embedTime})
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-medium">
                  {showThinking ? "Hide Details" : "Show Details"}
                </span>
                {showThinking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>
            
            {showThinking && (
              <div className="border-t border-border/60 bg-card p-2 animate-fade-in">
                <RetrievedChunksPanel
                  retrievedChunks={retrievedChunks}
                  highlightedChunkId={highlightedChunkId}
                />
              </div>
            )}
          </div>
        )}

        {/* Answer Content */}
        <div className="rounded-xl border border-border/80 bg-card p-5 min-h-[160px] shrink-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-10">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
              <span className="text-base font-semibold text-foreground">
                Retrieving vector embeddings &amp; generating grounded response...
              </span>
              <span className="text-xs text-muted-foreground">
                Generating local 384-dimensional embeddings via sentence-transformers
              </span>
            </div>
          ) : answer ? (
            <MarkdownRenderer content={answer} />
          ) : (
            <p className="text-muted-foreground text-base leading-relaxed py-2 text-center">
              No answer generated yet. Enter a prompt above to receive grounded document insights.
            </p>
          )}
        </div>

        {/* Page Citations */}
        {!loading && sources && sources.length > 0 && (
          <div className="shrink-0">
            <SourceCitations
              sources={sources}
              onSelectCitation={handleSelectCitation}
            />
          </div>
        )}

      </div>

      {/* Footer Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-t border-border bg-secondary/20 text-muted-foreground text-xs shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono">
            <Cpu size={14} className="text-indigo-500" />
            <span>
              Embed Model: <strong className="text-foreground">all-MiniLM-L6-v2</strong> (384d)
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <Zap size={14} className="text-amber-500" />
            <span>
              Search Speed: <strong className="text-foreground">{embedTime}</strong>
            </span>
          </div>

          {totalTime && (
            <div className="flex items-center gap-1.5 font-mono">
              <Clock size={14} className="text-emerald-500" />
              <span>
                Total Latency: <strong className="text-foreground">{totalTime}</strong>
              </span>
            </div>
          )}
        </div>

        <span className="font-mono text-[11px] text-muted-foreground">
          IntelliDocs RAG • Local Embeddings Enabled
        </span>
      </div>

    </div>
  );
}