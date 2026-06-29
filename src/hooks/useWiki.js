/** Loads wiki index from mock API. */
import { useEffect, useState } from 'react';
import { getWikiIndex } from '../api/wikiApi.js';

export function useWiki() {
  const [wiki, setWiki] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getWikiIndex().then(setWiki).finally(() => setLoading(false));
  }, []);
  return { wiki, loading };
}
