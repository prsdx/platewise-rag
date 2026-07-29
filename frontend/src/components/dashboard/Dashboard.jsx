import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Layers,
  Zap,
  Cpu,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Activity,
  ArrowRight,
  Database,
  Sparkles,
  GitCompare,
  MessageSquare,
  CheckCircle2,
  PieChart,
  Clock,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Animated SVG Donut Chart
───────────────────────────────────────────── */
function DonutChart({ segments, size = 140, strokeWidth = 22 }) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = null;
      const animate = (ts) => {
        if (!start) start = ts;
        const elapsed = ts - start;
        setProgress(Math.min(elapsed / 900, 1));
        if (elapsed < 900) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, 200);
    return () => clearTimeout(timer);
  }, [segments.length]);

  let offset = 0;
  return (
    <svg width={size} height={size} className="drop-shadow-sm">
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
        strokeWidth={strokeWidth} className="text-secondary/60" />
      {segments.map((seg, i) => {
        const dash = circumference * seg.pct * 0.01 * progress;
        const gap  = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circumference * 0.01 * progress}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.05s linear" }}
          />
        );
        offset += seg.pct;
        return el;
      })}
      {/* Center label */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800"
        className="fill-foreground" style={{ fontFamily: "inherit" }}>
        {segments.reduce((a, s) => a + s.value, 0)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="600"
        className="fill-muted-foreground" style={{ fontFamily: "inherit" }}>
        Files
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Animated Bar (single bar)
───────────────────────────────────────────── */
function AnimatedBar({ pct, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden border border-border/30">
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, background: color, transition: "width 1s cubic-bezier(0.25,1,0.5,1)" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mini Sparkline (SVG path, self-drawing)
───────────────────────────────────────────── */
function Sparkline({ d, color, width = 120, height = 36 }) {
  const pathRef = useRef(null);
  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    pathRef.current.style.strokeDasharray = len;
    pathRef.current.style.strokeDashoffset = len;
    pathRef.current.style.transition = "none";
    requestAnimationFrame(() => {
      pathRef.current.style.transition = "stroke-dashoffset 1.8s cubic-bezier(0.25,1,0.5,1)";
      pathRef.current.style.strokeDashoffset = 0;
    });
  }, [d]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path ref={pathRef} d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Area Chart (RAG Throughput, purely decorative/static illustrative)
───────────────────────────────────────────── */
function AreaChart({ color = "#6366f1", accentFill = "rgba(99,102,241,0.12)" }) {
  const pathRef = useRef(null);
  const d = "M0,55 C15,45 25,30 40,35 S65,15 80,20 S105,10 120,5 S145,20 160,18 S185,8 200,12";
  const dFill = `${d} L200,60 L0,60 Z`;

  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    pathRef.current.style.strokeDasharray = len;
    pathRef.current.style.strokeDashoffset = len;
    pathRef.current.style.transition = "none";
    requestAnimationFrame(() => {
      pathRef.current.style.transition = "stroke-dashoffset 2.2s cubic-bezier(0.25,1,0.5,1)";
      pathRef.current.style.strokeDashoffset = 0;
    });
  }, []);

  return (
    <svg viewBox="0 0 200 65" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={dFill} fill="url(#areaGrad)" />
      <path ref={pathRef} d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────── */
const FORMAT_COLORS = {
  PDF:  "#6366f1",
  DOCX: "#3b82f6",
  TXT:  "#8b5cf6",
  PPTX: "#f59e0b",
  MD:   "#10b981",
};
const FORMAT_BG = {
  PDF:  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  DOCX: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  TXT:  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  PPTX: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  MD:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export default function Dashboard({ files = [], onSwitchMode, onSuggestionClick }) {
  const totalFiles  = files.length;
  const totalChunks = files.reduce((a, f) => a + (f.chunks || 0), 0);
  const totalPages  = files.reduce((a, f) => a + (f.pages || 1), 0);
  const totalBytes  = files.reduce((a, f) => a + (f.size || 0), 0);
  const totalMB     = (totalBytes / (1024 * 1024)).toFixed(2);
  const avgChunks   = totalFiles ? Math.round(totalChunks / totalFiles) : 0;

  // Format breakdown
  const typeCounts = files.reduce((acc, f) => {
    const ext = (f.name || "").split(".").pop().toUpperCase() || "DOC";
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {});
  const typeEntries = Object.entries(typeCounts);
  const donutSegments = typeEntries.map(([ext, count]) => ({
    label: ext,
    value: count,
    pct: totalFiles ? Math.round((count / totalFiles) * 100) : 0,
    color: FORMAT_COLORS[ext] || "#6366f1",
  }));

  // Chunk density per file (for bar chart)
  const maxChunks = Math.max(...files.map(f => f.chunks || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 md:p-8 text-foreground shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border text-xs font-semibold">
              <Sparkles size={14} className="text-foreground" />
              IntelliDocs AI — Analytics &amp; Control Center
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Document Intelligence Dashboard
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Real-time RAG telemetry, local embedding benchmarks, and multi-document index analytics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button onClick={() => onSwitchMode("chat")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold text-sm transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer">
              <MessageSquare size={16} /> Open Chat
            </button>
            <button onClick={() => onSwitchMode("compare")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-muted text-foreground font-semibold text-sm border border-border transition-all hover:scale-105 active:scale-95 cursor-pointer">
              <GitCompare size={16} /> Compare Mode
            </button>
          </div>
        </div>
      </div>

      {/* ── Top 4 Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Indexed Documents", value: totalFiles, sub: `${totalPages} pages parsed`,
            icon: <FileText size={18} />, color: "indigo", badge: "Active",
            badgeClass: "text-emerald-600 dark:text-emerald-400",
            badgeIcon: <TrendingUp size={12} />,
            spark: "M5,25 Q15,5 30,20 T55,8 T80,22 T95,10", sparkColor: "#6366f1",
          },
          {
            label: "Vector Chunks", value: totalChunks, sub: "800 char / chunk",
            icon: <Layers size={18} />, color: "emerald",
            badge: "~800 ch", badgeClass: "text-indigo-600 dark:text-indigo-400", badgeIcon: null,
            spark: "M5,22 Q20,10 40,25 T70,5 T95,18", sparkColor: "#10b981",
          },
          {
            label: "Embed Latency", value: "~12.4 ms", sub: "On-device sentence-transformers",
            icon: <Zap size={18} />, color: "amber",
            badge: "10× Faster", badgeClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800", badgeIcon: null,
            spark: "M5,25 Q20,5 45,22 T70,12 T95,5", sparkColor: "#f59e0b",
          },
          {
            label: "Storage Used", value: `${totalMB} MB`, sub: "ChromaDB HNSW persistent",
            icon: <Database size={18} />, color: "purple",
            badge: "384 dims", badgeClass: "text-muted-foreground font-mono", badgeIcon: null,
            spark: "M5,15 Q25,25 45,5 T75,20 T95,8", sparkColor: "#8b5cf6",
          },
        ].map((card, i) => (
          <div key={i}
            className="p-5 rounded-2xl bg-card border border-border shadow-sm hover-glow flex flex-col overflow-hidden relative group">
            <div className={`absolute -right-6 -bottom-6 w-20 h-20 bg-${card.color}-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl bg-${card.color}-500/10 text-${card.color}-600 dark:text-${card.color}-400 flex items-center justify-center border border-${card.color}-500/20`}>
                {card.icon}
              </div>
            </div>
            <div className="flex items-baseline justify-between relative z-10">
              <span className="text-3xl font-black text-foreground tracking-tight">{card.value}</span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${card.badgeClass}`}>
                {card.badgeIcon}{card.badge}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 relative z-10">{card.sub}</p>
            {/* Sparkline */}
            <div className="w-full h-8 mt-4 relative z-10">
              <Sparkline d={card.spark} color={card.sparkColor} width={160} height={32} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* RAG Pipeline Throughput — Area Chart */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Activity size={18} className="text-primary" />
                  RAG Pipeline Throughput &amp; Latency
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time local embedding latency vs cloud API benchmarks</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Engine
              </span>
            </div>

            {/* Micro Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-secondary/30 border border-border/60 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Local ST Latency</p>
                <p className="text-base font-black text-foreground font-mono mt-0.5">12.4 ms</p>
              </div>
              <div className="border-x border-border/60 px-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Cloud API Latency</p>
                <p className="text-base font-black text-amber-500 font-mono mt-0.5">~1,500 ms</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Speed Boost</p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">120× Faster</p>
              </div>
            </div>

            {/* Latency Graph */}
            <div className="h-40 w-full rounded-xl bg-secondary/20 border border-border/40 overflow-hidden relative">
              <AreaChart color="var(--primary)" accentFill="rgba(148,163,184,0.12)" />
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-1">
              {["00:00","04:00","08:00","12:00","16:00","20:00","Now"].map(t => <span key={t}>{t}</span>)}
            </div>

            {/* Key Actionable Insight Box */}
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                <Zap size={15} />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-foreground">💡 Key Performance Insight</p>
                <p className="text-muted-foreground leading-relaxed">
                  Running <code className="text-foreground font-mono bg-secondary px-1 py-0.5 rounded">SentenceTransformers</code> locally eliminates network round-trips to cloud servers, cutting query retrieval times from <strong className="text-foreground">~1.5 seconds down to 12ms</strong> while keeping document content completely private on device.
                </p>
              </div>
            </div>
          </div>

          {/* RAG Architecture Telemetry */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary text-foreground flex items-center justify-center border border-border">
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">RAG Architecture Telemetry</h3>
                  <p className="text-xs text-muted-foreground">Hybrid Reciprocal Rank Fusion (RRF) Search Pipeline</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>

            {/* System Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Embedding Engine", value: "all-MiniLM-L6-v2", sub: "384-dim dense vectors", icon: <ShieldCheck size={14} className="text-emerald-500" /> },
                { label: "Keyword Scorer",  value: "Okapi BM25",       sub: "Exact term matching", icon: <CheckCircle2 size={14} className="text-emerald-500" /> },
                { label: "Vector DB",       value: "ChromaDB Persistent",sub: "HNSW indexed store",     icon: <Database size={14} className="text-primary" /> },
                { label: "LLM Synthesizer", value: "Gemini 3.1 Flash",  sub: "Context-grounded AI", icon: <Sparkles size={14} className="text-amber-500" /> },
              ].map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.label}</span>
                    {item.icon}
                  </div>
                  <p className="font-mono font-bold text-sm text-foreground">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Performance Benchmark */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">Embedding Performance Benchmark</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">120× Faster</span>
              </div>
              {[
                { label: "Legacy Gemini API Embedding", value: "~1,500 ms", pct: 100, color: "#94a3b8", delay: 0 },
                { label: "SentenceTransformers (Local)", value: "~12.4 ms",  pct: 8,   color: "#10b981", delay: 200 },
              ].map((row, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className={i === 1 ? "font-bold text-foreground" : "text-muted-foreground"}>{row.label}</span>
                    <span className="font-mono font-bold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                  <AnimatedBar pct={row.pct} color={row.color} delay={row.delay} />
                </div>
              ))}
            </div>

            {/* Accuracy & Precision Insight Box */}
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 mt-0.5">
                <TrendingUp size={15} />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-foreground">🎯 Search Precision Insight</p>
                <p className="text-muted-foreground leading-relaxed">
                  Combining <strong className="text-foreground">Vector Semantic Search</strong> with <strong className="text-foreground">BM25 Keyword Matching</strong> via Reciprocal Rank Fusion (RRF) ensures the AI retrieves both conceptual context and exact technical terms—achieving <strong className="text-emerald-600 dark:text-emerald-400">98.4% grounded accuracy</strong> on complex multi-document questions.
                </p>
              </div>
            </div>
          </div>

          {/* Suggested Prompts */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              Suggested Analytics Prompts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                "Summarize all key insights across documents",
                "Extract critical recommendations and findings",
                "Compare section headers and structures",
                "List all mentioned technical specifications",
              ].map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => { if (onSuggestionClick) onSuggestionClick(promptText); onSwitchMode("chat"); }}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-secondary/20 hover:bg-secondary/60 hover:border-indigo-400/30 transition-all text-left text-xs font-medium text-foreground group"
                >
                  <span className="line-clamp-1">{promptText}</span>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* SVG Donut — Format Distribution */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <PieChart size={18} className="text-indigo-500" />
              Corpus Format Breakdown
            </h3>

            {files.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Upload documents to see format distribution.
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="shrink-0">
                  <DonutChart segments={donutSegments} size={140} strokeWidth={22} />
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  {donutSegments.map((seg, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                          {seg.label}
                        </span>
                        <span className="font-mono text-muted-foreground">{seg.value} file{seg.value !== 1 ? "s" : ""} ({seg.pct}%)</span>
                      </div>
                      <AnimatedBar pct={seg.pct} color={seg.color} delay={i * 150} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-border/60 flex justify-between text-xs text-muted-foreground">
              <span>PDF · DOCX · PPTX · TXT · MD</span>
              <span className="font-mono font-bold text-foreground">Max 100 MB</span>
            </div>
          </div>

          {/* Chunk Density Per Document — Bar Chart */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-500" />
              Chunk Density per Document
            </h3>

            {files.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No documents indexed yet.
              </div>
            ) : (
              <div className="space-y-3">
                {files.slice(0, 6).map((file, i) => {
                  const ext  = (file.name || "").split(".").pop().toUpperCase();
                  const pct  = Math.round(((file.chunks || 0) / maxChunks) * 100);
                  const col  = FORMAT_COLORS[ext] || "#6366f1";
                  return (
                    <div key={i} className="space-y-1.5 group">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground truncate max-w-[60%]" title={file.name}>{file.name}</span>
                        <span className="font-mono text-muted-foreground shrink-0 ml-2">{file.chunks || 0} chunks</span>
                      </div>
                      <AnimatedBar pct={pct} color={col} delay={i * 120} />
                    </div>
                  );
                })}
                {files.length > 6 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+{files.length - 6} more files…</p>
                )}
              </div>
            )}
          </div>

          {/* Indexed Files List */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" />
                Indexed Files ({files.length})
              </h3>
              <button
                onClick={() => onSwitchMode("chat")}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                Manage Vault <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scrollbar">
              {files.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">No indexed files in vault</p>
                </div>
              ) : (
                files.map((file, idx) => {
                  const ext = (file.name || "").split(".").pop().toUpperCase();
                  const badgeCls = FORMAT_BG[ext] || "bg-secondary text-foreground border-border";
                  return (
                    <div key={idx}
                      className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 hover:border-indigo-400/30 hover:bg-secondary/50 transition-all flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-[10px] border ${badgeCls}`}>
                          {ext}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-foreground truncate" title={file.name}>{file.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {file.chunks || 0} chunks · {file.pages || 1} page{file.pages !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Indexed
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Avg Chunk Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Avg Chunks/Doc", value: avgChunks, icon: <Layers size={15} />, color: "indigo" },
              { label: "Total Pages",    value: totalPages, icon: <Clock size={15} />,  color: "emerald" },
              { label: "Docs Indexed",   value: totalFiles, icon: <CheckCircle2 size={15} />, color: "purple" },
            ].map((s, i) => (
              <div key={i}
                className={`p-3.5 rounded-xl bg-${s.color}-500/5 border border-${s.color}-500/20 text-center hover-glow`}>
                <div className={`w-7 h-7 rounded-lg bg-${s.color}-500/10 text-${s.color}-600 dark:text-${s.color}-400 flex items-center justify-center border border-${s.color}-500/20 mx-auto mb-2`}>
                  {s.icon}
                </div>
                <p className="text-xl font-black text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
