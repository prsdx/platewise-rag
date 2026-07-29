import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

/**
 * High-fidelity, lightweight syntax highlighter for code block children.
 * Uses optimized regular expressions to tokenize and highlight common languages
 * without any heavy library peer-dependency issues.
 */
function highlightSyntax(code, lang) {
  if (!code) return "";
  const language = lang ? lang.replace("language-", "").toLowerCase() : "";

  const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (!language) return escapeHtml(code);

  const rules = {
    js: {
      keywords: /\b(const|let|var|function|class|return|if|else|for|while|do|switch|case|break|continue|import|export|from|default|async|await|try|catch|finally|throw|new|this|typeof|instanceof|in|of|void|delete|debugger|with)\b/g,
      primitives: /\b(true|false|null|undefined|NaN|Infinity|console|window|document|process|global)\b/g,
    },
    python: {
      keywords: /\b(def|class|return|if|elif|else|for|while|try|except|finally|raise|import|from|as|in|is|and|or|not|lambda|with|pass|break|continue|yield|assert|global|nonlocal|del)\b/g,
      primitives: /\b(None|True|False|self|cls|print|len|range|str|int|float|dict|list|set|tuple|enumerate|zip|open)\b/g,
    },
    sql: {
      keywords: /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|AND|OR|NOT|AS|CREATE|TABLE|DROP|ALTER|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|UNION|ALL|IN|LIKE|IS|NULL|COUNT|SUM|AVG|MIN|MAX)\b/gi,
      primitives: /\b(TRUE|FALSE|NULL)\b/gi,
    },
    bash: {
      keywords: /\b(if|then|else|elif|fi|case|esac|for|while|until|do|done|in|function|return|exit|echo|cd|ls|mkdir|rm|cp|mv|grep|awk|sed|curl|wget|tar|git|npm|python|pip|sudo|systemctl|yarn|npx)\b/g,
      primitives: /\b(true|false)\b/g,
    }
  };

  const isSql = language === "sql";
  const isPython = language === "python" || language === "py";
  const isJs = ["javascript", "js", "typescript", "ts", "json"].includes(language);
  const isBash = ["bash", "sh", "shell"].includes(language);

  const text = code;
  let matches = [];

  // Match Comments
  const commentRegex = isPython || isBash
    ? /#.*/g
    : isSql
      ? /(--.*|\/\*[\s\S]*?\*\/)/g
      : /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
  let match;
  while ((match = commentRegex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: "comment", value: match[0] });
  }

  // Match Strings
  const rawStringRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g;
  while ((match = rawStringRegex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: "string", value: match[0] });
  }

  // Filter overlapping matches
  matches.sort((a, b) => a.start - b.start);
  let cleanMatches = [];
  let lastIndex = 0;
  for (let m of matches) {
    if (m.start >= lastIndex) {
      cleanMatches.push(m);
      lastIndex = m.end;
    }
  }

  // Segment text and fill tokens
  let finalTokens = [];
  lastIndex = 0;

  const fillGaps = (start, end) => {
    if (start >= end) return;
    const chunk = text.slice(start, end);
    let subMatches = [];

    // Numbers
    const numRegex = /\b(0x[\da-fA-F]+|\d+(?:\.\d+)?)\b/g;
    while ((match = numRegex.exec(chunk)) !== null) {
      subMatches.push({ start: match.index, end: match.index + match[0].length, type: "number", value: match[0] });
    }

    // Keywords and Primitives
    let keyRegex = null;
    let primRegex = null;
    if (isJs) {
      keyRegex = rules.js.keywords;
      primRegex = rules.js.primitives;
    } else if (isPython) {
      keyRegex = rules.python.keywords;
      primRegex = rules.python.primitives;
    } else if (isSql) {
      keyRegex = rules.sql.keywords;
      primRegex = rules.sql.primitives;
    } else if (isBash) {
      keyRegex = rules.bash.keywords;
      primRegex = rules.bash.primitives;
    }

    if (keyRegex) {
      keyRegex.lastIndex = 0;
      while ((match = keyRegex.exec(chunk)) !== null) {
        subMatches.push({ start: match.index, end: match.index + match[0].length, type: "keyword", value: match[0] });
      }
    }
    if (primRegex) {
      primRegex.lastIndex = 0;
      while ((match = primRegex.exec(chunk)) !== null) {
        subMatches.push({ start: match.index, end: match.index + match[0].length, type: "primitive", value: match[0] });
      }
    }

    // Function calls
    const funcRegex = /\b(\w+)(?=\()/g;
    while ((match = funcRegex.exec(chunk)) !== null) {
      subMatches.push({ start: match.index, end: match.index + match[0].length, type: "function", value: match[0] });
    }

    // Sort submatches
    subMatches.sort((a, b) => a.start - b.start);
    let subClean = [];
    let subLast = 0;
    for (let sm of subMatches) {
      if (sm.start >= subLast) {
        subClean.push(sm);
        subLast = sm.end;
      }
    }

    let lastSubIdx = 0;
    for (let sm of subClean) {
      if (sm.start > lastSubIdx) {
        finalTokens.push({ type: "normal", value: chunk.slice(lastSubIdx, sm.start) });
      }
      finalTokens.push({ type: sm.type, value: sm.value });
      lastSubIdx = sm.end;
    }
    if (lastSubIdx < chunk.length) {
      finalTokens.push({ type: "normal", value: chunk.slice(lastSubIdx) });
    }
  };

  for (let m of cleanMatches) {
    if (m.start > lastIndex) {
      fillGaps(lastIndex, m.start);
    }
    finalTokens.push({ type: m.type, value: m.value });
    lastIndex = m.end;
  }
  if (lastIndex < text.length) {
    fillGaps(lastIndex, text.length);
  }

  return finalTokens
    .map((t) => {
      const val = escapeHtml(t.value);
      if (t.type === "comment") return `<span class="text-slate-400 italic">${val}</span>`;
      if (t.type === "string") return `<span class="text-emerald-400">${val}</span>`;
      if (t.type === "keyword") return `<span class="text-pink-400 font-bold">${val}</span>`;
      if (t.type === "primitive") return `<span class="text-cyan-400 font-semibold">${val}</span>`;
      if (t.type === "number") return `<span class="text-amber-400">${val}</span>`;
      if (t.type === "function") return `<span class="text-sky-300">${val}</span>`;
      return val;
    })
    .join("");
}

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = String(children).replace(/\n$/, "");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedHtml = highlightSyntax(
    String(children).replace(/\n$/, ""),
    className
  );

  return (
    <div className="relative group my-4 rounded-xl border border-border bg-slate-955 text-slate-100 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 text-xs font-mono text-slate-400">
        <span>{className?.replace("language-", "") || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 hover:text-slate-100 text-slate-300 transition"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-green-400" />
              <span className="text-green-400 font-sans text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="font-sans text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-sm leading-relaxed custom-scrollbar bg-slate-950">
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </div>
  );
}

