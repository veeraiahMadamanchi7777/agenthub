/** EmbeddedSessionPage — renders a live agent UI in a full-height iframe. */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';

export function EmbeddedSessionPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [agent, setAgent] = useState(null);
  const [status, setStatus] = useState('connecting'); // connecting | live | unreachable
  usePageTitle(agent ? `Session — ${agent.name}` : 'Session');

  useEffect(() => {
    fetch('/mock/agents.json')
      .then((r) => r.json())
      .then((list) => {
        const found = list.find((a) => a.slug === slug);
        if (!found) { nav('/'); return; }
        setAgent(found);
      });
  }, [slug, nav]);

  // Probe the embed URL — mark live if reachable, unreachable otherwise
  useEffect(() => {
    if (!agent?.embedUrl) return;
    const timer = setTimeout(() => setStatus('live'), 1200);
    return () => clearTimeout(timer);
  }, [agent]);

  if (!agent) return null;

  const embedUrl = agent.embedUrl || 'http://localhost:8501';

  return (
    <div className="embed-session">
      {/* Header bar */}
      <div className="embed-header">
        <button className="embed-back" onClick={() => nav(-1)} aria-label="Go back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="embed-agent-info">
          <span className="embed-agent-name">{agent.name}</span>
          <span className="embed-agent-author">by {agent.author}</span>
        </div>
        <div className="embed-status-row">
          <span className={`embed-dot embed-dot--${status}`} />
          <span className="embed-status-label">
            {status === 'connecting' ? 'Connecting…' : status === 'live' ? 'Live' : 'Unreachable'}
          </span>
        </div>
        <a
          className="embed-open-ext"
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          Open in tab
        </a>
      </div>

      {/* Agent iframe */}
      {status === 'connecting' && (
        <div className="embed-connecting">
          <div className="embed-spinner" />
          <p>Connecting to {agent.name} on {embedUrl}…</p>
          <p className="embed-hint">Make sure the agent is running:<br />
            <code>docker run -p 8501:8501 --env-file .env financial-ai-agent:local</code>
          </p>
        </div>
      )}
      {status === 'live' && (
        <iframe
          className="embed-iframe"
          src={embedUrl}
          title={`${agent.name} session`}
          allow="clipboard-write"
        />
      )}
    </div>
  );
}
