/** Boot terminal modal — collects env vars if needed, then animates boot while container starts. */
import { useEffect, useRef, useState } from 'react';
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
  const nav = useNavigate();
  const { show } = useToast();

  const [phase, setPhase] = useState('boot'); // 'env' | 'boot'
  const [envValues, setEnvValues] = useState({});
  const [missingKeys, setMissingKeys] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [runError, setRunError] = useState(null);

  const envValuesRef = useRef({});

  const { lines, done } = useBootSequence(phase === 'boot' && !!agent);

  useEffect(() => {
    if (!agent) { setSessionId(null); setRunError(null); setPhase('boot'); return; }
    const hasEnvVars = agent.envVars?.length > 0;
    setPhase(hasEnvVars ? 'env' : 'boot');
    setEnvValues({});
    envValuesRef.current = {};
    setMissingKeys([]);
    setSessionId(null);
    setRunError(null);
  }, [agent]);

  useEffect(() => {
    if (!agent || phase !== 'boot') return;
    startRun(agent.slug, { userEnv: envValuesRef.current })
      .then((data) => setSessionId(data.sessionId))
      .catch((e) => setRunError(e.message || 'Could not reach the run server.'));
  }, [agent, phase]);

  if (!agent) return null;

  const proceed = () => {
    const missing = (agent.envVars || []).filter((v) => v.required && !envValues[v.key]?.trim());
    if (missing.length) { setMissingKeys(missing.map((v) => v.key)); return; }
    envValuesRef.current = { ...envValues };
    setPhase('boot');
  };

  const setVal = (key, val) => {
    setEnvValues((prev) => ({ ...prev, [key]: val }));
    setMissingKeys((prev) => prev.filter((k) => k !== key));
  };

  const open = () => {
    closeBoot();
    if (sessionId) {
      nav(`/runs/run/${sessionId}`);
      show('Session started', 'success');
    } else {
      show(runError || 'Run server unreachable — start it with `npm run server`.', 'error');
    }
  };

  if (phase === 'env') {
    return (
      <div className="modal-backdrop">
        <div className="modal modal-wide">
          <div className="modal-header">
            <span className="modal-title">Configure {agent.name}</span>
          </div>
          <div className="modal-body">
            <p className="boot-env-hint">This agent requires the following environment variables before starting:</p>
            {(agent.envVars || []).map((v) => (
              <div key={v.key} className="boot-env-row">
                <label className="boot-env-label">
                  {v.key}
                  {v.required && <span className="boot-env-required">required</span>}
                  {v.desc && <span className="boot-env-desc">{v.desc}</span>}
                </label>
                <input
                  className={`input boot-env-input${missingKeys.includes(v.key) ? ' boot-env-input--error' : ''}`}
                  type="password"
                  placeholder={`Enter ${v.key}…`}
                  value={envValues[v.key] || ''}
                  onChange={(e) => setVal(v.key, e.target.value)}
                />
              </div>
            ))}
            {missingKeys.length > 0 && (
              <p className="boot-env-error">Fill in all required fields to continue.</p>
            )}
          </div>
          <div className="modal-footer">
            <PrimaryBtn onClick={proceed}>Start agent →</PrimaryBtn>
            <GhostBtn onClick={closeBoot}>Cancel</GhostBtn>
          </div>
        </div>
      </div>
    );
  }

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
