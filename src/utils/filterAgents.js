/** Filters and sorts agents for browse page. */
const UPDATED_ORDER = { '4d ago': 1, '5d ago': 2, '6d ago': 3, '10d ago': 4, '1w ago': 5, '2w ago': 6, '3w ago': 7, '1mo ago': 8 };

export function filterAgents(agents, { q, category, sort, tag }) {
  let list = agents.filter((a) => category === 'All' || a.category === category);
  if (tag) list = list.filter((a) => a.caps.includes(tag) || a.models.includes(tag));
  if (q) {
    const s = q.toLowerCase();
    list = list.filter((a) => [a.name, a.desc, a.author, ...a.caps, ...a.models].join(' ').toLowerCase().includes(s));
  }
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'newest') list.sort((a, b) => b.id - a.id);
  else if (sort === 'updated') list.sort((a, b) => (UPDATED_ORDER[a.updated] || 99) - (UPDATED_ORDER[b.updated] || 99));
  else if (sort === 'trending') list.sort((a, b) => parseFloat(b.pulls) * 0.9 - parseFloat(a.pulls));
  else list.sort((a, b) => parseFloat(b.pulls) - parseFloat(a.pulls));
  return list;
}
