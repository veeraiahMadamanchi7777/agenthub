import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiMe } from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);   // null = not signed in
  const [authReady, setAuthReady] = useState(false);  // true once token check is done
  const [authOpen, setAuthOpen]   = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editAgent, setEditAgent] = useState(null);

  // On mount: restore session from localStorage token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setAuthReady(true); return; }
    apiMe()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setAuthReady(true));
  }, []);

  // Handle GitHub OAuth callback — token + user come back as query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ghToken = params.get('token');
    const ghUser  = params.get('user');
    const authStatus = params.get('auth');
    if (authStatus === 'github' && ghToken && ghUser) {
      try {
        localStorage.setItem('auth_token', ghToken);
        setUser(JSON.parse(decodeURIComponent(ghUser)));
        setAuthOpen(false);
      } catch { /* malformed */ }
      // Clean up URL
      const clean = new URL(window.location.href);
      clean.searchParams.delete('auth');
      clean.searchParams.delete('token');
      clean.searchParams.delete('user');
      window.history.replaceState({}, '', clean.toString());
    }
  }, []);

  const signIn = useCallback((token, userData) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
    setAuthOpen(false);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => setUser(userData), []);

  const authed = Boolean(user);

  const requireAuth = useCallback((fn) => {
    if (authed) fn();
    else setAuthOpen(true);
  }, [authed]);

  return (
    <AuthContext.Provider value={{
      user, authed, authReady,
      authOpen, setAuthOpen,
      registerOpen, setRegisterOpen,
      editAgent, setEditAgent,
      signIn, signOut, updateUser, requireAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
