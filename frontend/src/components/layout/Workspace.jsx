import { useState, useContext, useEffect, useRef } from "react";
import ChatInput from "../chat/ChatInput";
import ChatMessage from "../chat/ChatMessage";
import CompareDocuments from "../compare/CompareDocuments";
import CompareResult from "../compare/CompareResult";
import KnowledgeVault from "../dashboard/KnowledgeVault";
import AnalyticsView from "../dashboard/AnalyticsView";
import RightCitationPanel from "../chat/RightCitationPanel";

import { compareDocuments, askQuestion } from "../../services/api";
import { ChatHistoryContext } from "../../context/ChatHistoryContext";
import { ToastContext } from "../../context/ToastContext";

import {
  Sparkles,
  Utensils,
  ShieldCheck,
  Database,
  Layers,
  MessageSquare,
} from "lucide-react";

export default function Workspace({
  files = [],
  setFiles,
  activeMode = "chat",
  setActiveMode,
  activeHistoryItem,
  onNewChat,
  selectedModel = "gemini-3.1-flash-lite",
  setSelectedModel,
  selectedDocument = "",
  setSelectedDocument,
  userProfile = { name: "Executive Chef", role: "Head Chef & Manager" },
}) {
  const { addToHistory } = useContext(ChatHistoryContext);
  const { showToast } = useContext(ToastContext);

  // Chat States: Array of messages for continuous multi-turn thread
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Right Panel Citation State
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isCitationPanelOpen, setIsCitationPanelOpen] = useState(false);
  const [comparisonResult, setComparisonResult] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [compareLoading, setCompareLoading] = useState(false);

  // Auto-scroll to bottom of chat thread when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Sync history selection from sidebar
  useEffect(() => {
    if (activeHistoryItem) {
      setMessages([
        { id: "h1", sender: "user", text: activeHistoryItem.question },
        {
          id: "h2",
          sender: "ai",
          text: activeHistoryItem.answer,
          sources: activeHistoryItem.sources || [],
          retrievedChunks: activeHistoryItem.retrievedChunks || [],
          metrics: activeHistoryItem.metrics || null,
        },
      ]);
      if (setActiveMode) setActiveMode("chat");
    }
  }, [activeHistoryItem]);

  const executeQuestion = async (queryText) => {
    const q = queryText !== undefined ? queryText : question;
    if (!q || !q.trim()) return;

    setQuestion("");
    setLoading(true);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    // Append User message and empty AI loading message to thread
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: "user", text: q },
      { id: aiMsgId, sender: "ai", text: "", loading: true },
    ]);

    try {
      const response = await askQuestion(q, selectedDocument || null, selectedModel, (streamedText) => {
        // Live stream update
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, text: streamedText, loading: false } : msg
          )
        );
      });

      const ans = response.answer || "";
      const srcs = response.sources || [];
      const chunks = response.retrieved_chunks || [];
      const mtr = response.metrics || null;

      // Final update to AI message with metadata
      const isCached = response?.is_cached || false;
      const confidenceScore = response?.confidence_score || 0.95;
      const isLowConfidence = response?.is_low_confidence || false;
      const reasoningTrace = response?.reasoning_trace || null;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: ans,
                loading: false,
                sources: srcs,
                retrievedChunks: chunks,
                metrics: mtr,
                is_cached: isCached,
                confidence_score: confidenceScore,
                is_low_confidence: isLowConfidence,
                reasoning_trace: reasoningTrace,
              }
            : msg
        )
      );

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
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: "Something went wrong while generating the answer. Please check if backend service is running.",
                loading: false,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async ({ documents, comparisonType, customPrompt }) => {
    setCompareLoading(true);
    try {
      setSelectedDocuments(documents);
      const response = await compareDocuments({
        documents,
        comparisonType,
        customPrompt,
      });

      setComparisonResult(response.comparison);
      if (showToast) showToast("Document comparison completed!", "success");
    } catch (error) {
      console.error(error);
      if (showToast) showToast(error.message || "Failed to compare documents.", "error");
    } finally {
      setCompareLoading(false);
    }
  };

  // 1. Knowledge Vault View
  if (activeMode === "vault") {
    return (
      <KnowledgeVault
        files={files}
        setFiles={setFiles}
        onSelectDocumentFilter={(docName) => {
          setSelectedDocument(docName);
          setActiveMode("chat");
        }}
      />
    );
  }

  // 2. Analytics Telemetry View
  if (activeMode === "analytics") {
    return <AnalyticsView files={files} />;
  }

  // 3. Menu & Recipe Comparator View
  if (activeMode === "compare") {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background flex flex-col">
        <CompareDocuments files={files} onCompare={handleCompare} loading={compareLoading} />
        {(compareLoading || comparisonResult) && (
          <div className="p-6 md:p-8 pt-0">
            <CompareResult result={comparisonResult} loading={compareLoading} documents={selectedDocuments} />
          </div>
        )}
      </div>
    );
  }

  // 4. Primary AI Intelligence Hub View (Multi-turn Chat Thread + 3-Panel Layout)
  return (
    <div className="flex-1 flex overflow-hidden bg-background">
      {/* Center Chat Workspace */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar flex flex-col justify-between">
        {/* Messages Stream */}
        <div className="flex-1 max-w-4xl mx-auto w-full py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center space-y-6 my-auto pt-12 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto shadow-2xl shadow-emerald-500/20">
                <div className="w-full h-full bg-background rounded-[22px] flex items-center justify-center text-primary">
                  <Utensils size={30} />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                  PlateWise <span className="gradient-text-emerald">AI Workspace</span>
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto text-sm">
                  Ask questions about your uploaded menus, SOPs, ingredient specs, or food safety manuals.
                </p>
              </div>

              {/* Clickable Suggested Queries Chips */}
              <div className="pt-4 space-y-2 max-w-xl mx-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Suggested Operational Queries</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    "What is the food safety holding temperature for chicken?",
                    "Which menu items contain tree nuts or gluten?",
                    "What is the return/refund policy for late deliveries?",
                    "Compare ingredient costs across pizza recipes"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeQuestion(chip)}
                      className="px-3.5 py-2 rounded-xl bg-surface border border-hairline hover:border-emerald-500/40 text-xs text-secondary-foreground hover:text-foreground transition-all duration-200 shadow-sm text-left font-medium"
                    >
                      💡 {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                userProfile={userProfile}
                onSelectCitation={(cit) => {
                  setSelectedCitation(cit);
                  setIsCitationPanelOpen(true);
                }}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Chat Input Bar */}
        <div className="pt-4 sticky bottom-0 bg-background pb-2 border-t border-hairline">
          <ChatInput
            question={question}
            setQuestion={setQuestion}
            onSubmit={() => executeQuestion()}
            loading={loading}
            files={files}
            selectedDocument={selectedDocument}
            setSelectedDocument={setSelectedDocument}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        </div>
      </div>

      {/* Right Citation Inspector Panel */}
      <RightCitationPanel
        isOpen={isCitationPanelOpen}
        onClose={() => setIsCitationPanelOpen(false)}
        citation={selectedCitation}
      />
    </div>
  );
}
