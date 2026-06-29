/** App shell — collapsible sidebar + main column. */
import { NavBar } from './NavBar.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Footer } from './Footer.jsx';
import { useSidebar } from '../../context/SidebarProvider.jsx';

export function AppShell({ children }) {
  const { collapsed } = useSidebar();
  return (
    <div className={`app${collapsed ? ' app--sidebar-collapsed' : ''}`}>
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
