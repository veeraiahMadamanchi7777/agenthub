/** Loads an agent README for wiki / docs views. */
import { useEffect, useState } from 'react';
import { fetchReadme } from '../api/wikiApi.js';
import { extractReadmeSummary } from '../utils/readme.js';

export function useReadme(slug, agent) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setMissing(false);
    fetchReadme(agent || slug)
      .then((md) => {
        if (!md) { setMissing(true); setContent(''); return; }
        setContent(md);
      })
      .finally(() => setLoading(false));
  }, [slug, agent?.readme]);

  return {
    content,
    summary: extractReadmeSummary(content),
    loading,
    missing,
  };
}
