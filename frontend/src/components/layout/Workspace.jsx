import { useState, useContext, useEffect } from "react";

import UploadCard from "../upload/UploadCard";
import ChatInput from "../chat/ChatInput";
import AnswerCard from "../answer/AnswerCard";
import CompareDocuments from "../compare/CompareDocuments";
import CompareResult from "../compare/CompareResult";
import Dashboard from "../dashboard/Dashboard";

import { compareDocuments, askQuestion } from "../../services/api";
import { ChatHistoryContext } from "../../context/ChatHistoryContext";
import { ToastContext } from "../../context/ToastContext";

import {
  MessageSquare,
  GitCompare,
  FileText,
  Sparkles,
  Zap,
  BarChart3,
  Layers,
  Cpu,
  HardDrive,
  LogOut,
  User,
  Bot,
  Shield,
  Brain,
  BookOpen,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

export default function Workspace({ files = [], setFiles, activeHistoryItem, onNewChat }) {
  // Context
  const { addToHistory } = useContext(ChatHistoryContext);
  const { showToast } = useContext(ToastContext);
  const { user, logout } = useContext(AuthContext);

  // Mode: "chat", "compare", "dashboard"
  const [mode, setMode] = useState("chat");

  // Chat States
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [retrievedChunks, setRetrievedChunks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState("");

  // Compare States
  const [compareLoading, setCompareLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  // Load history item when clicked from sidebar
  useEffect(() => {
    if (activeHistoryItem) {
      setQuestion(activeHistoryItem.question || "");
      setAnswer(activeHistoryItem.answer || "");
      setSources(activeHistoryItem.sources || []);
      setRetrievedChunks(activeHistoryItem.retrievedChunks || []);
      setMetrics(activeHistoryItem.metrics || null);
      setMode("chat");
    }
  }, [activeHistoryItem]);

  // Auto-select single document
  useEffect(() => {
    if (files && files.length === 1) {
      setSelectedDocument(files[0].name);
    }
  }, [files]);

  const executeQuestion = async (queryText) => {
    const q = queryText !== undefined ? queryText : question;
    if (!q || !q.trim()) return;

    setLoading(true);

    try {
      console.log("Sending question:", q, "Document:", selectedDocument || "All");
      const response = await askQuestion(q, selectedDocument || null);
      
      const ans = response.answer || "";
      const srcs = response.sources || [];
      const chunks = response.retrieved_chunks || [];
      const mtr = response.metrics || null;

      setAnswer(ans);
      setSources(srcs);
      setRetrievedChunks(chunks);
      setMetrics(mtr);

      if (q && ans) {
        addToHistory({
          question: q,
          answer: ans,
          sources: srcs,
          retrievedChunks: chunks,
          metrics: mtr,
        });
      }
    } catch (error) {
      console.error(error);
      setAnswer("Something went wrong while generating the answer. Please check if backend service is running.");
      setSources([]);
      setRetrievedChunks([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (text) => {
    setQuestion(text);
    executeQuestion(text);
  };

  // Compare Documents
  const handleCompare = async ({
    documents,
    comparisonType,
    customPrompt,
  }) => {
    setCompareLoading(true);

    try {
      setSelectedDocuments(documents);

      const response =
        await compareDocuments({
          documents,
          comparisonType,
          customPrompt,
        });

      setComparisonResult(
        response.comparison
      );
      if (showToast) showToast("Document comparison completed successfully!", "success");
    } catch (error) {
      console.error(error);
      const errMsg = error.message || "Failed to compare documents.";
      setComparisonResult(
        `### âš ï¸ Comparison Failed\n\n${errMsg}`
      );
      if (showToast) showToast(errMsg, "error");
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-background transition-colors duration-200 flex flex-col h-full min-h-0">

      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-6 py-6 flex flex-col flex-1 min-h-0 gap-6">

        {/* Top Navigation Bar & Mode Switcher */}
        <div className="animate-fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-card p-4 md:p-5 rounded-2xl border border-border shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow duration-300">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0 border border-indigo-400/30 transition-transform hover:scale-105">
              <FileText className="text-white" size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                IntelliDocs <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500 bg-clip-text text-transparent font-black">AI</span>
              </h1>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">
                Intelligent Multi-Document Analysis Platform
              </p>
            </div>
          </div>

          {/* Mode Segmented Control Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-secondary/80 border border-border/80 shrink-0 gap-1">
            <button
              onClick={() => setMode("chat")}
              className={`flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                mode === "chat"
                  ? "bg-gradient-to-r from-slate-800 to-zinc-900 text-white shadow-md shadow-slate-900/40 border border-slate-700/60 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <MessageSquare size={15} />
              <span>Chat Workspace</span>
            </button>

            <button
              onClick={() => setMode("compare")}
              className={`flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                mode === "compare"
                  ? "bg-gradient-to-r from-slate-800 to-zinc-900 text-white shadow-md shadow-slate-900/40 border border-slate-700/60 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <GitCompare size={15} />
              <span>Compare</span>
            </button>

            <button
              onClick={() => setMode("dashboard")}
              className={`flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                mode === "dashboard"
                  ? "bg-gradient-to-r from-slate-800 to-zinc-900 text-white shadow-md shadow-slate-900/40 border border-slate-700/60 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <BarChart3 size={15} />
              <span>Dashboard</span>
            </button>
          </div>

          {/* User Profile / Settings */}
          {user && (
            <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0 pl-4 border-l border-border/50">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase border border-indigo-500/50">
                {user.name ? user.name[0] : user.email[0]}
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="text-xs font-bold text-foreground">{user.name || 'User'}</span>
                <span className="text-[10px] text-muted-foreground">{user.email}</span>
              </div>
              <button 
                onClick={logout} 
                className="p-2 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {/* ==========================
            MODE 1: CHAT WORKSPACE (2-SIDE SPLIT SCREEN)
        ========================== */}
        {mode === "chat" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (4 cols) - Document Vault & Upload */}
            <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-0 animate-fade-in-up delay-100">
              <UploadCard
                files={files}
                setFiles={setFiles}
              />
            </div>

            {/* Right Column (8 cols) - AI Assistant & Answers */}
            <div className="xl:col-span-8 animate-fade-in-up delay-200 flex flex-col">
              <div className="flex flex-col bg-card rounded-[24px] border border-border p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                
                {/* Chat Header */}
                <div className="mb-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={18} className="text-slate-400" />
                      <h2 className="font-bold text-lg text-foreground">Ask Anything About Your Documents</h2>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700">
                      ⚡ SentenceTransformers (384d)
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Ask questions in natural language and receive context-grounded answers with citations.</p>
                </div>

                {/* Main Content Area */}
                <div className="mb-4 flex flex-col">
                  {(!question && !answer && !loading) ? (
                    <div className="flex-1 flex flex-col min-h-[400px]">

                      {/* ── Hero Banner with Mascot ─────────────────── */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/8 to-blue-500/10 border border-indigo-500/20 p-6 md:p-8 mb-5">
                        
                        {/* Decorative floating elements */}
                        <div className="absolute top-4 left-8 w-20 h-20 rounded-full bg-indigo-400/10 blur-2xl animate-pulse-glow" />
                        <div className="absolute bottom-2 left-1/3 w-16 h-16 rounded-full bg-violet-400/10 blur-2xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
                        <div className="absolute top-6 right-1/4 w-3 h-3 rounded-full bg-indigo-400/30 animate-float" />
                        <div className="absolute bottom-8 left-1/4 w-2 h-2 rounded-full bg-violet-400/40 animate-float" style={{ animationDelay: '1.5s' }} />
                        <div className="absolute top-1/2 left-[15%] w-1.5 h-1.5 rounded-full bg-blue-400/30 animate-float" style={{ animationDelay: '2s' }} />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                          {/* Left: Text Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={20} className="text-indigo-500" />
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">AI-Powered Workspace</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-extrabold text-foreground mb-2">
                              Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                              Leverage AI to understand your documents faster and smarter. Upload files, ask questions, and get context-grounded answers instantly.
                            </p>
                          </div>

                          {/* Right: Robot Mascot (Inline SVG — no white background) */}
                          <div className="shrink-0 hidden md:block">
                            <div className="relative">
                              <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-3xl scale-75" />
                              <svg className="relative w-36 h-36 animate-float drop-shadow-lg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Glow */}
                                <defs>
                                  <radialGradient id="botGlow" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3"/>
                                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
                                  </radialGradient>
                                  <linearGradient id="bodyGrad" x1="60" y1="50" x2="140" y2="180">
                                    <stop offset="0%" stopColor="#6366f1"/>
                                    <stop offset="100%" stopColor="#7c3aed"/>
                                  </linearGradient>
                                  <linearGradient id="faceGrad" x1="70" y1="70" x2="130" y2="130">
                                    <stop offset="0%" stopColor="#eef2ff"/>
                                    <stop offset="100%" stopColor="#c7d2fe"/>
                                  </linearGradient>
                                </defs>
                                <circle cx="100" cy="100" r="95" fill="url(#botGlow)"/>
                                {/* Antenna */}
                                <line x1="100" y1="38" x2="100" y2="52" stroke="#818cf8" strokeWidth="3" strokeLinecap="round"/>
                                <circle cx="100" cy="33" r="6" fill="#a78bfa"/>
                                <circle cx="100" cy="33" r="3" fill="#c4b5fd">
                                  <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
                                </circle>
                                {/* Body */}
                                <rect x="58" y="52" width="84" height="95" rx="28" fill="url(#bodyGrad)"/>
                                {/* Face screen */}
                                <rect x="68" y="62" width="64" height="48" rx="16" fill="url(#faceGrad)"/>
                                {/* Eyes */}
                                <circle cx="87" cy="84" r="7" fill="#4f46e5"/>
                                <circle cx="113" cy="84" r="7" fill="#4f46e5"/>
                                <circle cx="89" cy="82" r="2.5" fill="white"/>
                                <circle cx="115" cy="82" r="2.5" fill="white"/>
                                {/* Smile */}
                                <path d="M90 96 Q100 104 110 96" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                                {/* Ears */}
                                <rect x="46" y="72" width="14" height="22" rx="7" fill="#818cf8"/>
                                <rect x="140" y="72" width="14" height="22" rx="7" fill="#818cf8"/>
                                {/* Arms */}
                                <rect x="40" y="108" width="20" height="12" rx="6" fill="#818cf8"/>
                                <rect x="140" y="108" width="20" height="12" rx="6" fill="#818cf8"/>
                                {/* Belly light */}
                                <circle cx="100" cy="128" r="8" fill="#a78bfa" opacity="0.5"/>
                                <circle cx="100" cy="128" r="4" fill="#c4b5fd">
                                  <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/>
                                </circle>
                                {/* Feet */}
                                <rect x="72" y="145" width="22" height="14" rx="7" fill="#4f46e5"/>
                                <rect x="106" y="145" width="22" height="14" rx="7" fill="#4f46e5"/>
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Feature Cards Row */}
                        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                          {[
                            { icon: Brain, title: "AI-Powered Analysis", desc: "Extract insights with advanced AI models.", color: "indigo" },
                            { icon: BookOpen, title: "Multi-Format Support", desc: "PDF, DOCX, PPTX, TXT, and more.", color: "violet" },
                            { icon: Shield, title: "Secure & Private", desc: "Documents processed securely on-device.", color: "emerald" },
                            { icon: Bot, title: "Smart & Contextual", desc: "Context-aware answers with citations.", color: "blue" },
                          ].map((feat, i) => (
                            <div key={i} className="p-3.5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 hover:border-indigo-400/30 hover:shadow-sm transition-all group">
                              <div className={`w-8 h-8 rounded-lg bg-${feat.color}-500/10 text-${feat.color}-600 dark:text-${feat.color}-400 flex items-center justify-center border border-${feat.color}-500/20 mb-2.5 group-hover:scale-110 transition-transform`}>
                                <feat.icon size={16} />
                              </div>
                              <h4 className="text-xs font-bold text-foreground mb-0.5">{feat.title}</h4>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">{feat.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Suggestion Chips ─────────────────────────── */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                         {[
                           { text: "Summarize this document", icon: FileText },
                           { text: "Compare uploaded files", icon: GitCompare },
                           { text: "What are the key findings?", icon: Sparkles },
                           { text: "Extract important topics", icon: Layers },
                           { text: "Explain like I'm a beginner", icon: Zap },
                           { text: "Generate quiz questions", icon: MessageSquare }
                         ].map((chip, idx) => {
                            const Icon = chip.icon;
                            return (
                              <button
                                key={idx}
                                onClick={() => handleSuggestionClick(chip.text)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary hover:border-indigo-400/30 transition-all text-left group"
                              >
                                <Icon size={16} className="text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{chip.text}</span>
                              </button>
                            );
                         })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <AnswerCard
                        question={question}
                        answer={answer}
                        sources={sources}
                        retrievedChunks={retrievedChunks}
                        metrics={metrics}
                        loading={loading}
                      />
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="shrink-0">
                  <ChatInput
                    question={question}
                    setQuestion={setQuestion}
                    onSubmit={() => executeQuestion(question)}
                    loading={loading}
                    files={files}
                    selectedDocument={selectedDocument}
                    setSelectedDocument={setSelectedDocument}
                  />
                  
                  {/* Disclaimer */}
                  <p className="text-center text-[11px] text-muted-foreground mt-3">
                    AI responses are grounded on your document embeddings. Local embeddings run entirely on-device via sentence-transformers.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==========================
            MODE 2: COMPARE MODE
        ========================== */}
        {mode === "compare" && (
          <div className="space-y-6 animate-fade-in-up">
            <CompareDocuments
              files={files}
              onCompare={handleCompare}
              loading={compareLoading}
            />

            <CompareResult
              result={comparisonResult}
              loading={compareLoading}
              documents={selectedDocuments}
            />
          </div>
        )}

        {/* ==========================
            MODE 3: ANALYTICS DASHBOARD
        ========================== */}
        {mode === "dashboard" && (
          <Dashboard
            files={files}
            onSwitchMode={setMode}
            onSuggestionClick={handleSuggestionClick}
          />
        )}

      </div>
    </main>
  );
}
