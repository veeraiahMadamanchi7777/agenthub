/** Session chat with mock agent replies from JSON. */
import { useState, useEffect } from 'react';
import { getAgentReplies } from '../api/studioApi.js';

export function useSessionChat(initialMessages, agentSlug) {
  const [msgs, setMsgs] = useState(initialMessages || []);
  const [thinking, setThinking] = useState(false);
  useEffect(() => { if (initialMessages?.length) setMsgs(initialMessages); }, [initialMessages]);
  const send = async (text) => {
    if (!text.trim() || thinking) return;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMsgs((m) => [...m, { role: 'user', content: text.trim(), ts }]);
    setThinking(true);
    const replies = await getAgentReplies();
    const pool = replies[agentSlug] || ['Processing your request...'];
    pool.slice(0, 2).forEach((r, i) => {
      setTimeout(() => {
        const content = r.replace('{n}', String(Math.floor(Math.random() * 10) + 3))
          .replace('{summary}', 'Multiple high-quality sources found.');
        setMsgs((m) => [...m, { role: 'agent', content, ts }]);
        if (i === 1) setThinking(false);
      }, 1200 + i * 1600);
    });
  };
  return { msgs, thinking, send };
}
