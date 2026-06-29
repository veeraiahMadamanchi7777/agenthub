/** App shell — header, sidebar, main, footer. */
import { useLocation } from 'react-router-dom';
import { NavBar } from './NavBar.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Footer } from './Footer.jsx';

export function AppShell({ children, searchSlot }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  return (
    <div className="app">
      <NavBar searchSlot={searchSlot} />
      <div className={isHome ? 'shell-body shell-body--full' : 'shell-body'}>
        {!isHome && <Sidebar />}
        <div className={isHome ? 'main main--center' : 'main'}>{children}</div>
      </div>
      <Footer />
    </div>
  );
}
