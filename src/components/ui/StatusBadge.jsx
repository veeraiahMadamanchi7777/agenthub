/** Status badge pill for session rows. */
const LABELS = { running: 'active', stopped: 'complete', failed: 'error' };

export function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{LABELS[status] || status}</span>;
}
