/** Hamburger — opens mobile nav drawer. */
import { useSidebar } from '../../context/SidebarProvider.jsx';

export function NavMenuButton() {
  const { toggleMobile, mobileOpen } = useSidebar();
  return (
    <button
      type="button"
      className="navbar-menu-btn"
      onClick={toggleMobile}
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileOpen}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {mobileOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );
}
