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
  selectedModel,
  setSelectedModel,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Settings Row: Document & Model Selector */}
      <div className="flex flex-wrap items-center gap-3 self-start mb-1">
        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <File size={14} className="text-indigo-500" />
            <select
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              className="text-xs font-semibold bg-card border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[200px] shadow-sm cursor-pointer truncate"
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

        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
          >
            <optgroup label="Premium Models">
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast)</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
              <option value="gpt-4o">GPT-4o (OpenAI)</option>
              <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
            </optgroup>
            <optgroup label="Open Source (Groq)">
              <option value="llama3-70b-8192">Llama 3 70B</option>
              <option value="llama3-8b-8192">Llama 3 8B</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              <option value="gemma-7b-it">Gemma 7B</option>
            </optgroup>
          </select>
        </div>
      </div>

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