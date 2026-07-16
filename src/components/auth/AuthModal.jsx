import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useToast } from '../../context/ToastProvider.jsx';
import { apiLogin, apiRegister, githubLoginUrl } from '../../api/authApi.js';
import { PrimaryBtn } from '../ui/PrimaryBtn.jsx';
import { GhostBtn } from '../ui/GhostBtn.jsx';

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/>
    </svg>
  );
}

export function AuthModal() {
  const { authOpen, setAuthOpen, signIn } = useAuth();
  const { show } = useToast();
  const [tab, setTab]         = useState('signin');
  const [email, setEmail]     = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authOpen) return null;

  const close = () => {
    setAuthOpen(false);
    setEmail(''); setUsername(''); setPassword('');
    setTab('signin');
  };

  const submit = async () => {
    setLoading(true);
    try {
      const { token, user } = tab === 'signin'
        ? await apiLogin({ email, password })
        : await apiRegister({ email, username, password });
      signIn(token, user);
      show(`Welcome${tab === 'signup' ? ', ' + user.username : ' back, ' + user.username}!`, 'success');
      close();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="modal-backdrop">
      <div className="modal auth-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {tab === 'signin' ? 'Sign in to AgentHub' : 'Create your account'}
          </h2>
          <button className="modal-close" onClick={close} aria-label="Close">✕</button>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'signin' ? ' auth-tab--active' : ''}`} onClick={() => setTab('signin')}>Sign in</button>
          <button className={`auth-tab${tab === 'signup' ? ' auth-tab--active' : ''}`} onClick={() => setTab('signup')}>Sign up</button>
        </div>

        <div className="modal-body">
          <a className="auth-github-btn" href={githubLoginUrl()}>
            <GitHubIcon />
            Continue with GitHub
          </a>
          <div className="auth-divider"><span>or</span></div>

          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            autoComplete="email"
          />
          {tab === 'signup' && (
            <input
              className="input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKey}
              autoComplete="username"
            />
          )}
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
          />

          <PrimaryBtn onClick={submit} disabled={loading}>
            {loading ? 'Please wait…' : tab === 'signin' ? 'Sign in' : 'Create account'}
          </PrimaryBtn>

          <div className="auth-switch">
            {tab === 'signin' ? (
              <>No account? <button className="auth-switch-link" onClick={() => setTab('signup')}>Sign up</button></>
            ) : (
              <>Have an account? <button className="auth-switch-link" onClick={() => setTab('signin')}>Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
