import { useState, useContext } from "react";
import {
  Menu,
  Sparkles,
  Cpu,
  UploadCloud,
  Settings,
  Activity,
  ChevronDown,
  BookOpen,
  Sun,
  Moon,
} from "lucide-react";
import { ToastContext } from "../../context/ToastContext";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";

export default function Navbar({
  filesCount = 0,
  setSidebarOpen,
  selectedModel = "gemini-3.1-flash-lite",
  setSelectedModel,
  selectedDocument = "",
  setSelectedDocument,
  files = [],
  onOpenUpload,
  onOpenSettings,
}) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const { showToast } = useContext(ToastContext);
  const { theme, toggleTheme } = useTheme();

  const models = [
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", provider: "Google AI", fast: true },
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "Google AI", recommended: true },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "Groq Cloud" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Groq Cloud" },
  ];

  const currentModelObj = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <header className="sticky top-0 z-40 h-16 glass-header flex items-center justify-between px-4 md:px-6 transition-colors duration-200">
      {/* Left: Mobile menu & Context Scope */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="xl:hidden w-9 h-9 rounded-xl border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          title="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        {/* Document Scope Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-border text-xs">
          <BookOpen size={14} className="text-primary" />
          <span className="text-muted-foreground">Context:</span>
          <select
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer text-xs"
          >
            <option value="">All Knowledge Files ({filesCount})</option>
            {files.map((f, i) => (
              <option key={i} value={f.name} className="bg-popover text-foreground">
                📄 {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Tier & Query Usage Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 border border-hairline text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-secondary-foreground">Free Plan</span>
          <span className="text-hairline">|</span>
          <span className="text-primary font-mono font-bold">14/20 queries</span>
          <a href="#pricing" className="text-[10px] text-amber-400 underline ml-1 font-bold">Upgrade</a>
        </div>
        {/* Model Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-border hover:border-emerald-500/30 text-xs font-semibold text-foreground transition-all shadow-sm"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Cpu size={14} className="text-primary" />
            <span>{currentModelObj.name}</span>
            <ChevronDown size={14} className="text-muted-foreground ml-1" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl border border-border p-2 shadow-2xl z-50 animate-pop-in space-y-1">
              <div className="px-3 py-1.5 border-b border-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select AI Reasoning Engine
                </p>
              </div>

              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id);
                    setModelDropdownOpen(false);
                    if (showToast) showToast(`Switched model to ${m.name}`, "info");
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    selectedModel === m.id
                      ? "bg-emerald-500/10 text-primary border border-emerald-500/20"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <div>
                    <p className="font-bold">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.provider}</p>
                  </div>

                  {m.recommended && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                      BEST
                    </span>
                  )}
                  {m.fast && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold">
                      FAST
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Upload */}
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-primary border border-emerald-500/20 font-semibold text-xs transition-all shadow-sm"
          >
            <UploadCloud size={14} />
            <span className="hidden sm:inline">Upload</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-xl border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          title="Account & System Settings"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}