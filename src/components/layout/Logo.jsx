/** AgentHub wordmark + icon — Ollama-style. */
import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="logo">
      <svg className="logo-icon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V20a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4.9c1.8-1.4 3-3.6 3-6.1 0-4-3-7-7-7zm0 2c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5z" />
      </svg>
      <span>AgentHub</span>
    </Link>
  );
}
