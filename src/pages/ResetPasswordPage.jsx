import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { apiResetPassword } from '../api/authApi.js';
import { useToast } from '../context/ToastProvider.jsx';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak',      level: 1 };
  if (score <= 2) return { label: 'Fair',      level: 2 };
  if (score <= 3) return { label: 'Good',      level: 3 };
  if (score <= 4) return { label: 'Strong',    level: 4 };
  return            { label: 'Very strong', level: 5 };
}

const STRENGTH_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#10b981' };

export function ResetPasswordPage() {
  usePageTitle('Reset Password');
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { show } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);

  const token = params.get('token') || '';
  const strength = getPasswordStrength(newPassword);

  const canSubmit = newPassword.length >= 8 && newPassword === confirm && (!strength || strength.level >= 2);

  const submit = async () => {
    if (!canSubmit) return;
    if (!token) { show('Missing reset token.', 'error'); return; }
    setLoading(true);
    try {
      await apiResetPassword({ token, newPassword });
      setDone(true);
      show('Password reset — please sign in.', 'success');
      setTimeout(() => nav('/'), 2500);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="page auth-page-centered">
        <div className="auth-status-card auth-status-card--success">
          <div className="auth-status-icon">✓</div>
          <h1>Password reset!</h1>
          <p>You can now sign in with your new password. Redirecting…</p>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="page auth-page-centered">
        <div className="auth-status-card auth-status-card--error">
          <div className="auth-status-icon">✕</div>
          <h1>Invalid link</h1>
          <p>This reset link is missing or malformed.</p>
          <Link to="/" className="btn-primary-link">Go to AgentHub</Link>
        </div>
      </main>
    );
  }

  const mismatch = confirm && confirm !== newPassword;
  const match    = confirm && confirm === newPassword;

  return (
    <main className="page auth-page-centered">
      <div className="auth-reset-card">
        <h1>Set new password</h1>
        <p className="auth-forgot-desc">Choose a new password for your account.</p>

        <div className="auth-field">
          <input
            className="input"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
          />
          {strength && (
            <div className="pw-strength">
              <div className="pw-strength-bars">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="pw-strength-bar" style={{ background: n <= strength.level ? STRENGTH_COLORS[strength.level] : undefined }} />
                ))}
              </div>
              <span className="pw-strength-label" style={{ color: STRENGTH_COLORS[strength.level] }}>{strength.label}</span>
            </div>
          )}
        </div>

        <div className="auth-field">
          <input
            className={`input${mismatch ? ' input--error' : match ? ' input--ok' : ''}`}
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoComplete="new-password"
          />
          {mismatch && <p className="auth-field-error">Passwords do not match</p>}
          {match    && <p className="auth-field-ok">Passwords match ✓</p>}
        </div>

        <PrimaryBtn onClick={submit} disabled={loading || !canSubmit}>
          {loading ? 'Resetting…' : 'Reset password'}
        </PrimaryBtn>
      </div>
    </main>
  );
}
