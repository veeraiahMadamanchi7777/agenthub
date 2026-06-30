/** Wiki index — grid of agent doc cards. */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '../hooks/useAgents.js';
import { groupByCategory } from '../utils/groupByCategory.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { fetchReadme } from '../api/wikiApi.js';
import { extractReadmeSummary } from '../utils/readme.js';
import { WikiDocCard } from '../components/wiki/WikiDocCard.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';

export function WikiIndexPage() {
  usePageTitle('Library');
  const { agents, categories, loading } = useAgents();
  const [q, setQ] = useState('');
  const [summaries, setSummaries] = useState({});
  const nav = useNavigate();

  useEffect(() => {
    if (!agents.length) return;
    Promise.all(
      agents.map(async (a) => {
        const md = await fetchReadme(a);
        return [a.slug, extractReadmeSummary(md) || a.desc];
      })
    ).then((pairs) => setSummaries(Object.fromEntries(pairs)));
  }, [agents]);

  const filtered = agents.filter((a) => {
    const text = `${a.name} ${summaries[a.slug] || a.desc}`.toLowerCase();
    return !q || text.includes(q.toLowerCase());
  });
  const grouped = groupByCategory(filtered, categories);

  if (loading) return <div className="wiki-index"><Skeleton lines={5} /></div>;

  return (
    <div className="wiki-index">
      <header className="wiki-index-head">
        <h1 className="wiki-index-title">Library</h1>
        <p className="wiki-index-sub">Agent documentation pulled from each README</p>
      </header>

      <div className="wiki-index-search">
        <svg className="wiki-index-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="wiki-index-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search documentation…"
          aria-label="Search documentation"
        />
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="wiki-cat">
          <h2 className="wiki-cat-title">{cat}</h2>
          <div className="wiki-grid">
            {items.map((a) => (
              <WikiDocCard
                key={a.id}
                agent={a}
                summary={summaries[a.slug]}
                onOpen={() => nav(`/library/${a.slug}`)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
