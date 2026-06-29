/** Site footer. */
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-copy">© 2026 AgentHub</span>
        <div className="footer-links">
          <Link to="/wiki">Docs</Link>
          <a href="mailto:hello@agenthub.dev">Contact</a>
        </div>
      </div>
    </footer>
  );
}
