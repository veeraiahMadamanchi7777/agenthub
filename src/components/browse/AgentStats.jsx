/** Pulls / models / updated row with icons. */
import { pluralize } from '../../utils/pluralize.js';

const ICONS = {
  pulls: <path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />,
  tags: <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />,
  time: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
};

function Stat({ type, label }) {
  return (
    <span className="model-stat">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{ICONS[type]}</svg>
      {label}
    </span>
  );
}

export function AgentStats({ agent }) {
  const n = agent.models.length;
  return (
    <div className="model-stats">
      <Stat type="pulls" label={`${agent.pulls} Pulls`} />
      <Stat type="tags" label={pluralize(n, 'Model')} />
      <Stat type="time" label={`Updated ${agent.updated}`} />
    </div>
  );
}
