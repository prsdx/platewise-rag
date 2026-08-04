import { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  GitCompare,
  Sparkles,
  AlertTriangle,
  FileText,
  Utensils,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function CompareDocuments({ files = [], onCompare, loading }) {
  const [document1, setDocument1] = useState("");
  const [document2, setDocument2] = useState("");
  const [comparisonType, setComparisonType] = useState("detailed");
  const [customPrompt, setCustomPrompt] = useState("");

  const safeFiles = Array.isArray(files) ? files : [];

  useEffect(() => {
    if (safeFiles.length >= 1 && !document1) {
      setDocument1(safeFiles[0].name);
    }
    if (safeFiles.length >= 2 && (!document2 || document2 === safeFiles[0]?.name)) {
      setDocument2(safeFiles[1].name);
    }
  }, [files]);

  const handleCompare = () => {
    if (!document1 || !document2) {
      alert("Please select two documents to compare.");
      return;
    }

    if (document1 === document2) {
      alert("Please select two different documents.");
      return;
    }

    if (comparisonType === "custom" && customPrompt.trim() === "") {
      alert("Please enter your custom comparison prompt.");
      return;
    }

    onCompare({
      documents: [document1, document2],
      comparisonType,
      customPrompt,
    });
  };

  const swapDocuments = () => {
    const temp = document1;
    setDocument1(document2);
    setDocument2(temp);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-background">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <GitCompare size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                Menu & Recipe Comparator
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  AI Diff Engine
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Compare menus, ingredient specs, allergen warnings, or supplier SOPs side-by-side
              </p>
            </div>
          </div>
        </div>
      </div>

      {safeFiles.length < 2 && (
        <div className="glass-card p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300 text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0" />
          <span>
            Please upload at least <strong>two documents</strong> in the Knowledge Vault to run comparisons.
          </span>
        </div>
      )}

      {/* Main Form Box */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">
        {/* Document Selection Row */}
        <div className="grid md:grid-cols-11 gap-4 items-center">
          {/* Document A */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Document A (Base)
            </label>
            <select
              value={document1}
              onChange={(e) => setDocument1(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary p-3.5 text-sm font-semibold text-foreground focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer"
            >
              <option value="">Select Document A...</option>
              {safeFiles.map((file) => (
                <option key={file.name} value={file.name} className="bg-popover text-foreground">
                  📄 {file.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center pt-5">
            <button
              type="button"
              onClick={swapDocuments}
              title="Swap selected documents"
              className="w-10 h-10 rounded-xl border border-border bg-secondary hover:bg-amber-500/20 hover:border-amber-500/30 text-foreground transition-all active:scale-95 flex items-center justify-center"
            >
              <ArrowLeftRight size={18} />
            </button>
          </div>

          {/* Document B */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Document B (Target)
            </label>
            <select
              value={document2}
              onChange={(e) => setDocument2(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary p-3.5 text-sm font-semibold text-foreground focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer"
            >
              <option value="">Select Document B...</option>
              {safeFiles.map((file) => (
                <option key={file.name} value={file.name} className="bg-popover text-foreground">
                  📄 {file.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preset Modes */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Comparison Objective
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: "detailed",
                label: "Detailed Matrix",
                desc: "Full side-by-side breakdown of ingredients, pricing & procedures",
              },
              {
                id: "similarities",
                label: "Allergen & Health Check",
                desc: "Compare allergen matrixes and cross-contamination risks",
              },
              {
                id: "summary",
                label: "Executive Summary",
                desc: "High-level takeaways for management and chef staff",
              },
              {
                id: "custom",
                label: "Custom Prompt",
                desc: "Write custom instructions for AI analysis",
              },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setComparisonType(mode.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  comparisonType === mode.id
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-300 shadow-lg shadow-amber-500/10"
                    : "bg-secondary border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <p className="font-bold text-sm text-foreground">{mode.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Textarea */}
        {comparisonType === "custom" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Custom Comparison Instructions
            </label>
            <textarea
              rows={4}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Compare the prices of pizza items between Document A and Document B and list any new topping choices..."
              className="w-full rounded-2xl border border-border bg-secondary p-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-amber-500/50 transition-all resize-none"
            />
          </div>
        )}

        {/* Run Button */}
        <button
          onClick={handleCompare}
          disabled={loading || safeFiles.length < 2}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-primary-foreground font-bold text-sm shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Sparkles size={18} />
          <span>{loading ? "Analyzing Documents..." : "Run AI Comparison"}</span>
        </button>
      </div>
    </div>
  );
}