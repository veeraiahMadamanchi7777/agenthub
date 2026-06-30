/** Sidebar navigation — Sessions, Wiki, Ask, Schedule, Setup. */
export const SIDEBAR_ITEMS = [
  { id: 'sessions', label: 'Sessions', path: '/sessions', auth: true, icon: 'sessions' },
  { id: 'schedule', label: 'Schedule', path: '/schedule', auth: true, icon: 'schedule' },
  { id: 'wiki', label: 'Wiki', path: '/wiki', auth: false, icon: 'wiki' },
  { id: 'ask', label: 'Ask', path: '/ask', auth: false, icon: 'ask' },
  { id: 'setup', label: 'Setup', path: '/setup', auth: false, icon: 'setup' },
];
