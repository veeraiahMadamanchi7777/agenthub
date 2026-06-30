/** Secondary ghost button. */
export function GhostBtn({ children, onClick, small, disabled, className = '' }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`btn btn-ghost${small ? ' btn-sm' : ''} ${className}`.trim()}>
      {children}
    </button>
  );
}
