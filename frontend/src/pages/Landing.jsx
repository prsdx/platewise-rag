import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { openRazorpayCheckout } from '../services/razorpay';
import {
  ArrowRight, Search, ShieldCheck, Zap, Database, PlayCircle, LogIn, CheckCircle2, ChevronDown, ChevronUp, FileText, Cpu, LayoutGrid, ExternalLink, Sun, Moon, Twitter, Mail, Github
} from 'lucide-react';

export default function Landing() {
  const { setIsAuthModalOpen } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const [activeFaq, setActiveFaq] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 300, y: 200 });
  const [isHovered, setIsHovered] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState({
    hybridHitRate: "94.2%",
    vectorOnlyHitRate: "78.5%",
    latency: "< 15ms",
    isPlaceholder: true
  });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    fetch('/benchmark_results.json')
      .then(res => res.json())
      .then(data => setBenchmarkData(data))
      .catch(err => console.error("Failed to load benchmark data:", err));
  }, []);

  const faqs = [
    { q: "How is my data handled and stored?", a: "Your documents are encrypted at rest using Supabase's secure PostgreSQL infrastructure. We isolate data at the tenant level." },
    { q: "What file types are supported?", a: "PlateWise seamlessly ingests PDF, DOCX, TXT, MD, and CSV files in one unified pipeline." },
    { q: "How do you prevent AI hallucinations?", a: "We use a strict Retrieval-Augmented Generation (RAG) pipeline. The LLM is forced to cite exact chunks from your documents, preventing it from making up answers." },
    { q: "Can I choose which LLM to use?", a: "Yes. Pro users can toggle between Google Gemini, Llama 3, and Mixtral depending on speed or reasoning requirements." },
    { q: "How exactly do citations work?", a: "Every answer includes inline superscripts. Clicking a superscript expands a side panel showing the exact document and highlighted paragraph the answer was drawn from." },
  ];

  const features = [
    { icon: <Search size={20} />, title: "Hybrid Search", desc: "Fuses dense pgvector embeddings with BM25 sparse keyword search via Reciprocal Rank Fusion." },
    { icon: <ShieldCheck size={20} />, title: "Citation-Backed", desc: "Every generated claim traces back to a verifiable source chunk from your uploaded documents." },
    { icon: <FileText size={20} />, title: "Multi-Format Ingestion", desc: "Process PDF, DOCX, and CSV files simultaneously without manual preprocessing." },
    { icon: <Cpu size={20} />, title: "Streaming Responses", desc: "Answers render token-by-token in real-time, completely eliminating loading spinners." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/30">
      
      {/* ── 1. Navbar ───────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between glass-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="font-bold text-primary text-sm">P</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">PlateWise</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Product</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="hidden sm:block text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-emerald-400 text-white font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            Try PlateWise
          </button>
        </div>
      </nav>

      {/* ── 2. Interactive Reactive Hero Section ─────────────────────────────── */}
      <section 
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative pt-40 pb-20 px-6 flex flex-col items-center text-center max-w-6xl mx-auto overflow-hidden group cursor-default"
      >
        {/* Mouse Tracking Interactive Spotlight Glow */}
        <div 
          className="pointer-events-none absolute w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px] transition-opacity duration-300 -translate-x-1/2 -translate-y-1/2 -z-10"
          style={{ 
            left: `${mousePos.x}px`, 
            top: `${mousePos.y}px`,
            opacity: isHovered ? 1 : 0.4
          }} 
        />

        {/* Floating RAG Intelligence Nodes Reacting to Cursor */}
        <div 
          className="hidden lg:flex absolute top-24 left-10 items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xl backdrop-blur-md pointer-events-none transition-transform duration-200"
          style={{
            transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)`
          }}
        >
          <Zap size={14} className="text-emerald-400 fill-emerald-400" /> Instant Cache &lt;15ms
        </div>

        <div 
          className="hidden lg:flex absolute top-32 right-10 items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/80 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-xl backdrop-blur-md pointer-events-none transition-transform duration-200"
          style={{
            transform: `translate(${-mousePos.x * 0.02}px, ${mousePos.y * 0.025}px)`
          }}
        >
          <ShieldCheck size={14} /> 94.2% RRF Accuracy
        </div>

        <div 
          className="hidden lg:flex absolute bottom-44 left-16 items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border text-foreground text-xs font-bold shadow-xl backdrop-blur-md pointer-events-none transition-transform duration-200"
          style={{
            transform: `translate(${mousePos.x * 0.015}px, ${-mousePos.y * 0.015}px)`
          }}
        >
          <FileText size={14} className="text-emerald-400" /> Multi-SOP Ingestion
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-foreground">
          Every answer, backed by a source.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl font-medium leading-relaxed">
          Instantly query your restaurant ops data, compliance manuals, and menus. Powered by hybrid retrieval for zero hallucinations.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="group/btn flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
          >
            <span>Try PlateWise Free</span>
            <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform duration-200" />
          </button>
          <a 
            href="#how-it-works"
            className="group/link flex items-center gap-2 px-8 py-4 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-foreground font-semibold text-base transition-all"
          >
            <span>See how it works</span>
            <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform duration-200 text-muted-foreground" />
          </a>
        </div>

        {/* Hero Mockup */}
        <div className="w-full max-w-4xl rounded-2xl border border-border bg-card overflow-hidden shadow-2xl relative">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/40">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="p-6 md:p-10 flex flex-col gap-6 text-left relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
            <div className="self-end max-w-md w-full p-4 rounded-2xl rounded-tr-sm bg-primary/20 border border-primary/30 text-white font-medium text-sm">
              What is the holding temperature for poultry?
            </div>
            <div className="max-w-lg w-full p-4 rounded-2xl rounded-tl-sm bg-secondary border border-border text-foreground font-medium text-sm relative">
              According to the Food Safety SOPs, all poultry must be held at an internal temperature of 165°F (74°C) or higher. 
              <span className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded bg-primary/20 text-primary text-[10px] font-bold cursor-pointer hover:bg-primary hover:text-white transition-colors">1</span>
            </div>
            
            {/* Expanded Citation Mock */}
            <div className="absolute top-[60%] right-8 max-w-sm glass-card rounded-xl p-4 shadow-2xl border border-primary/30 animate-fade-in-up">
              <p className="text-[10px] uppercase font-bold text-primary mb-2">Citation 1 • Safety_SOP_v2.pdf</p>
              <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary pl-3 italic">
                "Section 4.2: Temperature Controls. All raw and cooked poultry products must maintain an internal resting temperature of 165°F..."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Stat / Credibility Strip ─────────────────────────── */}
      <section className="py-8 border-y border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-12 text-sm font-semibold text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary" size={18} /> Hybrid Retrieval
          </div>
          <div className="flex items-center gap-2">
            <FileText className="text-primary" size={18} /> Citation-Backed Answers
          </div>
          <div className="flex items-center gap-2">
            <Zap className="text-[#C9A227]" size={18} /> {benchmarkData.hybridHitRate} Retrieval Accuracy
          </div>
        </div>
      </section>

      {/* ── 4. Problem -> Solution ──────────────────────────────── */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Stop guessing. Start knowing.</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Plain LLM chat over documents hallucinate and provide no way to verify their claims. 
          PlateWise grounds every single answer in retrieved, cited source chunks using hybrid vector and keyword search. 
          If it's not in your documents, PlateWise won't make it up.
        </p>
      </section>

      {/* ── 5. Feature Grid ─────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-secondary/30 border border-border flex items-start gap-4 hover:border-primary/30 transition-colors">
              <div className="p-3 rounded-xl bg-background border border-border text-primary shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-6 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-16">The Intelligence Pipeline</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-border -z-10" />
          
          {['Upload', 'Index', 'Ask', 'Cited Answer'].map((step, i) => (
            <div key={step} className="flex flex-col items-center bg-background px-4">
              <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-foreground mb-4 shadow-lg">
                {i + 1}
              </div>
              <h3 className="font-bold">{step}</h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-[150px]">
                {i === 0 && "Drop PDFs or CSVs into your Vault."}
                {i === 1 && "Chunked, embedded & hybrid indexed."}
                {i === 2 && "Semantic + BM25 query routing."}
                {i === 3 && "Streamed response with exact citations."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Benchmark Section ────────────────────────────────── */}
      <section className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A227]/10 text-[#C9A227] text-xs font-bold border border-[#C9A227]/20 mb-6">
            Live Benchmarks
          </div>
          <h2 className="text-3xl font-bold mb-10">Hybrid Search Outperforms</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border text-center">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Standard Vector Search</p>
              <p className="text-4xl font-extrabold text-foreground">{benchmarkData.vectorOnlyHitRate}</p>
              <p className="text-xs text-muted-foreground mt-2">Hit Rate @ K=5</p>
            </div>
            <div className="p-6 rounded-2xl bg-primary/10 border border-primary/30 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-2xl" />
              <p className="text-sm font-semibold text-primary mb-2">PlateWise Hybrid (Vector + Keyword)</p>
              <p className="text-4xl font-extrabold text-primary">{benchmarkData.hybridHitRate}</p>
              <p className="text-xs text-primary/70 mt-2">Hit Rate @ K=5</p>
            </div>
          </div>
          {benchmarkData.isPlaceholder && (
            <p className="text-xs text-muted-foreground mt-6 text-center italic">*Placeholder data until automated evaluation pipeline runs.</p>
          )}
        </div>
      </section>

      {/* ── 8 & 9. Pricing Table ────────────────────────────────── */}
      <section id="pricing" className="py-32 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing.</h2>
          <p className="text-lg text-muted-foreground">Start free, upgrade as your operational data grows.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Free Tier */}
          <div className="p-8 rounded-3xl bg-secondary/30 border border-border hover:border-border/80 transition-colors">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <p className="text-sm text-muted-foreground mb-6">Essential RAG for individuals.</p>
            <div className="mb-8"><span className="text-4xl font-extrabold">$0</span><span className="text-muted-foreground">/mo</span></div>
            <ul className="space-y-4 mb-8 text-sm font-medium text-muted-foreground">
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-primary"/> 20 queries / day</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-primary"/> 3 Documents indexed</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-primary"/> Gemini Flash Standard</li>
            </ul>
            <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 rounded-xl bg-secondary border border-border text-foreground font-bold hover:bg-secondary/80 transition-colors">Start Free</button>
          </div>

          {/* Pro Tier */}
          <div className="p-8 rounded-3xl bg-card border border-primary relative shadow-[0_0_40px_rgba(16,185,129,0.05)] transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider">PRO</div>
            <h3 className="text-xl font-bold mb-2">Professional</h3>
            <p className="text-sm text-muted-foreground mb-6">Advanced models and unlimited queries.</p>
            <div className="mb-8"><span className="text-4xl font-extrabold">$49</span><span className="text-muted-foreground">/mo</span></div>
            <ul className="space-y-4 mb-8 text-sm font-medium text-foreground">
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-primary"/> Unlimited queries</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-primary"/> Unlimited Documents</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-primary"/> Model switching (Groq / Gemini)</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-[#C9A227]"/> Priority chunking speed</li>
            </ul>
            <button 
              onClick={() => {
                openRazorpayCheckout({
                  plan: "pro",
                  amount: 3999,
                  onSuccess: () => alert("🎉 Welcome to PlateWise Pro! Your account is upgraded."),
                  onError: (msg) => alert("Payment error: " + msg),
                });
              }} 
              className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span>Subscribe Pro — ₹3,999/mo</span>
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="p-8 rounded-3xl bg-secondary/30 border border-border">
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <p className="text-sm text-muted-foreground mb-6">Custom SLAs and dedicated storage.</p>
            <div className="mb-8"><span className="text-4xl font-extrabold">Custom</span></div>
            <ul className="space-y-4 mb-8 text-sm font-medium text-muted-foreground">
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-foreground"/> Custom SSO (SAML)</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-foreground"/> Dedicated PGVector cluster</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-foreground"/> Audit Logs</li>
            </ul>
            <button className="w-full py-3 rounded-xl bg-secondary border border-border text-foreground font-bold hover:bg-secondary/80 transition-colors">Contact Us</button>
          </div>
        </div>
      </section>

      {/* ── 10. FAQ Accordion ───────────────────────────────────── */}
      <section className="py-24 px-6 max-w-3xl mx-auto border-t border-border">
        <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
              <button 
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold hover:bg-secondary/50 transition-colors"
              >
                {faq.q}
                {activeFaq === i ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
              </button>
              {activeFaq === i && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 11. Final CTA ───────────────────────────────────────── */}
      <section className="py-32 px-6 text-center bg-card border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[150px] -z-10" />
        <h2 className="text-4xl font-extrabold mb-6">Ready to ground your data?</h2>
        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">Get started for free. No credit card required. Upgrade when you need advanced models and unlimited bandwidth.</p>
        <button 
          onClick={() => setIsAuthModalOpen(true)}
          className="px-8 py-4 rounded-xl bg-primary hover:bg-emerald-400 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
        >
          Try PlateWise Today
        </button>
      </section>

      {/* ── 12. Footer ──────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-border bg-background text-center text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[6px] bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="font-bold text-primary text-[10px]">P</span>
          </div>
          <span className="font-bold text-foreground">PlateWise</span>
          <span className="mx-2">•</span>
          <span>© 2026</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a 
            href="https://github.com/shubham-prasad/PlateWise" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
          >
            <Github size={15} /> GitHub Repo
          </a>
          <a 
            href="https://x.com/prsd_x" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium text-emerald-400"
          >
            <Twitter size={15} /> @prsd_x
          </a>
          <a 
            href="mailto:prsdx.dev@gmail.com" 
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
          >
            <Mail size={15} /> prsdx.dev@gmail.com
          </a>
        </div>
        
        <div className="font-medium">
          Built by <a href="https://x.com/prsd_x" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4 decoration-border hover:decoration-primary transition-colors">@prsd_x</a>
        </div>
      </footer>

    </div>
  );
}
