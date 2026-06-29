/** Session status dot with colour + label. */
const LABELS = { running: 'Running', stopped: 'Completed', failed: 'Failed' };

export function StatusDot({ status }) {
  return (
    <span className={`status-dot ${status}`} role="status" aria-label={`Status: ${LABELS[status] || status}`} />
  );
}
