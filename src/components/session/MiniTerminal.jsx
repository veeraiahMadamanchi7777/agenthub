import { useEffect, useRef, useState } from 'react';
import { openRunSocket, stopRun } from '../../api/runsApi.js';

const STATUS_LABEL = { starting: 'Starting…', running: 'Running', exited: 'Exited', errored: 'Error', stopped: 'Stopped' };

function lineClass(line) {
  if (/^Error/i.test(line)) return 'term-err';
  if (line.includes('✓') || /\bdone\b/i.test(line)) return 'term-ok';
  return 'term-line';
}

export function MiniTerminal({ sessionId, onStopped }) {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    const close = openRunSocket(sessionId, {
      onInit: (msg) => { setStatus(msg.status); setLogs(msg.logs); },
      onLog: (line) => setLogs((l) => [...l, line]),
      onStatus: (s) => { setStatus(s); if (s === 'stopped' || s === 'exited') onStopped?.(); },
      onError: (m) => setError(m),
    });
    return close;
  }, [sessionId, onStopped]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const isLive = status === 'starting' || status === 'running';
  const dotState = !isLive ? 'unreachable' : status === 'starting' ? 'connecting' : 'live';

  const stop = async () => {
    try { await stopRun(sessionId); } catch { /* ignore */ }
  };

  return (
    <div className="mini-term">
      <div className="mini-term-header">
        <span className={`embed-dot embed-dot--${dotState}`} />
        <span className="mini-term-status">{STATUS_LABEL[status] || status}</span>
        {isLive && (
          <button className="mini-term-stop" onClick={stop}>Stop</button>
        )}
      </div>
      <div className="mini-term-body" ref={logRef}>
        <div className="term-cmd">$ docker run {sessionId ? '…' : ''}</div>
        {logs.map((l, i) => <div key={i} className={lineClass(l)}>{l}</div>)}
        {logs.length === 0 && !error && <div className="term-line">Pulling image and starting container…</div>}
        {error && <div className="term-err">{error}</div>}
      </div>
    </div>
  );
}
