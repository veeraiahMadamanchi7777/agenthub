/** Loads sessions list from mock API. */
import { useEffect, useState } from 'react';
import { getSessions } from '../api/sessionsApi.js';

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getSessions().then(setSessions).finally(() => setLoading(false));
  }, []);
  const running = sessions.filter((s) => s.status === 'running').length;
  return { sessions, loading, running };
}
