/** Register agent modal — prototype submission form. */
import { useAuth } from '../../context/AuthProvider.jsx';
import { useToast } from '../../context/ToastProvider.jsx';
import { PrimaryBtn } from '../ui/PrimaryBtn.jsx';

export function RegisterModal() {
  const { registerOpen, setRegisterOpen } = useAuth();
  const { show } = useToast();
  if (!registerOpen) return null;
  const submit = () => {
    setRegisterOpen(false);
    show('Agent submitted for review!', 'success');
  };
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Register an agent</h2>
          <button className="modal-close" onClick={() => setRegisterOpen(false)} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <input className="input" placeholder="Agent name" />
          <input className="input" placeholder="Repository URL" />
          <textarea className="input textarea" placeholder="Description" rows={3} />
          <PrimaryBtn onClick={submit}>Submit for review</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
