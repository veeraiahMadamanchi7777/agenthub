/** Agent card — Ollama-style list item. */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useBoot } from '../../context/BootProvider.jsx';
import { useToast } from '../../context/ToastProvider.jsx';

export function AgentRow({ agent, onTagClick }) {
  const nav = useNavigate();
  const { requireAuth } = useAuth();
  const { openBoot } = useBoot();
  const { show } = useToast();

  const tags = [...agent.caps, ...agent.models].slice(0, 3);

  const open = () => nav(`/agents/${agent.slug}`);
  const run = (e) => {
    e.stopPropagation();
    if (!agent.runnable) { show('Not yet runnable — coming soon', 'info'); return; }
    requireAuth(() => openBoot(agent));
  };
  const filterTag = (label, e) => { e.stopPropagation(); onTagClick(label); };
  const onKey = (e) => { if (e.key === 'Enter') open(); };

  return (
    <li className="agent-item" tabIndex={0} onKeyDown={onKey} onClick={open}>
      <div className="agent-item-inner">
        <div className="agent-item-main">
          <h2 className="agent-item-name">{agent.name}</h2>
          <p className="agent-item-desc">{agent.desc}</p>
          <div className="agent-item-tags">
            {tags.map((t) => (
              <span key={t} className="agent-tag" onClick={(e) => filterTag(t, e)}>{t}</span>
            ))}
          </div>
          <p className="agent-item-stats">
            <span className="agent-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
              {agent.pulls} Pulls
            </span>
            <span className="agent-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>
              {agent.models.length} Models
            </span>
            <span className="agent-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              Updated {agent.updated}
            </span>
          </p>
        </div>
        <button
          className={`agent-run-btn${!agent.runnable ? ' agent-run-btn--disabled' : ''}`}
          onClick={run}
          disabled={!agent.runnable}
          title={agent.runnable ? 'Run agent' : 'Not yet available'}
        >Run</button>
      </div>
    </li>
  );
}