/**
 * Recursively retrieves the raw text string from React children nodes.
 */
function getText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getText).join("");
  if (node.props && node.props.children) return getText(node.props.children);
  return "";
}

/**
 * Pre-processes text to clean up raw LaTeX math expressions like $p(y|x)$ or $$...$$
 * and strips any bracketed citation tags to ensure text flows 100% cleanly.
 */
function cleanMathSyntax(text) {
  if (!text) return "";

  let cleaned = text;

  // Completely strip bracketed citations [DocName, Page X...] for 100% clean text
  cleaned = cleaned.replace(
    /\[([^\n\]]+?),\s*Page\s*(\d+)(?::\s*["“'`\s]*(.*?)["”'`\s]*)?\]/gi,
    ""
  );

  // Clean block math $$...$$ -> inline code (not fenced code blocks)
  cleaned = cleaned.replace(/\$\$(.*?)\$\$/gs, (match, equation) => {
    const trimmed = equation.trim();
    if (!trimmed || /\.\w{2,5}$/.test(trimmed) || trimmed.length < 3) {
      return trimmed;
    }
    return `\`${trimmed}\``;
  });

  // Clean inline math $...$ -> `...`
  cleaned = cleaned.replace(/\$([^\$\n]+?)\$/g, (match, equation) => {
    const trimmed = equation.trim();
    if (!trimmed || /\.\w{2,5}$/.test(trimmed)) {
      return trimmed;
    }
    return `\`${trimmed}\``;
  });

  return cleaned;
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  const formattedContent = cleanMathSyntax(content);

  return (
    <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1
              className="text-2xl font-bold text-foreground mt-6 mb-3 scroll-m-20 border-b border-border pb-2 tracking-tight"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl font-bold text-foreground mt-6 mb-3 scroll-m-20 tracking-tight flex items-center gap-2"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-lg font-semibold text-foreground mt-4 mb-2 scroll-m-20"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="font-semibold text-foreground mt-3 mb-1.5"
              {...props}
            />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="text-foreground leading-7 mb-4 text-base" {...props} />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc space-y-2 mb-4 text-foreground pl-6"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal space-y-2 mb-4 text-foreground pl-6"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="text-foreground leading-relaxed pl-1" {...props} />
          ),

          // Code blocks & inline code
          code: ({ node, inline, className, children, ...props }) => {
            const text = String(children).replace(/\n$/, "");
            const isMultiLine = text.includes("\n");
            const isShort = text.length < 80;

            if (inline || (!isMultiLine && isShort && !className)) {
              return (
                <code
                  className="bg-blue-50 dark:bg-blue-955/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-sm font-mono border border-blue-200/80 dark:border-blue-900/80 font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          pre: ({ node, children }) => <>{children}</>,

          // Blockquotes / Highlights — with premium alerts detection (GitHub alerts style)
          blockquote: ({ node, children, ...props }) => {
            const textContent = getText(children).trim();

            const isNote = textContent.includes("[!NOTE]") || textContent.toLowerCase().includes("note:");
            const isTip = textContent.includes("[!TIP]") || textContent.toLowerCase().includes("tip:") || textContent.includes("💡");
            const isImportant = textContent.includes("[!IMPORTANT]") || textContent.includes("📌") || textContent.toLowerCase().includes("key takeaway");
            const isWarning = textContent.includes("[!WARNING]") || textContent.includes("⚠️") || textContent.toLowerCase().includes("warning:");
            const isCaution = textContent.includes("[!CAUTION]") || textContent.toLowerCase().includes("caution:");

            // Clean headers from the displayed text content
            const cleanAlertHeaders = (child) => {
              if (!child) return child;
              if (typeof child === "string") {
                return child
                  .replace(/\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/gi, "")
                  .replace(/^(note|tip|warning|important|caution):/gi, "")
                  .trim();
              }
              if (Array.isArray(child)) {
                return child.map(cleanAlertHeaders);
              }
              if (child.props && child.props.children) {
                return {
                  ...child,
                  props: {
                    ...child.props,
                    children: cleanAlertHeaders(child.props.children),
                  },
                };
              }
              return child;
            };

            const cleanedChildren = cleanAlertHeaders(children);

            if (isNote) {
              return (
                <div className="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 px-5 py-4 my-4 rounded-r-xl shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 dark:text-blue-400 text-lg mt-0.5 shrink-0">ℹ️</span>
                    <div className="text-blue-900 dark:text-blue-100 font-medium text-sm leading-relaxed [&>p]:mb-0">
                      <strong className="text-blue-855 dark:text-blue-300 block mb-1 uppercase tracking-wider text-xs">Note</strong>
                      {cleanedChildren}
                    </div>
                  </div>
                </div>
              );
            }

            if (isTip) {
              return (
                <div className="border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 px-5 py-4 my-4 rounded-r-xl shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400 text-lg mt-0.5 shrink-0">💡</span>
                    <div className="text-emerald-900 dark:text-emerald-100 font-medium text-sm leading-relaxed [&>p]:mb-0">
                      <strong className="text-emerald-800 dark:text-emerald-300 block mb-1 uppercase tracking-wider text-xs">Tip / Recommendation</strong>
                      {cleanedChildren}
                    </div>
                  </div>
                </div>
              );
            }

            if (isImportant) {
              return (
                <div className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 px-5 py-4 my-4 rounded-r-xl shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400 text-lg mt-0.5 shrink-0">📌</span>
                    <div className="text-indigo-900 dark:text-indigo-100 font-medium text-sm leading-relaxed [&>p]:mb-0">
                      <strong className="text-indigo-800 dark:text-indigo-300 block mb-1 uppercase tracking-wider text-xs">Key Takeaway</strong>
                      {cleanedChildren}
                    </div>
                  </div>
                </div>
              );
            }

            if (isWarning) {
              return (
                <div className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-4 my-4 rounded-r-xl shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-600 dark:text-amber-400 text-lg mt-0.5 shrink-0">⚠️</span>
                    <div className="text-amber-900 dark:text-amber-100 font-medium text-sm leading-relaxed [&>p]:mb-0">
                      <strong className="text-amber-800 dark:text-amber-300 block mb-1 uppercase tracking-wider text-xs">Warning</strong>
                      {cleanedChildren}
                    </div>
                  </div>
                </div>
              );
            }

            if (isCaution) {
              return (
                <div className="border-l-4 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 px-5 py-4 my-4 rounded-r-xl shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="text-rose-600 dark:text-rose-400 text-lg mt-0.5 shrink-0">🚨</span>
                    <div className="text-rose-900 dark:text-rose-100 font-medium text-sm leading-relaxed [&>p]:mb-0">
                      <strong className="text-rose-800 dark:text-rose-300 block mb-1 uppercase tracking-wider text-xs">Caution</strong>
                      {cleanedChildren}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <blockquote
                className="border-l-4 border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10 px-5 py-4 my-4 italic text-foreground rounded-r-xl shadow-2xs"
                {...props}
              >
                {children}
              </blockquote>
            );
          },

          // Premium Table Styling
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-2xl border border-border shadow-sm bg-card">
              <table
                className="w-full border-collapse text-left text-sm text-foreground"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              className="bg-secondary/60 text-foreground font-semibold border-b border-border"
              {...props}
            />
          ),
          tbody: ({ node, ...props }) => (
            <tbody
              className="divide-y divide-border text-foreground bg-card"
              {...props}
            />
          ),
          tr: ({ node, ...props }) => (
            <tr
              className="hover:bg-secondary/35 transition-colors"
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-5 py-3.5 font-bold text-foreground border-r border-border/50 last:border-r-0 uppercase text-xs tracking-wider"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-5 py-3.5 text-foreground leading-relaxed border-r border-border/40 last:border-r-0 align-top"
              {...props}
            />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-border" {...props} />
          ),

          // Strong and emphasis
          strong: ({ node, ...props }) => (
            <strong
              className="font-semibold text-foreground bg-indigo-500/5 dark:bg-indigo-400/10 px-1.5 py-0.5 rounded-sm"
              {...props}
            />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-foreground" {...props} />
          ),
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}
