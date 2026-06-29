/** Breadcrumb navigation trail. */
import { Link } from 'react-router-dom';

export function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.label} className="breadcrumb-item">
          {i > 0 && <span className="breadcrumb-sep" aria-hidden="true">/</span>}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
