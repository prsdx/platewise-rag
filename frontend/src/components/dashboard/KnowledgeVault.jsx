import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  UploadCloud,
  Search,
  Trash2,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  FileCheck,
  ShieldCheck,
  HardDrive,
  Filter,
  Plus,
  X,
  Eye,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { uploadDocuments, deleteDocument } from "../../services/api";

export default function KnowledgeVault({ files = [], setFiles, onSelectDocumentFilter }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeUploads, setActiveUploads] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [inspectingFile, setInspectingFile] = useState(null);

  // Formatting helpers
  const formatSize = (bytes) => {
    const size = Number(bytes) || 0;
    if (size === 0) return "0 KB";
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileBadge = (filename) => {
    const ext = filename ? filename.split(".").pop().toUpperCase() : "FILE";
    switch (ext) {
      case "PDF":
        return { bg: "bg-red-500/10 text-red-400 border-red-500/20", icon: FileText };
      case "DOCX":
      case "DOC":
        return { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: FileText };
      case "CSV":
      case "XLSX":
        return { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: FileSpreadsheet };
      case "MD":
      case "TXT":
        return { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: FileCode };
      default:
        return { bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: FileCheck };
    }
  };

  // Upload handler
  const handleUploadFiles = async (acceptedFiles) => {
    if (!acceptedFiles || !acceptedFiles.length) return;

    setUploading(true);
    setOverallProgress(0);

    const initialItems = acceptedFiles.map((f) => ({
      name: f.name,
      size: f.size,
      extension: f.name.split(".").pop().toUpperCase(),
      status: "uploading",
      progress: 0,
    }));

    setActiveUploads(initialItems);

    try {
      const response = await uploadDocuments(
        acceptedFiles,
        ({ phase, percent }) => {
          setOverallProgress(percent);
          setActiveUploads((prev) =>
            prev.map((item) => ({
              ...item,
              progress: percent,
              status: phase === "completed" ? "completed" : phase === "indexing" ? "indexing" : "uploading",
            }))
          );
        }
      );

      const uploaded = response.uploaded || [];

      setFiles((prev) => {
        const updatedList = [...prev];
        uploaded.forEach((item, index) => {
          const matchedFile = acceptedFiles[index];
          const existingIndex = updatedList.findIndex((f) => f.name === item.filename);
          const newFileEntry = {
            name: item.filename,
            size: matchedFile?.size || 0,
            type: matchedFile?.type || "",
            lastModified: matchedFile?.lastModified || Date.now(),
            chunks: item.chunks || 0,
            pages: item.pages || 0,
            indexed: true,
          };
          if (existingIndex >= 0) {
            updatedList[existingIndex] = newFileEntry;
          } else {
            updatedList.push(newFileEntry);
          }
        });
        return updatedList;
      });

      toast.success(`${uploaded.length} document(s) successfully indexed into vector store!`);
      setShowUploadModal(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to upload document.");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setOverallProgress(0);
        setActiveUploads([]);
      }, 1200);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/markdown": [".md"],
      "text/csv": [".csv"],
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024,
    onDrop: handleUploadFiles,
  });

  const handleDelete = async (filename, e) => {
    e.stopPropagation();
    if (window.confirm(`Remove "${filename}" from the Knowledge Vault?`)) {
      try {
        await deleteDocument(filename);
        setFiles((prev) => prev.filter((f) => f.name !== filename));
        toast.success(`Removed "${filename}"`);
      } catch (err) {
        toast.error("Failed to delete document.");
      }
    }
  };

  // Filtered files
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const ext = f.name.split(".").pop().toUpperCase();
    const matchesType =
      selectedType === "ALL" ||
      (selectedType === "PDF" && ext === "PDF") ||
      (selectedType === "DOCX" && (ext === "DOCX" || ext === "DOC")) ||
      (selectedType === "TXT" && (ext === "TXT" || ext === "MD")) ||
      (selectedType === "CSV" && ext === "CSV");
    return matchesSearch && matchesType;
  });

  const totalChunks = files.reduce((acc, f) => acc + (f.chunks || 0), 0);
  const totalPages = files.reduce((acc, f) => acc + (f.pages || 1), 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-background">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                Knowledge Vault
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  RAG Vector Store
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your restaurant SOPs, Menus, Allergen Guides, and Standard Recipes
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Plus size={18} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Analytics / Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Indexed Files</p>
              <h3 className="text-3xl font-extrabold text-foreground mt-1">{files.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Active in query scope</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Vector Chunks</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{totalChunks}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles size={14} className="text-emerald-400" />
            <span>384-dim all-MiniLM embeddings</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Pages</p>
              <h3 className="text-3xl font-extrabold text-teal-400 mt-1">{totalPages}</h3>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <HardDrive size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 size={14} className="text-teal-400" />
            <span>PyMuPDF & Docx Parsers</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Vault Health</p>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-1">100%</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Supabase pgvector connected</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search menu or SOP filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary border border-border text-foreground placeholder-muted-foreground text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto custom-scrollbar pb-1 md:pb-0">
          <Filter size={14} className="text-muted-foreground shrink-0 mr-1" />
          {["ALL", "PDF", "DOCX", "TXT", "CSV"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === type
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {filteredFiles.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary border border-border mx-auto flex items-center justify-center text-muted-foreground">
            <FileText size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">No documents found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              {searchQuery
                ? `No documents match "${searchQuery}"`
                : "Your Knowledge Vault is empty. Upload menus, food safety SOPs, or ingredient lists to start querying."}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold hover:bg-emerald-500/20 transition-all"
          >
            <Plus size={16} /> Upload First File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file, idx) => {
            const badge = getFileBadge(file.name);
            const BadgeIcon = badge.icon;
            const ext = file.name.split(".").pop().toUpperCase();

            return (
              <div
                key={idx}
                className="glass-card glass-card-hover rounded-2xl p-5 border border-white/10 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Top Card Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`p-3 rounded-xl border ${badge.bg}`}>
                      <BadgeIcon size={20} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold tracking-wider">
                        INDEXED
                      </span>
                      <button
                        onClick={(e) => handleDelete(file.name, e)}
                        className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-foreground truncate" title={file.name}>
                    {file.name}
                  </h4>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-border text-center">
                    <div className="bg-secondary/60 p-2 rounded-lg border border-border">
                      <p className="text-[10px] text-muted-foreground font-medium">TYPE</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{ext}</p>
                    </div>
                    <div className="bg-secondary/60 p-2 rounded-lg border border-border">
                      <p className="text-[10px] text-muted-foreground font-medium">CHUNKS</p>
                      <p className="text-xs font-bold text-emerald-400 mt-0.5">{file.chunks || "N/A"}</p>
                    </div>
                    <div className="bg-secondary/60 p-2 rounded-lg border border-border">
                      <p className="text-[10px] text-muted-foreground font-medium">SIZE</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{formatSize(file.size)}</p>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      if (onSelectDocumentFilter) onSelectDocumentFilter(file.name);
                      toast.info(`Chat scoped to "${file.name}"`);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-secondary hover:bg-muted text-xs font-semibold text-foreground border border-border flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Sparkles size={13} className="text-emerald-400" />
                    <span>Query File</span>
                  </button>

                  <button
                    onClick={() => setInspectingFile(file)}
                    className="p-2 rounded-xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-all"
                    title="Inspect Document Details"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-xl rounded-3xl border border-border p-6 shadow-2xl relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-primary border border-emerald-500/20 flex items-center justify-center">
                <UploadCloud size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Upload Knowledge Document</h3>
                <p className="text-xs text-muted-foreground">Add menus, recipes, SOPs, or ingredient guides to RAG</p>
              </div>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                  : "border-border hover:border-emerald-500/50 bg-secondary/50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-primary border border-emerald-500/20 mx-auto mb-3 flex items-center justify-center">
                {uploading ? (
                  <Loader2 size={26} className="animate-spin" />
                ) : (
                  <UploadCloud size={26} className="animate-float" />
                )}
              </div>
              <p className="text-sm font-bold text-foreground">
                {uploading ? "Indexing in progress..." : "Drag & drop files here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, DOCX, TXT, CSV, PPTX (Max 100MB)
              </p>
            </div>

            {/* Progress */}
            {uploading && (
              <div className="mt-4 p-4 rounded-xl bg-secondary border border-border space-y-2">
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>Embedding Vectors...</span>
                  <span className="font-mono">{overallProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Inspection Modal */}
      {inspectingFile && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setInspectingFile(null)}
              className="absolute right-5 top-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Info size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground truncate max-w-[320px]">
                  {inspectingFile.name}
                </h3>
                <p className="text-xs text-muted-foreground">Vector Index & Metadata Inspector</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-secondary border border-border">
                <span className="text-muted-foreground">Collection Name</span>
                <span className="font-mono text-emerald-400">platewise_docs</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-secondary border border-border">
                <span className="text-muted-foreground">Embedding Model</span>
                <span className="font-mono text-foreground">all-MiniLM-L6-v2 (384d)</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-secondary border border-border">
                <span className="text-muted-foreground">Generated Chunks</span>
                <span className="font-mono font-bold text-foreground">{inspectingFile.chunks || 0}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-secondary border border-border">
                <span className="text-muted-foreground">Document Size</span>
                <span className="font-mono text-foreground">{formatSize(inspectingFile.size)}</span>
              </div>
            </div>

            <button
              onClick={() => setInspectingFile(null)}
              className="w-full py-2.5 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-semibold transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
