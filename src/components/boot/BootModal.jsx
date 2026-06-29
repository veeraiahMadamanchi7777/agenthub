/** Boot terminal modal — simulates sandbox provisioning from mock JSON. */
import { useNavigate } from 'react-router-dom';
import { useBoot } from '../../context/BootProvider.jsx';
import { useBootSequence } from '../../hooks/useBootSequence.js';
import { useToast } from '../../context/ToastProvider.jsx';
import { PrimaryBtn } from '../ui/PrimaryBtn.jsx';
import { GhostBtn } from '../ui/GhostBtn.jsx';

function termClass(line) {
  if (line.includes('✓')) return 'term-ok';
  if (line.includes('→')) return 'term-live';
  return 'term-line';
}

export function BootModal() {
  const { agent, closeBoot } = useBoot();
  const { lines, done } = useBootSequence(!!agent);
  const nav = useNavigate();
  const { show } = useToast();
  if (!agent) return null;
  const open = () => {
    closeBoot();
    if (agent.kind === 'embedded') {
      nav(`/sessions/embed/${agent.slug}`);
    } else {
      nav('/sessions/s1');
    }
    show('Session started', 'success');
  };
  return (
    <div className="modal-backdrop">
      <div className="modal modal-wide">
        <div className="modal-header">
          <span className="modal-title">Launching {agent.name}</span>
        </div>
        <div className="term-body">
          <div className="term-cmd">$ agenthub run {agent.name}</div>
          {lines.map((l, i) => <div key={i} className={termClass(l)}>{l}</div>)}
        </div>
        {done && (
          <div className="modal-footer">
            <PrimaryBtn onClick={open}>Open session →</PrimaryBtn>
            <GhostBtn onClick={closeBoot}>Close</GhostBtn>
          </div>
        )}
      </div>
    </div>
  );
}
