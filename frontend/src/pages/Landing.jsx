import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight, Search, ShieldCheck, Zap, Database, ChevronRight, PlayCircle, LogIn } from 'lucide-react';

export default function Landing() {
  const { setIsAuthModalOpen } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 overflow-x-hidden selection:bg-indigo-500/30 font-sans">
      
      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[#020617]/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="font-bold text-white text-sm">P</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">PlateWise</span>
        </div>
        <button 
          onClick={() => setIsAuthModalOpen(true)}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 transition-all duration-300 font-medium text-sm text-white"
        >
          Sign In
          <LogIn size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative pt-40 pb-20 px-6 flex flex-col items-center text-center">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none -z-10 animate-pulse-glow" />
        <div className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-violet-600/20 blur-[100px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 mb-8 animate-fade-in-up">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">PlateWise 2.0 is Live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          The intelligent brain for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">food delivery ops.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Instantly query restaurant menus, safety policies, FSSAI compliance, and SLAs. Powered by advanced hybrid RAG and Google Gemini.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-950 font-bold text-base hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 active:scale-95"
          >
            Start Analyzing Now
            <ArrowRight size={18} />
          </button>
          <button className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white font-bold text-base transition-all duration-300">
            <PlayCircle size={18} className="text-slate-300" />
            Watch Demo
          </button>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-24 relative w-full max-w-5xl animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10" />
          <div className="rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-2xl ring-1 ring-white/5">
            {/* Window controls */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            {/* Interface Mock */}
            <div className="h-[400px] flex">
              <div className="w-1/4 border-r border-slate-800 bg-slate-900/50 p-4">
                <div className="w-full h-8 bg-slate-800 rounded-lg mb-4" />
                <div className="w-3/4 h-4 bg-slate-800 rounded mb-2" />
                <div className="w-1/2 h-4 bg-slate-800 rounded" />
              </div>
              <div className="w-3/4 p-8 flex flex-col justify-end relative">
                <div className="self-end max-w-sm w-full p-4 rounded-2xl rounded-tr-sm bg-indigo-600 border border-indigo-500 mb-4 shadow-lg shadow-indigo-900/20">
                  <div className="w-3/4 h-4 bg-indigo-400 rounded mb-2" />
                  <div className="w-1/2 h-4 bg-indigo-400 rounded" />
                </div>
                <div className="max-w-md w-full p-4 rounded-2xl rounded-tl-sm bg-slate-800 border border-slate-700 mb-8 shadow-xl">
                  <div className="w-full h-4 bg-slate-600 rounded mb-2" />
                  <div className="w-5/6 h-4 bg-slate-600 rounded mb-2" />
                  <div className="w-4/6 h-4 bg-slate-600 rounded" />
                </div>
                <div className="w-full h-14 rounded-xl border border-slate-700 bg-slate-900 flex items-center px-4">
                  <div className="w-full h-4 bg-slate-700 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────── */}
      <section className="py-32 px-6 relative border-t border-slate-800 bg-[#020617]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Engineered for Operations</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Replace keyword searches and manual document parsing with deep semantic understanding.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Search />}
              title="Hybrid Retrieval"
              description="Combines pgvector dense embeddings with BM25 sparse keyword search via Reciprocal Rank Fusion for unparalleled accuracy."
            />
            <FeatureCard 
              icon={<Database />}
              title="Supabase Architecture"
              description="Multi-tenant, isolated data storage utilizing Supabase PostgreSQL and secure cloud bucket persisting."
            />
            <FeatureCard 
              icon={<Zap />}
              title="Gemini LLM Cascade"
              description="Intelligently falls back through Google's Gemini models ensuring maximum uptime and preventing quota limits."
            />
          </div>
        </div>
      </section>

      {/* ── How It Works Section ────────────────────────────────── */}
      <section className="py-24 px-6 relative bg-[#020617]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">How PlateWise Works</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Transform your raw documents into actionable intelligence in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-24 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 -z-10" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl font-black text-indigo-400 mb-6 shadow-xl shadow-indigo-900/20">1</div>
              <h3 className="text-xl font-bold mb-3">Upload Data</h3>
              <p className="text-slate-400">Securely upload PDFs, DOCX, TXT, or MD files. We automatically chunk and vector-encode your proprietary knowledge.</p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl font-black text-violet-400 mb-6 shadow-xl shadow-violet-900/20">2</div>
              <h3 className="text-xl font-bold mb-3">Hybrid Retrieval</h3>
              <p className="text-slate-400">Our pgvector engine uses dense semantic embeddings and BM25 keywords to instantly find exact matches to your query.</p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl font-black text-emerald-400 mb-6 shadow-xl shadow-emerald-900/20">3</div>
              <h3 className="text-xl font-bold mb-3">Intelligent Synthesis</h3>
              <p className="text-slate-400">Advanced LLMs (Gemini, Llama 3, GPT-4) analyze the retrieved context and generate accurate, cited, hallucination-free answers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ────────────────────────────────────── */}
      <section className="py-24 px-6 relative bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Start free, upgrade when you need more power and premium LLM capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 flex flex-col hover:border-slate-700 transition-colors">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-slate-400 mb-6">Perfect for small teams testing operations.</p>
              <div className="mb-6"><span className="text-4xl font-extrabold">$0</span><span className="text-slate-500"> / mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300"><ShieldCheck size={18} className="text-emerald-400"/> Up to 5 Documents</li>
                <li className="flex items-center gap-3 text-slate-300"><ShieldCheck size={18} className="text-emerald-400"/> Standard Speed</li>
                <li className="flex items-center gap-3 text-slate-300"><ShieldCheck size={18} className="text-emerald-400"/> Basic Gemini Models</li>
                <li className="flex items-center gap-3 text-slate-500 line-through"><ShieldCheck size={18} className="text-slate-600"/> Open Source Models</li>
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold transition">Get Started Free</button>
            </div>

            {/* Pro Tier (Highlighted) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-900/40 to-slate-900/50 border-2 border-indigo-500/50 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-900/20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-indigo-200/70 mb-6">For scaling restaurants & cloud kitchens.</p>
              <div className="mb-6"><span className="text-4xl font-extrabold">$49</span><span className="text-slate-500"> / mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-200"><ShieldCheck size={18} className="text-indigo-400"/> Unlimited Documents</li>
                <li className="flex items-center gap-3 text-slate-200"><ShieldCheck size={18} className="text-indigo-400"/> Priority Processing Speed</li>
                <li className="flex items-center gap-3 text-slate-200"><ShieldCheck size={18} className="text-indigo-400"/> Premium Proprietary Models</li>
                <li className="flex items-center gap-3 text-slate-200"><ShieldCheck size={18} className="text-indigo-400"/> Groq Open Source Inference</li>
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30">Upgrade to Pro</button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 flex flex-col hover:border-slate-700 transition-colors">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-slate-400 mb-6">Custom solutions for massive operations.</p>
              <div className="mb-6"><span className="text-4xl font-extrabold">Custom</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300"><ShieldCheck size={18} className="text-emerald-400"/> Dedicated Infrastructure</li>
                <li className="flex items-center gap-3 text-slate-300"><ShieldCheck size={18} className="text-emerald-400"/> Single Tenant Vector DB</li>
                <li className="flex items-center gap-3 text-slate-300"><ShieldCheck size={18} className="text-emerald-400"/> Bring Your Own Keys (BYOK)</li>
                <li className="flex items-center gap-3 text-slate-300"><ShieldCheck size={18} className="text-emerald-400"/> SLA & 24/7 Support</li>
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold transition">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-slate-800 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 to-[#020617] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to revolutionize your ops?</h2>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 px-10 py-5 mx-auto rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-lg hover:shadow-[0_0_50px_rgba(99,102,241,0.4)] transition-all duration-300 hover:-translate-y-1"
          >
            Get Started Free
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ── Global Footer ──────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-[#020617] pt-16 pb-8 px-6 text-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="font-bold text-white text-[10px]">P</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">PlateWise</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              The intelligent AI operating system for modern food delivery brands and restaurants.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Community</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 PlateWise Technologies. All rights reserved.</p>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            All systems operational
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800/50 transition-colors group">
      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 text-slate-300 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
