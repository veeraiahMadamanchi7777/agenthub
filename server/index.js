/**
 * Local run backend for AgentHub.
 *
 * Run alongside `npm run dev`:
 *   npm run server
 *
 * Exposes:
 *   POST /api/runs              { slug }  -> { sessionId, status, embedUrl }
 *   GET  /api/runs/:sessionId             -> { status, embedUrl, logs }
 *   POST /api/runs/:sessionId/stop        -> { status }
 *   WS   /ws/runs/:sessionId               live log + status stream
 *
 * Requires Docker (e.g. Docker Desktop) running locally.
 */
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { getRunConfig } from './runConfigs.js';
import { runContainer, stopContainer, explainDockerError } from './dockerRunner.js';

const PORT = process.env.RUN_SERVER_PORT || 4500;
const MAX_LOG_LINES = 4000;

const app = express();
app.use(cors());
app.use(express.json());

/** sessionId -> { sessionId, slug, config, container, status, logs, _partial, sockets, embedUrl } */
const sessions = new Map();

function pushLine(session, line) {
  session.logs.push(line);
  if (session.logs.length > MAX_LOG_LINES) session.logs.shift();
  broadcast(session, { type: 'log', line });
}

function appendChunk(session, text) {
  session._partial += text;
  const parts = session._partial.split('\n');
  session._partial = parts.pop();
  for (const line of parts) pushLine(session, line);
}

function flushPartial(session) {
  if (session._partial) {
    pushLine(session, session._partial);
    session._partial = '';
  }
}

function broadcast(session, msg) {
  const data = JSON.stringify(msg);
  for (const ws of session.sockets) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
}

function setStatus(session, status, code) {
  session.status = status;
  broadcast(session, { type: 'status', status, code });
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/runs', async (req, res) => {
  const { slug } = req.body || {};
  const config = getRunConfig(slug);
  if (!config) {
    return res.status(400).json({ error: `No run config for agent "${slug}".` });
  }

  const sessionId = randomUUID();
  const session = {
    sessionId,
    slug,
    config,
    container: null,
    status: 'starting',
    logs: [],
    _partial: '',
    sockets: new Set(),
    embedUrl: config.embed ? `http://localhost:${config.hostPort ?? config.containerPort}` : null,
  };
  sessions.set(sessionId, session);

  res.json({ sessionId, slug, status: session.status, embedUrl: session.embedUrl });

  try {
    const container = await runContainer(
      config,
      (chunk) => appendChunk(session, chunk),
      (status, code) => {
        if (status !== 'running') flushPartial(session);
        setStatus(session, status, code);
      }
    );
    session.container = container;
  } catch (err) {
    pushLine(session, `Error: ${explainDockerError(err, config)}`);
    setStatus(session, 'errored');
  }
});

app.get('/api/runs/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Unknown session' });
  res.json({
    sessionId: session.sessionId,
    slug: session.slug,
    status: session.status,
    embedUrl: session.embedUrl,
    logs: session.logs,
  });
});

app.post('/api/runs/:sessionId/stop', async (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Unknown session' });
  if (session.container) await stopContainer(session.container);
  flushPartial(session);
  pushLine(session, 'Container stopped.');
  setStatus(session, 'stopped');
  res.json({ sessionId: session.sessionId, status: 'stopped' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const match = pathname.match(/^\/ws\/runs\/([^/]+)$/);
  if (!match) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, match[1]);
  });
});

wss.on('connection', (ws, sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) {
    ws.send(JSON.stringify({ type: 'error', message: 'Unknown session' }));
    ws.close();
    return;
  }
  ws.send(JSON.stringify({ type: 'init', status: session.status, logs: session.logs }));
  session.sockets.add(ws);
  ws.on('close', () => session.sockets.delete(ws));
});

server.listen(PORT, () => {
  console.log(`[agenthub-run-server] listening on http://localhost:${PORT}`);
});

async function shutdown() {
  for (const session of sessions.values()) {
    if (session.container) await stopContainer(session.container).catch(() => {});
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
