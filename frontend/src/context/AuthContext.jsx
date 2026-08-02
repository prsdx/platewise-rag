import { createContext, useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  isFirebaseConfigured 
} from '../config/firebase';

export const AuthContext = createContext();

/**
 * Normalize Firebase/mock user into a consistent shape
 * that the rest of the app (Navbar, AuthModal, etc.) expects.
 */
function normalizeUser(firebaseUser) {
  if (!firebaseUser) return null;

  // Already normalized (mock user)
  if (firebaseUser._normalized) return firebaseUser;

  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    email: firebaseUser.email || '',
    avatar: firebaseUser.photoURL || null,
    provider: firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
    _normalized: true,
    _raw: firebaseUser, // keep raw ref for token retrieval
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ── Auth state listener ──────────────────────────────────────────
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(normalizeUser(firebaseUser));
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Mock auth — restore from localStorage
      const stored = localStorage.getItem('platewise_mock_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.apiKey) {
            setUser(parsed);
          }
        } catch (e) {
          localStorage.removeItem('platewise_mock_user');
        }
      }
      setLoading(false);
    }
  }, []);

  // ── Google Sign-In ───────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    if (isFirebaseConfigured) {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } else {
      const mockUser = {
        uid: 'google_demo_' + Date.now(),
        name: 'Demo User',
        email: 'demo@gmail.com',
        avatar: null,
        provider: 'google',
        _normalized: true,
      };
      localStorage.setItem('platewise_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { user: mockUser };
    }
  }, []);

  // ── Email/Password Sign-In ───────────────────────────────────────
  const loginWithEmail = useCallback(async (email, password) => {
    if (isFirebaseConfigured) {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } else {
      const mockUser = {
        uid: 'email_' + Date.now(),
        name: email.split('@')[0],
        email,
        avatar: null,
        provider: 'email',
        _normalized: true,
      };
      localStorage.setItem('platewise_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { user: mockUser };
    }
  }, []);

  // ── Email/Password Sign-Up ──────────────────────────────────────
  const signupWithEmail = useCallback(async (email, password, displayName) => {
    if (isFirebaseConfigured) {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Set display name on the newly created user
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      return result;
    } else {
      const mockUser = {
        uid: 'email_new_' + Date.now(),
        name: displayName || email.split('@')[0],
        email,
        avatar: null,
        provider: 'email',
        _normalized: true,
      };
      localStorage.setItem('platewise_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return { user: mockUser };
    }
  }, []);

  // ── Password Reset ──────────────────────────────────────────────
  const resetPassword = useCallback(async (email) => {
    if (isFirebaseConfigured) {
      await sendPasswordResetEmail(auth, email);
    }
    // Mock mode: silently "succeeds" — no real email sent
  }, []);

  // ── Update User Profile ─────────────────────────────────────────
  const updateUserProfile = useCallback(async (displayName) => {
    if (isFirebaseConfigured && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      // Re-normalize after update
      setUser(normalizeUser(auth.currentUser));
    } else if (user) {
      const updated = { ...user, name: displayName };
      localStorage.setItem('platewise_mock_user', JSON.stringify(updated));
      setUser(updated);
    }
  }, [user]);

  // ── Sign Out ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (isFirebaseConfigured) {
      await firebaseSignOut(auth);
    } else {
      localStorage.removeItem('platewise_mock_user');
      setUser(null);
    }
  }, []);

  // ── Get ID Token (for API auth header) ──────────────────────────
  const getIdToken = useCallback(async () => {
    if (isFirebaseConfigured && auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    // Mock mode: return a fake token
    return user ? `mock_token_${user.uid}` : null;
  }, [user]);

  const value = {
    // User state
    user,
    currentUser: user, // backward compat alias
    loading,

    // Auth modal control
    isAuthModalOpen,
    setIsAuthModalOpen,

    // Auth actions
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    resetPassword,
    updateUserProfile,
    logout,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
