/** Session sidebar — agent context, tools, metrics (not duplicate chat). */
import { useEffect, useState } from 'react';
import { ChatInput } from './ChatInput.jsx';
import { StatusBadge } from '../ui/StatusBadge.jsx';
import { GhostBtn } from '../ui/GhostBtn.jsx';
import { CHAT_PANEL_W } from '../../constants/layout.js';

export function SessionContextPanel({ agent, session, thinking, onSend, onStop, elapsed, msgCount }) {
  const [tools, setTools] = useState([]);
  useEffect(() => {
    if (!thinking) { setTools([]); return; }
    setTools(['Searching web…', 'Reading sources…']);
    const t = setTimeout(() => setTools(['Synthesizing report…']), 1400);
    return () => clearTimeout(t);
  }, [thinking]);
  const running = session.status === 'running';
  const tokens = Math.min(msgCount * 420, 8400);
  return (
    <aside className="context-panel" style={{ width: CHAT_PANEL_W }}>
      <div className="context-header">
        <div className="context-title">{agent?.name}</div>
        <StatusBadge status={session.status} />
      </div>
      <div className="context-body">
        <section className="context-section">
          <h4>Agent</h4>
          <p className="context-meta">{agent?.category} · {agent?.author}</p>
          <p className="context-desc">{agent?.desc}</p>
        </section>
        {tools.length > 0 && (
          <section className="context-section" aria-live="polite">
            <h4>Tool calls</h4>
            <ul className="tool-list">{tools.map((t) => <li key={t}>⚙ {t}</li>)}</ul>
          </section>
        )}
        <section className="context-section">
          <h4>Usage</h4>
          <div className="usage-grid">
            <span>Tokens <strong>{tokens.toLocaleString()}</strong></span>
            <span>Cost <strong>${(tokens * 0.000003).toFixed(3)}</strong></span>
            <span>Elapsed <strong>{elapsed}</strong></span>
          </div>
        </section>
      </div>
      <div className="context-footer">
        {running && onStop && <GhostBtn small onClick={onStop}>Stop agent</GhostBtn>}
        <ChatInput onSend={onSend} disabled={thinking} />
      </div>
    </aside>
  );
}
