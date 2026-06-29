/** Sets document.title on mount. */
import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — AgentHub` : 'AgentHub';
    return () => { document.title = prev; };
  }, [title]);
}
