import {
  Send,
  Loader2,
  File,
} from "lucide-react";

export default function ChatInput({
  question,
  setQuestion,
  onSubmit,
  loading,
  files = [],
  selectedDocument,
  setSelectedDocument,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Document Selector (if multiple files exist) */}
      {files.length > 0 && (
        <div className="flex items-center gap-2 self-start mb-1">
          <File size={14} className="text-indigo-500" />
          <select
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="text-xs font-semibold bg-card border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs shadow-sm cursor-pointer"
          >
            <option value="" className="bg-background text-foreground font-medium py-1">
              All Documents ({files.length})
            </option>
            {files.map((f, i) => (
              <option key={i} value={f.name} className="bg-background text-foreground font-medium py-1">
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Input Box */}
      <div className="border border-border rounded-2xl bg-background p-3 flex items-center gap-3 focus-within:border-black dark:focus-within:border-white transition-all shadow-sm">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your documents..."
          className="flex-1 bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground px-2"
        />

        {/* Send Button */}
        <button
          onClick={onSubmit}
          disabled={loading || !question.trim()}
          className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          title="Send Question"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} className="translate-x-0.5 -translate-y-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}