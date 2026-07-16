/** Left sidebar — logo, nav, collapse toggle (ChatGPT-style). */
import { SIDEBAR_ITEMS } from '../../constants/nav.js';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useSidebar } from '../../context/SidebarProvider.jsx';
import { useSessions } from '../../hooks/useSessions.js';
import { Logo } from './Logo.jsx';
import { SidebarLink } from './SidebarLink.jsx';

export function Sidebar() {
  const { authed, setAuthOpen } = useAuth();
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();
  const { running } = useSessions();
  const compact = collapsed && !mobileOpen;

  const onToggle = () => {
    if (mobileOpen) closeMobile();
    else toggle();
  };

  return (
    <aside className={`sidebar${compact ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}>
      <div className="sidebar-header">
        <Logo compact={compact} onClick={mobileOpen ? closeMobile : undefined} />
      </div>

      <nav className="sidebar-nav">
        {SIDEBAR_ITEMS.filter((item) => !item.authOnly || authed).map((item) => (
          <SidebarLink
            key={item.id}
            item={item}
            authed={authed}
            collapsed={compact}
            onAuth={() => setAuthOpen(true)}
            onNavigate={closeMobile}
            badge={item.id === 'runs' ? running : 0}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
            <path strokeLinecap="round" d="M9.5 4.5v15" />
            {!compact && <path strokeLinecap="round" strokeLinejoin="round" d="M14 12H19" />}
            {compact && <path strokeLinecap="round" strokeLinejoin="round" d="M12 12H19" />}
          </svg>
          {!compact && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
