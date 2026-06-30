/** Boot terminal modal — animates a boot sequence while a real container starts underneath. */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoot } from '../../context/BootProvider.jsx';
import { useBootSequence } from '../../hooks/useBootSequence.js';
import { useToast } from '../../context/ToastProvider.jsx';
import { startRun } from '../../api/runsApi.js';
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
  const [sessionId, setSessionId] = useState(null);
  const [runError, setRunError] = useState(null);

  // Kick off the real container as soon as the modal opens, in parallel with
  // the cosmetic boot animation above.
  useEffect(() => {
    if (!agent) { setSessionId(null); setRunError(null); return; }
    setSessionId(null);
    setRunError(null);
    startRun(agent.slug)
      .then((data) => setSessionId(data.sessionId))
      .catch((e) => setRunError(e.message || 'Could not reach the run server.'));
  }, [agent]);

  if (!agent) return null;

  const open = () => {
    closeBoot();
    if (sessionId) {
      nav(`/sessions/run/${sessionId}`);
      show('Session started', 'success');
    } else {
      show(runError || 'Run server unreachable — start it with `npm run server`.', 'error');
    }
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
