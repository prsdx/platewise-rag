import { useState, useEffect, useCallback, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Workspace from "./components/layout/Workspace";
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
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  };

  const handleClearAllDocuments = async () => {
    if (window.confirm("Are you sure you want to clear all indexed documents?")) {
      setFiles([]);
      try {
        await clearAllDocuments();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ── Protection ──
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300">
      <Navbar
        onClearAllDocuments={handleClearAllDocuments}
        filesCount={files.length}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <Sidebar
          files={files}
          setFiles={setFiles}
          onNewChat={handleNewChat}
          onSelectHistory={handleSelectHistory}
          onClearAll={handleClearAllDocuments}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <Workspace
          key={chatKey}
          files={files}
          setFiles={setFiles}
          activeHistoryItem={activeHistoryItem}
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
}

function MainApp() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
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

function App() {
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

export default App;