import { useState, useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await getDocuments();
        setFiles(docs || []);
      } catch (err) {
        console.error("Error fetching indexed documents:", err);
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