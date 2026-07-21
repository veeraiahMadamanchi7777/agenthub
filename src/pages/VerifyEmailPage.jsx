import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiVerifyEmail } from '../api/authApi.js';
import { useAuth } from '../context/AuthProvider.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export function VerifyEmailPage() {
  usePageTitle('Verify Email');
  const [params] = useSearchParams();
  const { updateUser, user } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('Missing verification token.'); return; }

    apiVerifyEmail(token)
      .then(() => {
        setStatus('success');
        if (user) updateUser({ ...user, email_verified: 1 });
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="page auth-page-centered">
      {status === 'verifying' && <p className="auth-status-msg">Verifying your email…</p>}

      {status === 'success' && (
        <div className="auth-status-card auth-status-card--success">
          <div className="auth-status-icon">✓</div>
          <h1>Email verified!</h1>
          <p>Your email address has been confirmed.</p>
          <Link to="/" className="btn-primary-link">Go to AgentHub</Link>
        </div>
      )}

      {status === 'error' && (
        <div className="auth-status-card auth-status-card--error">
          <div className="auth-status-icon">✕</div>
          <h1>Verification failed</h1>
          <p>{message || 'This link is invalid or has already been used.'}</p>
          <Link to="/" className="btn-primary-link">Go to AgentHub</Link>
        </div>
      )}
    </main>
  );
}
