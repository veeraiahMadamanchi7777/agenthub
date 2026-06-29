/** Auth context — no toast dependency to avoid provider ordering crashes. */
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const signIn = () => { setAuthed(true); setAuthOpen(false); };
  const signOut = () => setAuthed(false);
  const requireAuth = (fn) => { if (!authed) setAuthOpen(true); else fn(); };
  return (
    <AuthContext.Provider value={{ authed, authOpen, setAuthOpen, registerOpen, setRegisterOpen, signIn, signOut, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
