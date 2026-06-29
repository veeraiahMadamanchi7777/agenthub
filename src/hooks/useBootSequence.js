/** Animates boot terminal lines from mock JSON. */
import { useEffect, useState } from 'react';
import { getBootLines } from '../api/studioApi.js';

export function useBootSequence(active) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) return;
    setLines([]); setDone(false);
    let i = 0;
    getBootLines().then((boot) => {
      const iv = setInterval(() => {
        if (i < boot.length) { setLines((l) => [...l, boot[i++]]); }
        else { clearInterval(iv); setDone(true); }
      }, 300);
      return () => clearInterval(iv);
    });
  }, [active]);
  return { lines, done };
}
