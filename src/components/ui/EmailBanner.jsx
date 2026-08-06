import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useToast } from '../../context/ToastProvider.jsx';
import { apiResendVerification } from '../../api/authApi.js';

export function EmailBanner() {
  const { user } = useAuth();
  const { show } = useToast();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.email_verified || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      await apiResendVerification();
      show('Verification email sent — check your inbox.', 'success');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="email-banner">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
      </svg>
      <span>Please verify your email address to unlock all features.</span>
      <button className="email-banner-btn" onClick={resend} disabled={sending}>
        {sending ? 'Sending…' : 'Resend email'}
      </button>
      <button className="email-banner-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">✕</button>
    </div>
  );
}
