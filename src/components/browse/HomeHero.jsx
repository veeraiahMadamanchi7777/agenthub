/** Home page hero — search only. */
export function HomeHero({ q, setQ }) {
  return (
    <section className="home-hero">
      <div className="hero-search-box">
        <svg className="hero-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="hero-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search agents…"
          aria-label="Search agents"
          autoFocus
        />
      </div>
    </section>
  );
}
