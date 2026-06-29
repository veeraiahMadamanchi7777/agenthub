/** Debounced global search against mock agent API. */
import { useEffect, useState } from 'react';
import { searchAgents } from '../api/agentsApi.js';

export function useGlobalSearch(query) {
  const [results, setResults] = useState([]);
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => searchAgents(query).then(setResults), 250);
    return () => clearTimeout(t);
  }, [query]);
  return results;
}
