/** Client for the local run backend (server/index.js). Real container runs — not mocked. */

export async function startRun(slug) {
  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to start run');
  return res.json();
}

export async function getRun(sessionId) {
  const res = await fetch(`/api/runs/${sessionId}`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Run not found');
  return res.json();
}

export async function stopRun(sessionId) {
  const res = await fetch(`/api/runs/${sessionId}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to stop run');
  return res.json();
}

/** Opens a WS to the run server and wires handlers. Returns a cleanup function. */
export function openRunSocket(sessionId, { onInit, onLog, onStatus, onError } = {}) {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${window.location.host}/ws/runs/${sessionId}`);
  ws.onmessage = (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch { return; }
    if (msg.type === 'init') onInit?.(msg);
    else if (msg.type === 'log') onLog?.(msg.line);
    else if (msg.type === 'status') onStatus?.(msg.status, msg.code);
    else if (msg.type === 'error') onError?.(msg.message);
  };
  ws.onerror = () => onError?.('Connection to run server lost.');
  return () => ws.close();
}
