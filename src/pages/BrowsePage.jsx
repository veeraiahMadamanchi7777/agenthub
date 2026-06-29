/** Home page — agent listing with filters. */
import { useState } from 'react';
import { useAgents } from '../hooks/useAgents.js';
import { filterAgents } from '../utils/filterAgents.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useSearch } from '../context/SearchProvider.jsx';
import { AgentRow } from '../components/browse/AgentRow.jsx';
import { FilterBar } from '../components/browse/FilterBar.jsx';
import { ReelsSidebar } from '../components/browse/ReelsSidebar.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export function BrowsePage() {
  usePageTitle('Agents');
  const { agents, categories, loading } = useAgents();
  const { q } = useSearch();
  const [cat, setCat] = useState('All');
  const [sort, setSort] = useState('popular');
  const [tag, setTag] = useState(null);
  const list = filterAgents(agents, { q, category: cat, sort, tag });
  const clear = () => { setCat('All'); setTag(null); };

  if (loading) return <div className="browse-shell"><div className="browse-main"><Skeleton lines={5} /></div></div>;

  return (
    <div className="browse-shell">
      <div className="browse-main">
        <FilterBar categories={categories} cat={cat} onCat={setCat} sort={sort} onSort={setSort} tag={tag} onClearTag={() => setTag(null)} />
        {list.length === 0 ? (
          <EmptyState title="No agents found" hint="Try adjusting your search or filters." onClear={clear} />
        ) : (
          <div className="model-list">{list.map((a) => <AgentRow key={a.id} agent={a} onTagClick={setTag} />)}</div>
        )}
      </div>
      <ReelsSidebar />
    </div>
  );
}
