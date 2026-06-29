/** Wiki content section block. */
export function WikiSection({ title, children }) {
  return (
    <section className="wiki-section">
      <h3 className="wiki-section-label">{title}</h3>
      <div className="wiki-section-body">{children}</div>
    </section>
  );
}
