/** Sign-in modal. */
import { useAuth } from '../../context/AuthProvider.jsx';
import { useToast } from '../../context/ToastProvider.jsx';
import { PrimaryBtn } from '../ui/PrimaryBtn.jsx';

export function AuthModal() {
  const { authOpen, setAuthOpen, signIn } = useAuth();
  const { show } = useToast();
  if (!authOpen) return null;
  const submit = () => { signIn(); show('Signed in successfully', 'success'); };
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Sign in to AgentHub</h2>
          <button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <input className="input" defaultValue="demo@agenthub.dev" placeholder="Email" />
          <input className="input" type="password" defaultValue="demo1234" placeholder="Password" />
          <PrimaryBtn onClick={submit}>Sign in</PrimaryBtn>
          <button className="back-link modal-cancel" onClick={() => setAuthOpen(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
