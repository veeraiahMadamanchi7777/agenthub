/** Studio preset list with per-pipeline actions. */
import { PrimaryBtn } from '../ui/PrimaryBtn.jsx';
import { GhostBtn } from '../ui/GhostBtn.jsx';
import { useToast } from '../../context/ToastProvider.jsx';

export function PresetGrid({ presets, active, onSelect, onRun, running }) {
  const { show } = useToast();
  return (
    <div className="preset-grid">
      {presets.map((p) => (
        <div key={p.id} className={`preset-card ${active === p.id ? 'active' : ''}`}>
          <div className="preset-card-body" onClick={() => onSelect(p.id)}>
            <div className="preset-name">{p.name}</div>
            <div className="preset-desc">{p.desc}</div>
            {p.lastRun && <div className="preset-meta">Last run: {p.lastRun}</div>}
          </div>
          <div className="preset-actions">
            <PrimaryBtn small onClick={() => onRun(p.id)} disabled={running && active === p.id}>
              {running && active === p.id ? 'Running…' : 'Run'}
            </PrimaryBtn>
            <GhostBtn small onClick={() => show('Pipeline editor coming soon', 'info')}>Edit</GhostBtn>
            <GhostBtn small onClick={() => show('Pipeline deleted', 'info')}>Delete</GhostBtn>
          </div>
        </div>
      ))}
      <button type="button" className="preset-new" onClick={() => show('Pipeline builder coming soon', 'info')}>+ New pipeline</button>
    </div>
  );
}
