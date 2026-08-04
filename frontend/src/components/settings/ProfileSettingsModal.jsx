import { useState, useEffect } from "react";
import {
  X,
  User,
  Settings,
  Cpu,
  Shield,
  Utensils,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  selectedModel,
  setSelectedModel,
  onClearHistory,
}) {
  const [displayName, setDisplayName] = useState(userProfile?.name || "Executive Chef");
  const [culinaryRole, setCulinaryRole] = useState(userProfile?.role || "Head Chef & Manager");
  const [model, setModel] = useState(selectedModel || "gemini-3.1-flash-lite");
  const [chunkLimit, setChunkLimit] = useState(userProfile?.chunkLimit || 5);
  const [persona, setPersona] = useState(
    userProfile?.persona || "Grounded Culinary Specialist & Food Safety Auditor"
  );

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.name || "Executive Chef");
      setCulinaryRole(userProfile.role || "Head Chef & Manager");
      setChunkLimit(userProfile.chunkLimit || 5);
      setPersona(userProfile.persona || "Grounded Culinary Specialist & Food Safety Auditor");
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = {
      name: displayName,
      role: culinaryRole,
      chunkLimit: Number(chunkLimit),
      persona,
    };

    setUserProfile(updated);
    setSelectedModel(model);

    try {
      localStorage.setItem("platewise_user_profile", JSON.stringify(updated));
    } catch (e) {}

    toast.success("Profile & Settings saved successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-xl rounded-3xl border border-border p-6 shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-primary border border-emerald-500/20 flex items-center justify-center">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Account & System Settings</h3>
            <p className="text-xs text-muted-foreground">Customize your culinary profile and RAG retrieval parameters</p>
          </div>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
          {/* Section 1: User Identity */}
          <div className="glass-card p-4 rounded-2xl border border-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User size={14} className="text-emerald-400" /> Executive Profile
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Gordon Ramsay"
                  className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Culinary Role</label>
                <select
                  value={culinaryRole}
                  onChange={(e) => setCulinaryRole(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl p-2.5 text-xs text-foreground outline-none focus:border-emerald-500/50"
                >
                  <option value="Head Chef & Manager" className="bg-popover text-foreground">Head Chef & Manager</option>
                  <option value="Executive Chef" className="bg-popover text-foreground">Executive Chef</option>
                  <option value="Restaurant Owner" className="bg-popover text-foreground">Restaurant Owner</option>
                  <option value="Food Safety Inspector" className="bg-popover text-foreground">Food Safety Inspector</option>
                  <option value="Kitchen Operator" className="bg-popover text-foreground">Kitchen Operator</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: AI Model Preference */}
          <div className="glass-card p-4 rounded-2xl border border-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Cpu size={14} className="text-teal-400" /> Default Intelligence Engine
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", desc: "Fastest response speed" },
                { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", desc: "Higher reasoning accuracy" },
                { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", desc: "Groq ultra-fast open weights" },
                { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", desc: "Groq MoE architecture" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModel(item.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    model === item.id
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-secondary border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <p className="text-xs font-bold text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: RAG Retrieval Tuning */}
          <div className="glass-card p-4 rounded-2xl border border-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sliders size={14} className="text-amber-400" /> RAG Sensitivity Tuning
            </h4>

            <div>
              <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
                <span>Passages Retrived Per Query</span>
                <span className="text-emerald-400 font-mono font-bold">{chunkLimit} Chunks</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                value={chunkLimit}
                onChange={(e) => setChunkLimit(e.target.value)}
                className="w-full accent-emerald-500 bg-secondary"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Controls how many vector chunks from your menus/SOPs are passed into the AI context window.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-muted text-muted-foreground text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Check size={15} /> Save Changes
          </button>

        </div>
      </div>
    </div>
  );
}
