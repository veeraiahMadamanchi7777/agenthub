/** Sidebar nav icons. */
export function SidebarIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, 'aria-hidden': true };
  if (name === 'sessions') {
    return (
      <svg {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M6 4h12a2 2 0 012 2v12l-4-3H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    );
  }
  if (name === 'wiki') {
    return (
      <svg {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5v11M9 8.5h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.82 1c0 2-3 3-3 3m.08 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
    </svg>
  );
}
