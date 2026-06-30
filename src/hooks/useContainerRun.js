/** Tracks a real container run: fetches initial state, then streams live logs/status over WS. */
import { useCallback, useEffect, useState } from 'react';
import { getRun, stopRun, openRunSocket } from '../api/runsApi.js';

export function useContainerRun(sessionId) {
  const [status, setStatus] = useState('starting');
  const [logs, setLogs] = useState([]);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [slug, setSlug] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    getRun(sessionId)
      .then((data) => {
        if (cancelled) return;
        setStatus(data.status);
        setLogs(data.logs);
        setEmbedUrl(data.embedUrl);
        setSlug(data.slug);
      })
      .catch((e) => !cancelled && setError(e.message));

    const close = openRunSocket(sessionId, {
      onInit: (msg) => {
        setStatus(msg.status);
        setLogs(msg.logs);
      },
      onLog: (line) => setLogs((l) => [...l, line]),
      onStatus: (s) => setStatus(s),
      onError: (m) => setError(m),
    });

    return () => {
      cancelled = true;
      close();
    };
  }, [sessionId]);

  const stop = useCallback(async () => {
    if (!sessionId) return;
    try {
      await stopRun(sessionId);
    } catch (e) {
      setError(e.message);
    }
  }, [sessionId]);

  const isLive = status === 'starting' || status === 'running';

  return { status, logs, embedUrl, slug, error, isLive, stop };
}
