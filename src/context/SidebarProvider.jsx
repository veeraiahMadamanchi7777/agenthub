/** Sidebar collapse + mobile drawer state. */
import { createContext, useContext, useEffect, useState } from 'react';

const SidebarContext = createContext(null);
const KEY = 'agenthub-sidebar-collapsed';
const MOBILE_MQ = '(max-width: 768px)';

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(KEY) === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { localStorage.setItem(KEY, String(collapsed)); }, [collapsed]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const closeOnDesktop = () => { if (!mq.matches) setMobileOpen(false); };
    mq.addEventListener('change', closeOnDesktop);
    return () => mq.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggle = () => setCollapsed((c) => !c);
  const openMobile = () => setMobileOpen(true);
  const closeMobile = () => setMobileOpen(false);
  const toggleMobile = () => setMobileOpen((o) => !o);

  return (
    <SidebarContext.Provider value={{
      collapsed, setCollapsed, toggle,
      mobileOpen, openMobile, closeMobile, toggleMobile,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be inside SidebarProvider');
  return ctx;
}
