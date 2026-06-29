/** Sidebar nav link with auth guard. */
import { NavLink } from 'react-router-dom';

export function SidebarLink({ item, authed, onAuth, badge }) {
  const guard = (e) => { if (item.auth && !authed) { e.preventDefault(); onAuth(); } };
  return (
    <NavLink to={item.path} onClick={guard}
      className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
      {item.label}
      {badge > 0 && <span className="sidebar-badge">{badge}</span>}
    </NavLink>
  );
}
