/** ReelsSidebar — auto-advancing reels on the right of the home page. */
import { useEffect, useState, useRef } from 'react';

const REEL_DURATION = 4500; // ms per reel

/* Curated small set of reels to demo */
const DEMO_REELS = [
  {
    slug: 'deepresearch',
    color: '#6366f1',
    name: 'deepresearch',
    step: 'Overview',
    title: 'What is DeepResearch?',
    body: 'Crawls the web, synthesizes dozens of sources, and produces a cited research report in under 3 minutes.',
    icon: 'search',
  },
  {
    slug: 'codeweaver',
    color: '#22c55e',
    name: 'codeweaver',
    step: 'Use Case',
    title: 'Add a feature in seconds',
    body: 'Describe it in plain English. CodeWeaver reads your repo, writes the code across files, and opens a PR.',
    icon: 'code',
  },
  {
    slug: 'data-scout',
    color: '#f59e0b',
    name: 'data-scout',
    step: 'Process',
    title: 'Upload CSV → instant charts',
    body: 'Data Scout profiles your dataset, spots outliers, runs stats, and returns interactive visualisations.',
    icon: 'chart',
  },
  {
    slug: 'customer-agent',
    color: '#0ea5e9',
    name: 'customer-agent',
    step: 'Overview',
    title: 'Resolves 80% of tickets',
    body: 'Reads your docs and past tickets. Handles new support requests autonomously, escalates the rest.',
    icon: 'chat',
  },
  {
    slug: 'sql-writer',
    color: '#8b5cf6',
    name: 'sql-writer',
    step: 'Use Case',
    title: 'Plain English → SQL',
    body: 'Ask: "Top 10 customers by revenue this quarter." Get an optimised, commented SQL query instantly.',
    icon: 'code',
  },
];

function Icon({ type, color }) {
  const s = { width: 40, height: 40, display: 'block' };
  const p = { fill: 'none', stroke: color, strokeWidth: 1.5 };
  if (type === 'search') return (
    <svg style={s} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" {...p} />
      <path d="M21 21l-4.35-4.35" {...p} />
    </svg>
  );
  if (type === 'code') return (
    <svg style={s} viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" {...p} />
      <polyline points="8 6 2 12 8 18" {...p} />
    </svg>
  );
  if (type === 'chart') return (
    <svg style={s} viewBox="0 0 24 24" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" {...p} />
      <line x1="12" y1="20" x2="12" y2="4" {...p} />
      <line x1="6" y1="20" x2="6" y2="14" {...p} />
    </svg>
  );
  if (type === 'chat') return (
    <svg style={s} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" {...p} />
    </svg>
  );
  return (
    <svg style={s} viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" {...p} />
    </svg>
  );
}

export function ReelsSidebar() {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);
  const progRef = useRef(null);

  const advance = () => {
    setFading(true);
    setTimeout(() => {
      setIdx((i) => (i + 1) % DEMO_REELS.length);
      setProgress(0);
      setFading(false);
    }, 300);
  };

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / REEL_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        progRef.current = requestAnimationFrame(tick);
      } else {
        advance();
      }
    };
    progRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progRef.current);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const reel = DEMO_REELS[idx];

  return (
    <aside className={`reels-sidebar${fading ? ' reel-mini--fade' : ''}`} aria-label="Agent reels">
      {/* Progress bar */}
      <div className="reel-progress-track">
        {DEMO_REELS.map((_, i) => (
          <div key={i} className="reel-progress-seg">
            <div
              className="reel-progress-fill"
              style={{
                width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%',
                background: reel.color,
              }}
            />
          </div>
        ))}
      </div>

      {/* Visual */}
      <div className="reel-mini-visual" style={{ '--rc': reel.color }}>
        <span className="reel-mini-step">{reel.step}</span>
        <Icon type={reel.icon} color={reel.color} />
        <span className="reel-mini-agent">{reel.name}</span>
      </div>

      {/* Text */}
      <div className="reel-mini-body">
        <p className="reel-mini-title">{reel.title}</p>
        <p className="reel-mini-desc">{reel.body}</p>
      </div>
    </aside>
  );
}
