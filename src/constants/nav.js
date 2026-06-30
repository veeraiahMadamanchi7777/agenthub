/** Sidebar navigation — Runs, Automate, Library, Discover, Workstation. */
export const SIDEBAR_ITEMS = [
  { id: 'runs', label: 'Runs', path: '/runs', auth: true, icon: 'runs' },
  { id: 'automate', label: 'Automate', path: '/automate', auth: true, icon: 'automate' },
  { id: 'library', label: 'Library', path: '/library', auth: false, icon: 'library' },
  { id: 'discover', label: 'Discover', path: '/discover', auth: false, icon: 'discover' },
  { id: 'workstation', label: 'Workstation', path: '/workstation', auth: false, icon: 'workstation' },
];

/** Legacy paths → current routes (redirects). */
export const LEGACY_NAV_REDIRECTS = {
  '/sessions': '/runs',
  '/schedule': '/automate',
  '/wiki': '/library',
  '/ask': '/discover',
  '/setup': '/workstation',
};
