/** Searchable picker to attach multiple wiki pages on Ask. */
import { useMemo, useState } from 'react';

export function WikiPicker({ agents, selected, onAdd, onClose }) {
  const [q, setQ] = useState('');

  const available = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return agents.filter((a) => {
      if (selected.includes(a.slug)) return false;
      if (!needle) return true;
      const text = `${a.name} ${a.desc} ${a.category}`.toLowerCase();
      return text.includes(needle);
    });
  }, [agents, selected, q]);

  return (
    <div className="ask-wiki-picker">
      <div className="ask-wiki-picker-head">
        <span className="ask-wiki-picker-title">Add wiki pages</span>
        <button type="button" className="ask-wiki-picker-close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="ask-wiki-picker-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="ask-wiki-picker-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search wiki…"
          aria-label="Search wiki pages"
          autoFocus
        />
      </div>

      <ul className="ask-wiki-picker-list">
        {available.length === 0 ? (
          <li className="ask-wiki-picker-empty">No wiki pages found</li>
        ) : (
          available.map((a) => (
            <li key={a.slug}>
              <button type="button" className="ask-wiki-picker-item" onClick={() => onAdd(a)}>
                <span className="ask-wiki-picker-item-name">{a.name}</span>
                <span className="ask-wiki-picker-item-cat">{a.category}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
