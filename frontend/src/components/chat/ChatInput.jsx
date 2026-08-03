import { useState } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  ShieldCheck,
  Utensils,
  BookOpen,
  Cpu,
  FileText,
} from "lucide-react";

export default function ChatInput({
  question,
  setQuestion,
  onSubmit,
  loading,
  files = [],
  selectedDocument,
  setSelectedDocument,
  selectedModel,
  setSelectedModel,
}) {
  const promptPresets = [
    { label: "Allergen Audit", prompt: "List all dishes containing common allergens (nuts, dairy, gluten, shellfish) from the indexed documents." },
    { label: "Food Safety SOP", prompt: "What are the required storage temperature guidelines and shelf life for raw proteins?" },
    { label: "Recipe Costing", prompt: "Extract ingredient quantities and costs for all signature dishes mentioned in the menu." },
    { label: "Staff Training", prompt: "Summarize table service standards and hygiene compliance procedures for new staff." },
  ];

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-4xl mx-auto w-full">
      {/* Preset Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
          <Sparkles size={11} className="text-primary" /> Presets:
        </span>
        {promptPresets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuestion(p.prompt);
            }}
            className="px-3 py-1 rounded-xl bg-secondary hover:bg-emerald-500/10 text-muted-foreground hover:text-primary border border-border hover:border-emerald-500/30 text-xs font-semibold shrink-0 transition-all duration-200"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Glass Input Bar */}
      <div className="glass-card rounded-2xl border border-border p-2.5 flex items-center gap-3 focus-within:border-emerald-500/50 shadow-lg transition-all">
        {/* Document Filter Pill */}
        {files.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-secondary border border-border text-xs shrink-0">
            <BookOpen size={13} className="text-primary" />
            <select
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="" className="bg-popover text-foreground">All Docs ({files.length})</option>
              {files.map((f, i) => (
                <option key={i} value={f.name} className="bg-popover text-foreground">
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <textarea
          rows={1}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about menus, recipes, food safety SOPs, or allergen compliance..."
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground px-2 py-1.5 resize-none max-h-32"
        />

        {/* Send Button */}
        <button
          onClick={onSubmit}
          disabled={loading || !question.trim()}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-primary-foreground flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          title="Send Question"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={16} className="translate-x-0.5" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2">
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-primary" /> Grounded RAG with exact source citations
        </span>
        <span className="hidden sm:inline">Press <kbd className="px-1 py-0.2 rounded bg-secondary text-muted-foreground border border-border font-mono text-[10px]">Enter</kbd> to send</span>
      </div>
    </div>
  );
}