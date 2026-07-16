/** Loads agent catalog from mock API. Re-fetches on 'agents:invalidate' window event. */
import { useEffect, useState } from 'react';
import { getAgents, getCategories } from '../api/agentsApi.js';

export function useAgents() {
  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('agents:invalidate', handler);
    return () => window.removeEventListener('agents:invalidate', handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAgents(), getCategories()])
      .then(([a, c]) => { setAgents(a); setCategories(c); })
      .finally(() => setLoading(false));
  }, [tick]);

  return { agents, categories, loading };
}
