/** Loads agent catalog from mock API. */
import { useEffect, useState } from 'react';
import { getAgents, getCategories } from '../api/agentsApi.js';

export function useAgents() {
  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([getAgents(), getCategories()])
      .then(([a, c]) => { setAgents(a); setCategories(c); })
      .finally(() => setLoading(false));
  }, []);
  return { agents, categories, loading };
}
