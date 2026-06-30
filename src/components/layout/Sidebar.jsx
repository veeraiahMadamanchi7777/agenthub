/** Left sidebar — logo, nav, collapse toggle (ChatGPT-style). */
import { SIDEBAR_ITEMS } from '../../constants/nav.js';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useSidebar } from '../../context/SidebarProvider.jsx';
import { useSessions } from '../../hooks/useSessions.js';
import { Logo } from './Logo.jsx';
import { SidebarLink } from './SidebarLink.jsx';

export function Sidebar() {
  const { authed, setAuthOpen } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const { running } = useSessions();

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar-header">
        <Logo compact={collapsed} />
      </div>

      <nav className="sidebar-nav">
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarLink
            key={item.id}
            item={item}
            authed={authed}
            collapsed={collapsed}
            onAuth={() => setAuthOpen(true)}
            badge={item.id === 'runs' ? running : 0}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
            <path strokeLinecap="round" d="M9.5 4.5v15" />
            {!collapsed && <path strokeLinecap="round" strokeLinejoin="round" d="M14 12H19" />}
            {collapsed && <path strokeLinecap="round" strokeLinejoin="round" d="M12 12H19" />}
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
