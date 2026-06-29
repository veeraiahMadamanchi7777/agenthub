/** Wiki index with search. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '../hooks/useAgents.js';
import { useWiki } from '../hooks/useWiki.js';
import { groupByCategory } from '../utils/groupByCategory.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';

export function WikiIndexPage() {
  usePageTitle('Wiki');
  const { agents, categories, loading: la } = useAgents();
  const { wiki, loading: lw } = useWiki();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const filtered = agents.filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()));
  const grouped = groupByCategory(filtered, categories);
  if (la || lw) return <main className="page"><Skeleton lines={5} /></main>;
  return (
    <main className="page">
      <PageHeader title="Wiki" subtitle="Documentation for every published agent" />
      <div className="search-box">
        <input className="search-input" style={{ paddingLeft: 16 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search wiki…" aria-label="Search wiki" />
      </div>
      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="wiki-block">
          <h3 className="wiki-cat-title">{cat}</h3>
          <div className="panel">
            {items.map((a) => (
              <div key={a.id} className="panel-row" onClick={() => nav(`/wiki/${a.slug}`)} role="link" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && nav(`/wiki/${a.slug}`)} aria-label={`${a.name} documentation`}>
                <div className="panel-body">
                  <div className="panel-title-row mono">{a.name}</div>
                  <p className="panel-desc">{wiki[a.slug]?.whatItDoes || a.desc}</p>
                </div>
                <span className="panel-arrow" aria-hidden="true">→</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
