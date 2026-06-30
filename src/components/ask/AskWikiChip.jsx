/** Selected wiki page chip on Ask page. */
export function AskWikiChip({ agent, onRemove }) {
  return (
    <span className="ask-wiki-chip">
      <span className="ask-wiki-chip-name">{agent.name}</span>
      <span className="ask-wiki-chip-cat">{agent.category}</span>
      <button
        type="button"
        className="ask-wiki-chip-remove"
        onClick={onRemove}
        aria-label={`Remove ${agent.name} doc`}
      >
        ×
      </button>
    </span>
  );
}
