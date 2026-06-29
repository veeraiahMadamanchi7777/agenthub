/** Sidebar collapse state with localStorage persistence. */
import { createContext, useContext, useEffect, useState } from 'react';

const SidebarContext = createContext(null);
const KEY = 'agenthub-sidebar-collapsed';

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(KEY) === 'true');
  useEffect(() => { localStorage.setItem(KEY, String(collapsed)); }, [collapsed]);
  const toggle = () => setCollapsed((c) => !c);
  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be inside SidebarProvider');
  return ctx;
}
