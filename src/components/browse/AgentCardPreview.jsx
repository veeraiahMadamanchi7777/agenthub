/** Read-only agent card preview — mirrors AgentRow markup so the preview is pixel-identical to the catalog. */
export function AgentCardPreview({ name, author, desc, caps, models, color }) {
  const displayName = name.trim() || 'agent-name';
  const displayDesc = desc.trim() || 'Your agent description will appear here.';
  const displayAuthor = author.trim() || 'author';
  const tags = [...caps, ...models].filter(Boolean).slice(0, 3);
  const initial = displayName[0].toUpperCase();

  return (
    <div className="card-preview-wrap">
      <p className="card-preview-label">Preview</p>
      <div className="card-preview-agent-item">
        <div className="card-preview-inner">
          <div className="card-preview-avatar" style={{ background: color }} aria-hidden="true">
            {initial}
          </div>
          <div className="agent-item-main">
            <div className="card-preview-name-row">
              <h2 className="agent-item-name">{displayName}</h2>
              <span className="card-preview-author">by {displayAuthor}</span>
            </div>
            <p className="agent-item-desc">{displayDesc}</p>
            <div className="agent-item-tags">
              {tags.length > 0
                ? tags.map((t) => <span key={t} className="agent-tag">{t}</span>)
                : <span className="card-preview-tag-placeholder">caps and models appear here</span>}
            </div>
            <p className="agent-item-stats">
              <span className="agent-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                0 Pulls
              </span>
              <span className="agent-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>
                {models.filter(Boolean).length || 0} Models
              </span>
              <span className="agent-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                just now
              </span>
            </p>
          </div>
          <button className="agent-run-btn" disabled tabIndex={-1} aria-hidden="true">Run</button>
        </div>
      </div>
    </div>
  );
}
