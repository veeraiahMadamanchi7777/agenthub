/** Sidebar nav link with auth guard and icon. */
import { NavLink } from 'react-router-dom';
import { SidebarIcon } from './SidebarIcon.jsx';

export function SidebarLink({ item, authed, onAuth, badge, collapsed }) {
  const guard = (e) => { if (item.auth && !authed) { e.preventDefault(); onAuth(); } };
  return (
    <NavLink
      to={item.path}
      onClick={guard}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}${collapsed ? ' sidebar-link--collapsed' : ''}`}
    >
      <span className="sidebar-link-icon"><SidebarIcon name={item.icon} /></span>
      {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
      {!collapsed && badge > 0 && <span className="sidebar-badge">{badge}</span>}
      {collapsed && badge > 0 && <span className="sidebar-badge-dot" aria-label={`${badge} running`} />}
    </NavLink>
  );
}
