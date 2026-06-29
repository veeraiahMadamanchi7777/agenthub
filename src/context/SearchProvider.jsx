/** Shared search state for the home page. */
import { createContext, useContext, useState } from 'react';

const Ctx = createContext(null);

export function SearchProvider({ children }) {
  const [q, setQ] = useState('');
  return <Ctx.Provider value={{ q, setQ }}>{children}</Ctx.Provider>;
}

export function useSearch() {
  return useContext(Ctx);
}
