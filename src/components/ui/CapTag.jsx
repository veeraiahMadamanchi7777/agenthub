/** Tag pill — optional filter click + type styling. */
export function CapTag({ label, onClick, kind = 'cap' }) {
  const cls = `tag tag-${kind}${onClick ? ' tag-btn' : ''}`;
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={(e) => { e.stopPropagation(); onClick(label); }} aria-label={`Filter by ${label}`}>
        {label}
      </button>
    );
  }
  return <span className={cls}>{label}</span>;
}
