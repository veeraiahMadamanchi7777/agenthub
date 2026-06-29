/** Custom sort dropdown. */
import { useState, useRef, useEffect } from 'react';

const OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name' },
];

export function SortSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const label = OPTIONS.find((o) => o.value === value)?.label || 'Popular';
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  return (
    <div className="sort-select" ref={ref}>
      <button type="button" className="sort-trigger" onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open}>
        {label} ▾
      </button>
      {open && (
        <ul className="sort-menu" role="listbox">
          {OPTIONS.map((o) => (
            <li key={o.value} role="option" aria-selected={value === o.value}
              className={`sort-option${value === o.value ? ' active' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
