/** Top nav — search centered between sidebar and theme toggle. */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useSearch } from '../../context/SearchProvider.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { NavMenuButton } from './NavMenuButton.jsx';

function UserDropdown({ user, setRegisterOpen, signOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (path) => { setOpen(false); nav(path); };
  const color = user.avatar_color || '#6366f1';
  const displayName = user.name || user.username;

  function NavAvatarSm({ size = 'sm' }) {
    const cls = `nav-avatar-sm${size === 'lg' ? ' nav-avatar-sm--lg' : ''}`;
    if (user.avatar_data?.startsWith('data:')) {
      return <img src={user.avatar_data} alt={user.username} className={cls} style={{ objectFit: 'cover' }} />;
    }
    if (user.avatar_data?.startsWith('emoji:')) {
      return <span className={cls} style={{ background: color, fontSize: size === 'lg' ? 18 : 13 }}>{user.avatar_data.slice(6)}</span>;
    }
    return <span className={cls} style={{ background: color }}>{user.username[0].toUpperCase()}</span>;
  }

  return (
    <div className="nav-dropdown-wrap" ref={ref}>
      <button className="nav-dropdown-trigger" onClick={() => setOpen((o) => !o)}>
        <NavAvatarSm />
        <span className="nav-dropdown-name">{displayName}</span>
        <svg className={`nav-dropdown-chevron${open ? ' nav-dropdown-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="nav-dropdown-menu">
          <div className="nav-dropdown-header">
            <NavAvatarSm size="lg" />
            <div>
              <p className="nav-dropdown-user">{displayName}</p>
              {user.email && <p className="nav-dropdown-email">{user.email}</p>}
            </div>
          </div>
          <div className="nav-dropdown-divider" />
          <button className="nav-dropdown-item" onClick={() => go('/account')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a9 9 0 1115 0" /></svg>
            Profile
          </button>
          <button className="nav-dropdown-item" onClick={() => { setOpen(false); setRegisterOpen(true); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Register agent
          </button>
          <button className="nav-dropdown-item" onClick={() => go('/my-agents')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5M3.75 6.75h16.5M3.75 17.25h16.5" /></svg>
            My Agents
          </button>
          <div className="nav-dropdown-divider" />
          <button className="nav-dropdown-item nav-dropdown-item--danger" onClick={() => { setOpen(false); signOut(); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3" /></svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function NavActions({ authed, user, setAuthOpen, setRegisterOpen, signOut }) {
  return (
    <div className="navbar-actions">
      <ThemeToggle />
      {authed ? (
        <UserDropdown user={user} setRegisterOpen={setRegisterOpen} signOut={signOut} />
      ) : (
        <button type="button" className="nav-btn-ghost nav-btn-signin" onClick={() => setAuthOpen(true)}>Sign in</button>
      )}
      {!authed && (
        <button type="button" className="nav-btn-dark" onClick={() => setRegisterOpen(true)}>
          <span className="nav-btn-register-full">Register agent</span>
          <span className="nav-btn-register-short">Register</span>
        </button>
      )}
    </div>
  );
}

export function NavBar() {
  const { authed, user, setAuthOpen, setRegisterOpen, signOut } = useAuth();
  const { pathname } = useLocation();
  const { q, setQ } = useSearch();
  const isHome = pathname === '/';

  if (isHome) {
    return (
      <header className="navbar">
        <nav className="navbar-inner navbar-inner--home">
          <NavMenuButton />
          <div className="navbar-search-rail">
            <div className="navbar-search-form">
              <div className="navbar-search">
                <span className="navbar-search-icon-wrap" aria-hidden="true">
                  <svg className="navbar-search-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="m8.5 3c3.0375661 0 5.5 2.46243388 5.5 5.5 0 1.24832096-.4158777 2.3995085-1.1166416 3.3225711l4.1469717 4.1470988c.2928932.2928932.2928932.767767 0 1.0606602-.2662666.2662665-.6829303.2904726-.9765418.0726181l-.0841184-.0726181-4.1470988-4.1469717c-.9230626.7007639-2.07425014 1.1166416-3.3225711 1.1166416-3.03756612 0-5.5-2.4624339-5.5-5.5 0-3.03756612 2.46243388-5.5 5.5-5.5zm0 1.5c-2.209139 0-4 1.790861-4 4s1.790861 4 4 4 4-1.790861 4-4-1.790861-4-4-4z"/>
                  </svg>
                </span>
                <input
                  className="navbar-search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search agents"
                  aria-label="Search agents"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
          <div className={`navbar-extra${authed ? ' navbar-extra--authed' : ''}`}>
            <NavActions authed={authed} user={user} setAuthOpen={setAuthOpen} setRegisterOpen={setRegisterOpen} signOut={signOut} />
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="navbar">
      <nav className="navbar-inner">
        <NavMenuButton />
        <div className="navbar-spacer" aria-hidden="true" />
        <div className="navbar-right">
          <NavActions authed={authed} user={user} setAuthOpen={setAuthOpen} setRegisterOpen={setRegisterOpen} signOut={signOut} />
        </div>
      </nav>
    </header>
  );
}
