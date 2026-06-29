/** Wiki index card — agent docs entry. */
export function WikiDocCard({ agent, summary, onOpen }) {
  const onKey = (e) => { if (e.key === 'Enter') onOpen(); };
  return (
    <article
      className="wiki-card"
      tabIndex={0}
      role="link"
      aria-label={`${agent.name} documentation`}
      onClick={onOpen}
      onKeyDown={onKey}
    >
      <div className="wiki-card-top">
        <h3 className="wiki-card-name">{agent.name}</h3>
        <span className="wiki-card-cat">{agent.category}</span>
      </div>
      <p className="wiki-card-desc">{summary || agent.desc}</p>
      <div className="wiki-card-foot">
        <span className="wiki-card-link">Read wiki →</span>
      </div>
    </article>
  );
}
