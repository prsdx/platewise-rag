import { useState, useContext } from "react";
import {
  FileText,
  Moon,
  Sun,
  Settings,
  Trash2,
  Database,
  Activity,
  Menu,
  ChevronDown,
  LogOut,
  User as UserIcon,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import { ChatHistoryContext } from "../../context/ChatHistoryContext";
import { ToastContext } from "../../context/ToastContext";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

export default function Navbar({ onClearAllDocuments, filesCount, setSidebarOpen }) {
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { clearHistory } = useContext(ChatHistoryContext);
  const { showToast } = useContext(ToastContext);
  const { user, logout, setIsAuthModalOpen } = useContext(AuthContext);

  const checkHealth = async () => {
    setSettingsOpen(false);
    try {
      await api.get("/");
      if (showToast) showToast("Backend API is running optimally.", "success");
    } catch (err) {
      if (showToast) showToast("Cannot connect to backend API.", "error");
    }
  };

  const handleClearHistory = () => {
    setSettingsOpen(false);
    if (window.confirm("Are you sure you want to clear all chat sessions?")) {
      clearHistory();
      if (showToast) showToast("Chat history cleared.", "success");
    }
  };

  const handleClearKnowledgeBase = () => {
    setSettingsOpen(false);
    if (onClearAllDocuments) {
      onClearAllDocuments();
    }
  };

  return (
    <header className="sticky top-0 z-50 h-16 bg-card border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between px-6 transition-colors duration-200">

      {/* Left Section */}
      <div className="flex items-center gap-3">

        {/* Toggle Sidebar Button (Mobile/Tablet only) */}
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="xl:hidden w-9 h-9 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center mr-1 shrink-0"
          title="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Logo Icon Container */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 border border-indigo-400/30">
          <FileText className="text-white" size={20} strokeWidth={2.2} />
        </div>

        {/* Title & Tagline */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-foreground tracking-tight">
              PlateWise <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent font-black">AI</span>
            </h1>

            <span className="text-[10px] font-bold bg-indigo-600 text-indigo-100 px-2 py-0.5 rounded-md border border-indigo-500/50">
              PRO
            </span>
          </div>

          <p className="text-xs text-muted-foreground font-medium leading-none mt-0.5">
            Document Intelligence Platform
          </p>
        </div>

      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center"
          title={
            theme === "dark"
              ? "Switch to Light Mode"
              : "Switch to Dark Mode"
          }
        >
          {theme === "dark" ? (
            <Sun
              size={18}
              className="text-amber-400 transition-transform duration-200"
            />
          ) : (
            <Moon
              size={18}
              className="text-foreground transition-transform duration-200"
            />
          )}
        </button>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`w-9 h-9 rounded-lg border border-border transition-all duration-200 flex items-center justify-center ${settingsOpen ? "bg-muted text-foreground" : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground"}`}
            title="Settings"
          >
            <Settings
              size={18}
              className={settingsOpen ? "text-foreground" : "text-muted-foreground"}
            />
          </button>
          
          {settingsOpen && (
            <>
              {/* Backdrop to close dropdown when clicking outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setSettingsOpen(false)}
              ></div>
              
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 p-1.5 flex flex-col gap-1 overflow-hidden animate-pop-in">
                
                <div className="px-3 py-2 border-b border-border mb-1">
                  <h3 className="text-sm font-semibold text-foreground">Workspace Settings</h3>
                  <p className="text-xs text-muted-foreground">Manage your environment</p>
                </div>
                
                <button
                  onClick={handleClearHistory}
                  className="w-full text-left px-3 py-2 hover:bg-secondary rounded-lg flex items-center gap-2.5 text-sm font-medium text-foreground transition-colors"
                >
                  <Trash2 size={16} className="text-muted-foreground" />
                  Clear Chat History
                </button>
                
                <button
                  onClick={handleClearKnowledgeBase}
                  className="w-full text-left px-3 py-2 hover:bg-secondary rounded-lg flex items-center gap-2.5 text-sm font-medium text-foreground transition-colors"
                >
                  <Database size={16} className="text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>Purge Knowledge Base</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{filesCount || 0} indexed files</span>
                  </div>
                </button>
                
                <button
                  onClick={checkHealth}
                  className="w-full text-left px-3 py-2 hover:bg-secondary rounded-lg flex items-center gap-2.5 text-sm font-medium text-foreground transition-colors"
                >
                  <Activity size={16} className="text-muted-foreground" />
                  API Health Check
                </button>

              </div>
            </>
          )}
        </div>

        {/* User Profile Pill (Beside Settings) */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary transition-all duration-200 cursor-pointer shadow-sm"
              title="User Account"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <span className="text-xs font-bold text-foreground max-w-[100px] truncate hidden sm:inline">
                {user.name}
              </span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl z-50 p-2 overflow-hidden animate-pop-in">
                  <div className="p-3 border-b border-border mb-1 flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {user.provider === "google" ? "Google / Gmail Verified" : "Email Verified"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); if (showToast) showToast("Logged out successfully.", "info"); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl flex items-center gap-2.5 text-xs font-bold text-muted-foreground transition-colors cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <UserIcon size={14} />
            <span>Sign In</span>
          </button>
        )}

      </div>

    </header>
  );
}