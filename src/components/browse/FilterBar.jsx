/** Category pills in horizontal scroll + sort. */
import { Pill } from '../ui/Pill.jsx';
import { SortSelect } from '../ui/SortSelect.jsx';

export function FilterBar({ categories, cat, onCat, sort, onSort, tag, onClearTag }) {
  const pills = categories.filter((c) => c !== 'All');
  return (
    <div className="filter-bar">
      <div className="filter-pills-scroll">
        <Pill active={cat === 'All' && !tag} onClick={() => { onCat('All'); onClearTag?.(); }} aria-pressed={cat === 'All' && !tag}>All</Pill>
        {pills.map((c) => <Pill key={c} active={cat === c} onClick={() => onCat(c)} aria-pressed={cat === c}>{c}</Pill>)}
        {tag && <Pill active onClick={onClearTag} aria-pressed>Tag: {tag} ×</Pill>}
      </div>
      <SortSelect value={sort} onChange={onSort} />
    </div>
  );
}
