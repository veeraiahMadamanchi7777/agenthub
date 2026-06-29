/** Loading skeleton placeholder. */
export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => <div key={i} className="skeleton-line" />)}
    </div>
  );
}
