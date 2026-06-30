/** RunSessionPage — a real container run: live logs, and (for embedded agents) the live iframe. */
import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContainerRun } from '../hooks/useContainerRun.js';
import { useAgents } from '../hooks/useAgents.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { GhostBtn } from '../components/ui/GhostBtn.jsx';
import { useToast } from '../context/ToastProvider.jsx';

const STATUS_LABEL = {
  starting: 'Starting…',
  running: 'Running',
  exited: 'Exited',
  errored: 'Error',
  stopped: 'Stopped',
};

function lineClass(line) {
  if (/^Error/i.test(line)) return 'term-err';
  if (line.includes('✓') || /\bdone\b/i.test(line)) return 'term-ok';
  return 'term-line';
}

export function RunSessionPage() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const { show } = useToast();
  const { agents } = useAgents();
  const { status, logs, embedUrl, slug, error, isLive, stop } = useContainerRun(sessionId);
  const agent = agents.find((a) => a.slug === slug);
  usePageTitle(agent ? `Session — ${agent.name}` : 'Session');

  const logRef = useRef(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const onStop = async () => {
    await stop();
    show('Container stopped', 'info');
  };

  const dotState = !isLive ? 'unreachable' : status === 'starting' ? 'connecting' : 'live';

  return (
    <div className="run-session">
      <div className="embed-header">
        <button className="embed-back" onClick={() => nav('/sessions')} aria-label="Go back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="embed-agent-info">
          <span className="embed-agent-name">{agent?.name || slug || 'Session'}</span>
          {agent && <span className="embed-agent-author">by {agent.author}</span>}
        </div>
        <div className="embed-status-row">
          <span className={`embed-dot embed-dot--${dotState}`} />
          <span className="embed-status-label">{STATUS_LABEL[status] || status}</span>
        </div>
        <GhostBtn small onClick={onStop} disabled={!isLive}>Stop</GhostBtn>
      </div>

      <div className="run-body">
        <div className="run-log-panel" ref={logRef} aria-live="polite">
          <div className="term-cmd">$ agenthub run {slug} <span className="run-real-tag">real container</span></div>
          {logs.map((l, i) => (
            <div key={i} className={lineClass(l)}>{l}</div>
          ))}
          {error && <div className="term-err">{error}</div>}
        </div>

        {embedUrl && (
          status === 'running' ? (
            <div className="run-iframe-wrap">
              <iframe className="run-iframe" src={embedUrl} title={`${agent?.name || slug} live session`} allow="clipboard-write" />
            </div>
          ) : (
            <p className="run-iframe-hint">The embedded app will appear here once the container is running.</p>
          )
        )}
      </div>
    </div>
  );
}
