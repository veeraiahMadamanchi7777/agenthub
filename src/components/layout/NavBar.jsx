/** Top nav — search centered between sidebar and theme toggle. */
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useSearch } from '../../context/SearchProvider.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { NavMenuButton } from './NavMenuButton.jsx';

function UserAvatar({ user, signOut }) {
  const nav = useNavigate();
  return (
    <div className="nav-user">
      <button className="nav-avatar" style={{ background: user.avatar_color || '#6366f1' }} onClick={() => nav('/account')} title={user.username}>
        {user.username[0].toUpperCase()}
      </button>
      <button className="nav-btn-ghost nav-btn-signin" onClick={signOut}>Sign out</button>
    </div>
  );
}

function NavActions({ authed, user, setAuthOpen, setRegisterOpen, signOut }) {
  return (
    <div className="navbar-actions">
      <ThemeToggle />
      {authed ? (
        <UserAvatar user={user} signOut={signOut} />
      ) : (
        <button type="button" className="nav-btn-ghost nav-btn-signin" onClick={() => setAuthOpen(true)}>Sign in</button>
      )}
      <button type="button" className="nav-btn-dark" onClick={() => setRegisterOpen(true)}>
        <span className="nav-btn-register-full">Register agent</span>
        <span className="nav-btn-register-short">Register</span>
      </button>
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
