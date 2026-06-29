/** Boot modal context — tracks agent being launched. */
import { createContext, useContext, useState } from 'react';

const BootContext = createContext(null);

export function BootProvider({ children }) {
  const [agent, setAgent] = useState(null);
  const openBoot = (a) => setAgent(a);
  const closeBoot = () => setAgent(null);
  return (
    <BootContext.Provider value={{ agent, openBoot, closeBoot }}>{children}</BootContext.Provider>
  );
}

export function useBoot() {
  const ctx = useContext(BootContext);
  if (!ctx) throw new Error('useBoot must be inside BootProvider');
  return ctx;
}
