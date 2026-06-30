/** Primary action button. */
export function PrimaryBtn({ children, onClick, small, disabled, className = '', type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`btn btn-primary${small ? ' btn-sm' : ''} ${className}`.trim()}>
      {children}
    </button>
  );
}
