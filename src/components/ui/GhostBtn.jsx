/** Secondary ghost button. */
export function GhostBtn({ children, onClick, small, className = '' }) {
  return (
    <button onClick={onClick} className={`btn btn-ghost${small ? ' btn-sm' : ''} ${className}`.trim()}>
      {children}
    </button>
  );
}
