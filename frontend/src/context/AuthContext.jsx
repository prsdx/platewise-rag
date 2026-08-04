import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

export const AuthContext = createContext();

function normalizeUser(supabaseUser) {
  if (!supabaseUser) return null;

  return {
    uid: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email || '',
    avatar: supabaseUser.user_metadata?.avatar_url || null,
    provider: supabaseUser.app_metadata?.provider || 'email',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Fallback timeout safeguard to prevent hanging on initial load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // Check mock user in localStorage first
    try {
      const mockUser = localStorage.getItem("platewise_mock_user");
      if (mockUser) {
        const parsed = JSON.parse(mockUser);
        if (parsed && parsed.uid) {
          setUser(parsed);
          setLoading(false);
          clearTimeout(timer);
          return;
        }
      }
    } catch (e) {}

    // Check active Supabase sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(normalizeUser(session.user));
      }
      setLoading(false);
      clearTimeout(timer);
    }).catch(() => {
      setLoading(false);
      clearTimeout(timer);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(normalizeUser(session.user));
      }
      setLoading(false);
      clearTimeout(timer);
    });

    return () => {
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, []);

  const loginAsGuest = useCallback(() => {
    const guestUser = {
      uid: "guest_" + Math.random().toString(36).substring(2, 9),
      name: "Gordon Ramsay (Demo)",
      email: "demo@platewise.ai",
      avatar: null,
      provider: "demo",
    };
    try {
      localStorage.setItem("platewise_mock_user", JSON.stringify(guestUser));
    } catch (e) {}
    setUser(guestUser);
    setIsAuthModalOpen(false);
    return guestUser;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    return data;
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data?.user) {
      setUser(normalizeUser(data.user));
    }
    return { user: data.user };
  }, []);

  const signupWithEmail = useCallback(async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    });
    if (error) throw error;
    if (data?.user) {
      setUser(normalizeUser(data.user));
    }
    return { user: data.user };
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }, []);

  const updateUserProfile = useCallback(async (displayName) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: displayName }
    });
    if (error) throw error;
    setUser(normalizeUser(data.user));
  }, []);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem("platewise_mock_user");
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginAsGuest,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        resetPassword,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
