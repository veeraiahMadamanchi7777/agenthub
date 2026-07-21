import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useToast } from '../../context/ToastProvider.jsx';
import { apiLogin, apiRegister, apiForgotPassword, githubLoginUrl } from '../../api/authApi.js';
import { PrimaryBtn } from '../ui/PrimaryBtn.jsx';

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/>
    </svg>
  );
}

// RFC 5322-inspired email check
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmail(email) {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address';
  return null;
}

function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', level: 1 };
  if (score <= 2) return { label: 'Fair', level: 2 };
  if (score <= 3) return { label: 'Good', level: 3 };
  if (score <= 4) return { label: 'Strong', level: 4 };
  return { label: 'Very strong', level: 5 };
}

const STRENGTH_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#10b981' };

function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password);
  if (!strength) return null;
  const color = STRENGTH_COLORS[strength.level];
  return (
    <div className="pw-strength">
      <div className="pw-strength-bars">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="pw-strength-bar"
            style={{ background: n <= strength.level ? color : undefined }}
          />
        ))}
      </div>
      <span className="pw-strength-label" style={{ color }}>{strength.label}</span>
    </div>
  );
}

function PasswordRules({ password }) {
  const rules = [
    { label: 'At least 8 characters',         ok: password.length >= 8 },
    { label: 'One uppercase letter',           ok: /[A-Z]/.test(password) },
    { label: 'One number',                     ok: /[0-9]/.test(password) },
    { label: 'One special character',          ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <ul className="pw-rules">
      {rules.map((r) => (
        <li key={r.label} className={`pw-rule${r.ok ? ' pw-rule--ok' : ''}`}>
          <span className="pw-rule-icon">{r.ok ? '✓' : '○'}</span>
          {r.label}
        </li>
      ))}
    </ul>
  );
}

export function AuthModal() {
  const { authOpen, setAuthOpen, signIn } = useAuth();
  const { show } = useToast();

  const [tab, setTab]           = useState('signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [emailError, setEmailError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  if (!authOpen) return null;

  const reset = () => {
    setName(''); setEmail(''); setEmailError(''); setUsername('');
    setPassword(''); setConfirm(''); setRememberMe(false); setPwFocused(false);
    setForgotMode(false); setForgotEmail(''); setForgotSent(false);
  };

  const close = () => { setAuthOpen(false); reset(); setTab('signin'); };

  const switchTab = (t) => { setTab(t); reset(); };

  const canSubmit = () => {
    if (tab === 'signin') return email && password;
    const strength = getPasswordStrength(password);
    return name && email && !emailError && username && password && confirm === password && strength && strength.level >= 2;
  };

  const sendForgot = async () => {
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      await apiForgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch {
      setForgotSent(true); // always succeed to avoid email enumeration
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!canSubmit()) return;
    if (tab === 'signup') {
      const err = validateEmail(email);
      if (err) { setEmailError(err); return; }
      if (confirm !== password) { show('Passwords do not match', 'error'); return; }
    }
    setLoading(true);
    try {
      const { user } = tab === 'signin'
        ? await apiLogin({ email, password, rememberMe })
        : await apiRegister({ email, username, name, password });
      signIn(null, user);
      show(`Welcome${tab === 'signup' ? ', ' + (user.name || user.username) : ' back, ' + (user.name || user.username)}!`, 'success');
      close();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter') submit(); };

  const passwordsMatch = confirm && confirm === password;
  const passwordsMismatch = confirm && confirm !== password;

  return (
    <div className="modal-backdrop">
      <div className="modal auth-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {forgotMode ? 'Reset your password' : tab === 'signin' ? 'Sign in to AgentHub' : 'Create your account'}
          </h2>
          <button className="modal-close" onClick={close} aria-label="Close">✕</button>
        </div>

        {!forgotMode && (
          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'signin' ? ' auth-tab--active' : ''}`} onClick={() => switchTab('signin')}>Sign in</button>
            <button className={`auth-tab${tab === 'signup' ? ' auth-tab--active' : ''}`} onClick={() => switchTab('signup')}>Sign up</button>
          </div>
        )}

        {forgotMode ? (
          <div className="modal-body">
            {forgotSent ? (
              <div className="auth-forgot-sent">
                <p>If an account exists for <strong>{forgotEmail}</strong>, a reset link has been sent. Check your inbox.</p>
                <button className="auth-switch-link" onClick={() => { setForgotMode(false); setForgotSent(false); }}>Back to sign in</button>
              </div>
            ) : (
              <>
                <p className="auth-forgot-desc">Enter your email and we'll send you a link to reset your password.</p>
                <input
                  className="input"
                  type="email"
                  placeholder="Email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendForgot()}
                  autoComplete="email"
                  autoFocus
                />
                <PrimaryBtn onClick={sendForgot} disabled={loading || !forgotEmail.trim()}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </PrimaryBtn>
                <div className="auth-switch">
                  <button className="auth-switch-link" onClick={() => setForgotMode(false)}>Back to sign in</button>
                </div>
              </>
            )}
          </div>
        ) : (

        <div className="modal-body">
          <a className="auth-github-btn" href={githubLoginUrl()}>
            <GitHubIcon />
            Continue with GitHub
          </a>
          <div className="auth-divider"><span>or</span></div>

          {/* Sign-up only fields */}
          {tab === 'signup' && (
            <>
              <div className="auth-row-2">
                <input
                  className="input"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={onKey}
                  autoComplete="name"
                />
                <input
                  className="input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={onKey}
                  autoComplete="username"
                />
              </div>
            </>
          )}

          {/* Email */}
          <div className="auth-field">
            <input
              className={`input${emailError ? ' input--error' : ''}`}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
              onBlur={() => { if (tab === 'signup') setEmailError(validateEmail(email) || ''); }}
              onKeyDown={onKey}
              autoComplete="email"
            />
            {emailError && <p className="auth-field-error">{emailError}</p>}
          </div>

          {/* Password */}
          <div className="auth-field">
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPwFocused(true)}
              onKeyDown={onKey}
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            />
            {tab === 'signup' && (pwFocused || password) && (
              <>
                <PasswordStrengthBar password={password} />
                <PasswordRules password={password} />
              </>
            )}
          </div>

          {/* Confirm password — sign-up only */}
          {tab === 'signup' && (
            <div className="auth-field">
              <input
                className={`input${passwordsMismatch ? ' input--error' : passwordsMatch ? ' input--ok' : ''}`}
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={onKey}
                autoComplete="new-password"
              />
              {passwordsMismatch && <p className="auth-field-error">Passwords do not match</p>}
              {passwordsMatch   && <p className="auth-field-ok">Passwords match ✓</p>}
            </div>
          )}

          {/* Remember me + forgot password — sign-in only */}
          {tab === 'signin' && (
            <div className="auth-extras">
              <label className="auth-remember">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
              <button className="auth-switch-link" onClick={() => setForgotMode(true)}>Forgot password?</button>
            </div>
          )}

          <PrimaryBtn onClick={submit} disabled={loading || !canSubmit()}>
            {loading ? 'Please wait…' : tab === 'signin' ? 'Sign in' : 'Create account'}
          </PrimaryBtn>

          <div className="auth-switch">
            {tab === 'signin' ? (
              <>No account? <button className="auth-switch-link" onClick={() => switchTab('signup')}>Sign up</button></>
            ) : (
              <>Have an account? <button className="auth-switch-link" onClick={() => switchTab('signin')}>Sign in</button></>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
