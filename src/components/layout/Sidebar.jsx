/** Left sidebar — Sessions, Wiki, Studio. */
import { SIDEBAR_ITEMS } from '../../constants/nav.js';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useSessions } from '../../hooks/useSessions.js';
import { SidebarLink } from './SidebarLink.jsx';

export function Sidebar() {
  const { authed, setAuthOpen } = useAuth();
  const { running } = useSessions();
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarLink key={item.id} item={item} authed={authed}
            onAuth={() => setAuthOpen(true)} badge={item.id === 'sessions' ? running : 0} />
        ))}
      </nav>
    </aside>
  );
}
