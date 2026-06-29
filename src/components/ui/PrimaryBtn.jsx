/** Primary action button. */
export function PrimaryBtn({ children, onClick, small, disabled, className = '' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`btn btn-primary${small ? ' btn-sm' : ''} ${className}`.trim()}>
      {children}
    </button>
  );
}
