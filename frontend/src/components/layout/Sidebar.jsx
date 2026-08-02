import { useState, useContext } from "react";
import {
  MessageSquare,
  Database,
  GitCompare,
  BarChart3,
  Plus,
  Trash2,
  Utensils,
  Sparkles,
  Layers,
  Search,
  LogOut,
  User,
  ShieldCheck,
  X,
  Settings,
} from "lucide-react";
import ChatHistory from "../chat/ChatHistory";
import { AuthContext } from "../../context/AuthContext";
import { ToastContext } from "../../context/ToastContext";
import { clearAllDocuments } from "../../services/api";

export default function Sidebar({
  files = [],
  setFiles,
  activeMode = "chat",
  setActiveMode,
  onNewChat,
  onSelectHistory,
  sidebarOpen,
  setSidebarOpen,
  userProfile = { name: "Gordon Ramsay", role: "Executive Chef" },
  onOpenSettings,
}) {
  const [historySearch, setHistorySearch] = useState("");
  const { user, logout } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const totalChunks = files.reduce((acc, f) => acc + (f.chunks || 0), 0);

  const navItems = [
    { id: "chat", label: "AI Intelligence Hub", icon: MessageSquare, badge: "RAG" },
    { id: "vault", label: "Knowledge Vault", icon: Database, badge: files.length },
    { id: "compare", label: "Menu & SOP Comparator", icon: GitCompare },
    { id: "analytics", label: "System Telemetry", icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 xl:relative xl:translate-x-0 w-[290px] glass-sidebar flex flex-col transition-transform duration-300 ease-in-out h-full ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center text-emerald-400">
                <Utensils size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-foreground tracking-tight">PlateWise</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Culinary AI Assistant</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="xl:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Action */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              setActiveMode("chat");
              if (setSidebarOpen) setSidebarOpen(false);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5 group"
          >
            <span className="flex items-center gap-2">
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>New Conversation</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono text-emerald-200">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* View Switcher Nav */}
        <div className="px-3 py-2 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Platform Views
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMode(item.id);
                  if (setSidebarOpen) setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isActive ? "text-emerald-400" : "text-muted-foreground"} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* History */}
        <div className="flex-1 min-h-0 flex flex-col border-t border-border mt-2 pt-2 px-3">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recent Queries
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ChatHistory onSelectHistory={onSelectHistory} searchQuery={historySearch} />
          </div>
        </div>

        {/* Storage Meter */}
        <div className="p-3 border-t border-border">
          <div className="glass-card p-3 rounded-xl border border-border space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Layers size={13} className="text-emerald-400" />
                Knowledge Base
              </span>
              <span className="font-mono text-emerald-400 font-bold">{files.length} Files</span>
            </div>

            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${Math.min(100, files.length * 10)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
              <span>{totalChunks} Chunks indexed</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={10} /> pgvector
              </span>
            </div>
          </div>
        </div>

        {/* User Profile Card & Settings Trigger */}
        <div className="p-3 border-t border-border bg-card/40 flex items-center justify-between gap-2">
          <div
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1 p-1 rounded-lg hover:bg-accent transition-colors"
            title="Edit Profile & Settings"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <User size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate max-w-[120px]">
                {userProfile?.name || user?.email || "Gordon Ramsay"}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono truncate max-w-[120px]">
                {userProfile?.role || "Executive Chef"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Settings"
            >
              <Settings size={15} />
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Footer Contacts */}
        <div className="px-3 py-2 border-t border-border/50 bg-background/50 flex items-center justify-between text-[10px] text-muted-foreground">
          <a href="https://x.com/prsd_x" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">
            @prsd_x
          </a>
          <a href="mailto:prsdx.dev@gmail.com" className="hover:text-foreground transition">
            prsdx.dev@gmail.com
          </a>
        </div>
      </aside>
    </>
  );
}