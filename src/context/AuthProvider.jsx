import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiMe, apiRefresh, apiLogout } from '../api/authApi.js';

const AuthContext = createContext(null);

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen]   = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const inactivityTimer = useRef(null);

  // ── Silent token refresh with 401 retry ──────────────────
  async function fetchWithRefresh(fetchFn) {
    try {
      return await fetchFn();
    } catch (err) {
      if (err.message === 'Authentication required' || err.message === 'Invalid or expired token') {
        try {
          await apiRefresh();
          return await fetchFn();
        } catch {
          return null;
        }
      }
      throw err;
    }
  }

  // ── Inactivity auto-logout ────────────────────────────────
  const resetInactivity = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      doSignOut();
    }, INACTIVITY_MS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetInactivity, { passive: true }));
    resetInactivity();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivity));
      clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivity]);

  // ── Session restore on mount ──────────────────────────────
  useEffect(() => {
    apiMe()
      .then(({ user }) => setUser(user))
      .catch(async () => {
        // Try silent refresh
        try {
          const { user } = await apiRefresh();
          setUser(user);
        } catch {
          // Not signed in
        }
      })
      .finally(() => setAuthReady(true));
  }, []);

  // ── GitHub OAuth callback (cookie-based) ──────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    if (authStatus === 'github') {
      apiMe()
        .then(({ user }) => { setUser(user); setAuthOpen(false); })
        .catch(() => {});
      const clean = new URL(window.location.href);
      clean.searchParams.delete('auth');
      window.history.replaceState({}, '', clean.toString());
    }
  }, []);

  const doSignOut = useCallback(async () => {
    clearTimeout(inactivityTimer.current);
    await apiLogout().catch(() => {});
    setUser(null);
  }, []);

  const signIn = useCallback((_token, userData) => {
    // token is now in httpOnly cookie — we just store the user object
    setUser(userData);
    setAuthOpen(false);
  }, []);

  const signOut = useCallback(() => doSignOut(), [doSignOut]);

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
      fetchWithRefresh,
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
