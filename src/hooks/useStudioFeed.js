/** Studio A2A feed — streams mock demo messages on a timer. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getA2ADemo } from '../api/studioApi.js';

export function useStudioFeed(presetId) {
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [convo, setConvo] = useState([]);
  const idx = useRef(0);
  const timer = useRef(null);

  useEffect(() => { if (presetId) getA2ADemo(presetId).then(setConvo); }, [presetId]);

  const reset = useCallback(() => {
    setRunning(false); setMessages([]); idx.current = 0; clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (!running || idx.current >= convo.length) {
      if (idx.current >= convo.length) setRunning(false);
      return;
    }
    const m = convo[idx.current];
    timer.current = setTimeout(() => {
      setMessages((prev) => [...prev, { ...m, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      idx.current += 1;
    }, m.type === 'a2a' ? 1800 : 900);
    return () => clearTimeout(timer.current);
  }, [running, messages, convo]);

  const run = () => {
    setMessages([]); idx.current = 0; clearTimeout(timer.current); setRunning(true);
  };
  return { messages, running, run, reset, convoLen: convo.length };
}
