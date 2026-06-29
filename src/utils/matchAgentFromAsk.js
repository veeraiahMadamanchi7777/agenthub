/** Score agents for an Ask query with optional wiki context. */
export function matchAgentFromAsk(agents, { question, wikiSlugs = [] }) {
  const q = question.trim().toLowerCase();
  const pool = wikiSlugs.length
    ? agents.filter((a) => wikiSlugs.includes(a.slug))
    : agents;

  if (!pool.length) return agents[0] ?? null;
  if (!q) return pool[0];

  const score = (a) => {
    let s = 0;
    const hay = `${a.name} ${a.desc} ${a.category} ${a.caps.join(' ')} ${a.models.join(' ')}`.toLowerCase();
    q.split(/\s+/).filter(Boolean).forEach((word) => {
      if (hay.includes(word)) s += 1;
      if (a.name.toLowerCase().includes(word)) s += 2;
    });
    if (wikiSlugs.includes(a.slug)) s += 3;
    return s;
  };

  return [...pool].sort((a, b) => score(b) - score(a))[0];
}
