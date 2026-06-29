/** ReelsPanel — side drawer showing quick reels for an agent. */
import { useEffect, useState, useCallback } from 'react';

/* Inline SVG icons for each reel visual type */
function ReelIcon({ icon, color }) {
  const c = color || '#737373';
  const icons = {
    search: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    code: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    chart: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    flow: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" aria-hidden="true">
        <rect x="3" y="3" width="6" height="4" rx="1" /><rect x="15" y="10" width="6" height="4" rx="1" /><rect x="3" y="17" width="6" height="4" rx="1" />
        <path d="M9 5h3a3 3 0 013 3v1" /><path d="M21 12v1a3 3 0 01-3 3H9" /><polyline points="6 19 9 22 9 16" />
      </svg>
    ),
    example: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" aria-hidden="true">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
    monitor: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    chat: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" aria-hidden="true">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    doc: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
      </svg>
    ),
    eye: (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
  };
  return icons[icon] || icons.example;
}

export function ReelsPanel({ agent, onClose }) {
  const [reels, setReels] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animDir, setAnimDir] = useState(null); // 'up' | 'down'

  useEffect(() => {
    fetch('/mock/reels.json')
      .then((r) => r.json())
      .then((data) => { setReels(data[agent.slug] || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [agent.slug]);

  const go = useCallback((dir) => {
    setAnimDir(dir);
    setTimeout(() => {
      setIdx((i) => dir === 'next' ? Math.min(i + 1, reels.length - 1) : Math.max(i - 1, 0));
      setAnimDir(null);
    }, 180);
  }, [reels.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go('next');
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, go]);

  const reel = reels[idx];
  const accent = agent.color || '#737373';

  return (
    <>
      <div className="reels-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="reels-panel" aria-label={`Reels for ${agent.name}`} role="dialog">
        {/* Header */}
        <div className="reels-header">
          <div className="reels-agent-name">{agent.name}</div>
          <button className="reels-close" onClick={onClose} aria-label="Close reels">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Reel card */}
        <div className="reels-track">
          {loading && (
            <div className="reels-empty">Loading...</div>
          )}
          {!loading && reels.length === 0 && (
            <div className="reels-empty">No reels available for this agent yet.</div>
          )}
          {!loading && reel && (
            <div className={`reel-card${animDir ? ` reel-card--${animDir}` : ''}`}>
              {/* Visual */}
              <div className="reel-visual" style={{ '--reel-color': accent }}>
                <div className="reel-step-badge">{reel.step}</div>
                <ReelIcon icon={reel.icon} color={accent} />
              </div>
              {/* Content */}
              <div className="reel-content">
                <p className="reel-idx">{idx + 1} / {reels.length}</p>
                <h3 className="reel-title">{reel.title}</h3>
                <p className="reel-body">{reel.body}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {!loading && reels.length > 1 && (
          <div className="reels-nav">
            <button
              className="reels-nav-btn"
              onClick={() => go('prev')}
              disabled={idx === 0}
              aria-label="Previous reel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="reels-dots">
              {reels.map((_, i) => (
                <button
                  key={i}
                  className={`reels-dot${i === idx ? ' active' : ''}`}
                  onClick={() => setIdx(i)}
                  aria-label={`Go to reel ${i + 1}`}
                />
              ))}
            </div>
            <button
              className="reels-nav-btn"
              onClick={() => go('next')}
              disabled={idx === reels.length - 1}
              aria-label="Next reel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        <p className="reels-hint">← → to navigate · Esc to close</p>
      </aside>
    </>
  );
}
