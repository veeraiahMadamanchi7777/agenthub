/** Category filter pill. */
export function Pill({ active, onClick, children, ...rest }) {
  return (
    <button type="button" onClick={onClick} className={`pill${active ? ' active' : ''}`} {...rest}>
      {children}
    </button>
  );
}
