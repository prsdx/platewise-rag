import { useState, useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Workspace from "./components/layout/Workspace";
import ProfileSettingsModal from "./components/settings/ProfileSettingsModal";
import ToastContainer from "./components/ui/ToastContainer";
import { ToastProvider } from "./context/ToastContext";
import { ChatHistoryProvider } from "./context/ChatHistoryContext";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import AuthModal from "./components/auth/AuthModal";
import Landing from "./pages/Landing";
import { getDocuments, clearAllDocuments } from "./services/api";

function reportDebug(hypothesisId, location, msg, data = {}) {
  fetch("http://127.0.0.1:7777/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "blank-screen-auth",
      runId: "pre-fix",
      hypothesisId,
      location,
      msg,
      data,
      ts: Date.now(),
    }),
  }).catch(() => {});
}

function RouteDebugLogger({ user, loading }) {
  const location = useLocation();

  useEffect(() => {
    // #region debug-point C:route-transition
    reportDebug("C", "src/App.jsx:RouteDebugLogger", "[DEBUG] Route transition observed", {
      pathname: location.pathname,
      hasUser: Boolean(user),
      loading,
    });
    // #endregion
  }, [location.pathname, user, loading]);

  return null;
}

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);
  const [chatKey, setChatKey] = useState(0);
  const [activeMode, setActiveMode] = useState("chat");
  const [selectedModel, setSelectedModel] = useState("gemini-3.1-flash-lite");
  const [selectedDocument, setSelectedDocument] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("platewise_user_profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { name: "Gordon Ramsay", role: "Executive Chef", chunkLimit: 5 };
  });

  const SAMPLE_DOCS = [
    { name: "Food_Safety_SOP_v2.pdf", size: 1420000, type: "PDF", lastModified: Date.now(), chunks: 18, pages: 12, indexed: true },
    { name: "Summer_Menu_Recipes_2026.pdf", size: 2150000, type: "PDF", lastModified: Date.now(), chunks: 24, pages: 16, indexed: true },
    { name: "Allergen_Matrix_Guide.csv", size: 45000, type: "CSV", lastModified: Date.now(), chunks: 8, pages: 2, indexed: true },
  ];

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await getDocuments();
        if (Array.isArray(docs) && docs.length > 0) {
          setFiles(docs);
        } else {
          setFiles(SAMPLE_DOCS);
        }
      } catch (err) {
        console.error("Error fetching indexed documents:", err);
        setFiles(SAMPLE_DOCS);
      }
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNewChat = () => {
    setActiveHistoryItem(null);
    setChatKey((prev) => prev + 1);
  };

  const handleSelectHistory = (item) => {
    setActiveHistoryItem(item);
    setActiveMode("chat");
  };

  const handleClearAllDocuments = async () => {
    if (window.confirm("Are you sure you want to clear all indexed documents from vector store?")) {
      setFiles([]);
      try {
        await clearAllDocuments();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 selection:text-primary">
      <Navbar
        onClearAllDocuments={handleClearAllDocuments}
        filesCount={files.length}
        setSidebarOpen={setSidebarOpen}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        selectedDocument={selectedDocument}
        setSelectedDocument={setSelectedDocument}
        files={files}
        onOpenUpload={() => setActiveMode("vault")}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        <Sidebar
          files={files}
          setFiles={setFiles}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          onNewChat={handleNewChat}
          onSelectHistory={handleSelectHistory}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          userProfile={userProfile}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <Workspace
          key={chatKey}
          files={files}
          setFiles={setFiles}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          activeHistoryItem={activeHistoryItem}
          onNewChat={handleNewChat}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          selectedDocument={selectedDocument}
          setSelectedDocument={setSelectedDocument}
          userProfile={userProfile}
        />
      </div>

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </div>
  );
}

function MainApp() {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    const handleWindowError = (event) => {
      // #region debug-point B:window-error
      reportDebug("B", "src/App.jsx:window.error", "[DEBUG] Uncaught window error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
      // #endregion
    };

    const handleUnhandledRejection = (event) => {
      // #region debug-point B:unhandled-rejection
      reportDebug("B", "src/App.jsx:unhandledrejection", "[DEBUG] Unhandled promise rejection", {
        reason: event.reason?.message || String(event.reason),
      });
      // #endregion
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-sm font-semibold tracking-wider">Loading PlateWise...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <RouteDebugLogger user={user} loading={loading} />
      <AuthModal />
      <ToastContainer />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ChatHistoryProvider>
          <MainApp />
        </ChatHistoryProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
