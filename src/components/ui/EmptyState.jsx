/** Empty state with optional clear action. */
import { GhostBtn } from './GhostBtn.jsx';

export function EmptyState({ title, hint, onClear }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
      {onClear && <GhostBtn onClick={onClear}>Clear filters</GhostBtn>}
    </div>
  );
}
