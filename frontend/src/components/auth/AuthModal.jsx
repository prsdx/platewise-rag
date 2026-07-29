import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowLeft, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { ToastContext } from '../../context/ToastContext';

// ── Firebase error code → user-friendly message mapping ────────────
const AUTH_ERROR_MAP = {
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/popup-blocked': 'Popup blocked by browser. Please allow popups.',
};

function getAuthErrorMessage(error) {
  const code = error?.code || '';
  return AUTH_ERROR_MAP[code] || error?.message || 'Authentication failed. Please try again.';
}

// ── Password strength calculator ───────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: '', color: '' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-orange-500' },
    { label: 'Good', color: 'bg-amber-500' },
    { label: 'Strong', color: 'bg-emerald-500' },
    { label: 'Excellent', color: 'bg-emerald-400' },
  ];

  return { score, ...levels[score] };
}

export default function AuthModal() {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, resetPassword, isAuthModalOpen, setIsAuthModalOpen, user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  // Modes: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [animDirection, setAnimDirection] = useState('right'); // for slide transitions
  const formRef = useRef(null);

  // Auto-clear error when user types
  useEffect(() => {
    if (error) setError('');
  }, [email, password, confirmPassword, fullName]);

  // If user is logged in, don't show modal
  if (user) return null;

  const passwordStrength = getPasswordStrength(password);

  const switchMode = (newMode) => {
    setAnimDirection(newMode === 'login' ? 'left' : 'right');
    setError('');
    setResetSent(false);
    // Small delay for animation
    setTimeout(() => setMode(newMode), 10);
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
  };

  // ── Login Handler ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password);
      clearForm();
      if (showToast) showToast('Welcome back!', 'success');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Signup Handler ─────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signupWithEmail(email, password, fullName.trim());
      clearForm();
      if (showToast) showToast('Account created! Welcome aboard 🎉', 'success');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Google Login Handler ───────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      clearForm();
      if (showToast) showToast('Logged in with Google!', 'success');
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password Handler ────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setResetSent(true);
      if (showToast) showToast('Password reset email sent!', 'success');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-slate-500/5 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-zinc-500/5 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative w-full max-w-[420px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="relative px-8 pt-8 pb-6">
          {/* Back button for non-login modes */}
          {mode !== 'login' && (
            <button
              onClick={() => switchMode('login')}
              className="absolute top-8 left-8 w-8 h-8 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 border border-indigo-400/30">
              {mode === 'forgot' ? <Mail size={26} /> : <Sparkles size={26} />}
            </div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-[280px]">
              {mode === 'login' && 'Sign in to your intelligent workspace.'}
              {mode === 'signup' && 'Start analyzing documents with AI.'}
              {mode === 'forgot' && "Enter your email and we'll send you a reset link."}
            </p>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="px-8 pb-8" ref={formRef}>

          {/* ── Error Banner ─────────────────────────────────── */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* ════════════════ LOGIN MODE ════════════════ */}
          {mode === 'login' && (
            <>
              {/* Google Button */}
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border hover:bg-secondary transition-all duration-200 font-semibold text-sm mb-5 disabled:opacity-60 active:scale-[0.98]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-border w-full" />
                <div className="absolute bg-card px-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">or</div>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                {/* Email */}
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={17} />
                  <input 
                    id="login-email"
                    type="email" 
                    placeholder="Email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={17} />
                  <input 
                    id="login-password"
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Forgot password link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md shadow-indigo-500/30 hover:shadow-lg hover:from-indigo-500 hover:to-violet-500 transition-all active:scale-[0.98] disabled:opacity-60 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Shield size={16} />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Switch to signup */}
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account?</span>
                <button 
                  onClick={() => { clearForm(); switchMode('signup'); }}
                  className="ml-1.5 font-bold text-slate-400 hover:text-slate-300 transition-colors underline underline-offset-2"
                >
                  Sign Up
                </button>
              </div>
            </>
          )}

          {/* ════════════════ SIGNUP MODE ═══════════════ */}
          {mode === 'signup' && (
            <>
              {/* Google Button */}
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border hover:bg-secondary transition-all duration-200 font-semibold text-sm mb-5 disabled:opacity-60 active:scale-[0.98]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-border w-full" />
                <div className="absolute bg-card px-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">or</div>
              </div>

              <form onSubmit={handleSignup} className="space-y-3.5">
                {/* Full Name */}
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={17} />
                  <input 
                    id="signup-name"
                    type="text" 
                    placeholder="Full name" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={17} />
                  <input 
                    id="signup-email"
                    type="email" 
                    placeholder="Email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20 transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={17} />
                    <input 
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Password (min 6 characters)" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="w-full pl-11 pr-11 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2 animate-fade-in">
                      <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-secondary">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength.score ? passwordStrength.color : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[10px] font-bold mt-1 transition-colors ${
                        passwordStrength.score <= 1 ? 'text-red-500' :
                        passwordStrength.score <= 2 ? 'text-orange-500' :
                        passwordStrength.score <= 3 ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={17} />
                  <input 
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'} 
                    placeholder="Confirm password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className={`w-full pl-11 pr-11 py-3 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 transition-all ${
                      confirmPassword && confirmPassword !== password 
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                        : confirmPassword && confirmPassword === password
                          ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-border focus:border-slate-500 focus:ring-slate-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                  {/* Match indicator */}
                  {confirmPassword && confirmPassword === password && (
                    <CheckCircle2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>

                {/* Submit */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md shadow-indigo-500/30 hover:shadow-lg hover:from-indigo-500 hover:to-violet-500 transition-all active:scale-[0.98] disabled:opacity-60 flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Create Account
                    </>
                  )}
                </button>
              </form>

              {/* Switch to login */}
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account?</span>
                <button 
                  onClick={() => { clearForm(); switchMode('login'); }}
                  className="ml-1.5 font-bold text-slate-400 hover:text-slate-300 transition-colors underline underline-offset-2"
                >
                  Sign In
                </button>
              </div>
            </>
          )}

          {/* ════════════════ FORGOT PASSWORD MODE ═════════════ */}
          {mode === 'forgot' && (
            <>
              {resetSent ? (
                /* Success State */
                <div className="text-center py-4 animate-fade-in-up">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Check Your Email</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-[280px] mx-auto">
                    We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>. Check your inbox and follow the instructions.
                  </p>
                  <button
                    onClick={() => { clearForm(); switchMode('login'); setResetSent(false); }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                /* Reset Form */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={17} />
                    <input 
                      id="reset-email"
                      type="email" 
                      placeholder="Enter your email address" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/20 transition-all"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md shadow-indigo-500/30 hover:shadow-lg hover:from-indigo-500 hover:to-violet-500 transition-all active:scale-[0.98] disabled:opacity-60 flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail size={16} />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

        </div>

        {/* ── Footer Brand ──────────────────────────────────────── */}
        <div className="px-8 py-4 border-t border-border bg-secondary/30">
          <p className="text-[10px] text-muted-foreground text-center font-medium">
            Secured by <span className="font-bold">IntelliDocs AI</span> • Your data stays private
          </p>
        </div>
      </div>
    </div>
  );
}
