/** App shell — collapsible sidebar + main column. */
import { NavBar } from './NavBar.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Footer } from './Footer.jsx';
import { useSidebar } from '../../context/SidebarProvider.jsx';

export function AppShell({ children }) {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  return (
    <div className={`app${collapsed ? ' app--sidebar-collapsed' : ''}${mobileOpen ? ' app--mobile-nav-open' : ''}`}>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeMobile}
          aria-label="Close menu"
        />
      )}
      <div className="shell-body">
        <Sidebar />
        <div className="shell-main">
          <NavBar />
          <div className="main">{children}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
