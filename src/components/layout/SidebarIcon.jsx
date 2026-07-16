/** Sidebar nav icons. */
export function SidebarIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, 'aria-hidden': true };
  if (name === 'runs') {
    return (
      <svg {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M6 4h12a2 2 0 012 2v12l-4-3H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    );
  }
  if (name === 'automate') {
    return (
      <svg {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 11h14M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
      </svg>
    );
  }
  if (name === 'library') {
    return (
      <svg {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5v11M9 8.5h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    );
  }
  if (name === 'discover') {
    return (
      <svg {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
      </svg>
    );
  }
  if (name === 'workstation') {
    return (
      <svg {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  if (name === 'my-agents') {
    return (
      <svg {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a9 9 0 1115 0" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.82 1c0 2-3 3-3 3m.08 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
    </svg>
  );
}
