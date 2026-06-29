/** Page title block. */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header page-header-row">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
