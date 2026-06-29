/** Toast notification context — safe fallback if used outside provider. */
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
const noop = { show: () => {} };

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.message}</div>}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) ?? noop;
}
