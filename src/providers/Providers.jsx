/** Composes all app-level React context providers. */
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeProvider.jsx';
import { ToastProvider } from '../context/ToastProvider.jsx';
import { AuthProvider } from '../context/AuthProvider.jsx';
import { BootProvider } from '../context/BootProvider.jsx';
import { SearchProvider } from '../context/SearchProvider.jsx';

export function Providers({ children }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BootProvider>
              <SearchProvider>{children}</SearchProvider>
            </BootProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
