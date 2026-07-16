/**
 * Local run backend for AgentHub.
 *
 * Run alongside `npm run dev`:
 *   npm run server
 *
 * Exposes:
 *   POST /api/agents/register               { name, author, desc, ... } -> { agent }
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
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import passport from 'passport';
import { getRunConfig, buildConfigFromAgent } from './runConfigs.js';
import { runContainer, stopContainer, explainDockerError } from './dockerRunner.js';
import { router as authRouter, requireAuth } from './auth.js';
import { router as githubRouter } from './authGithub.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const AGENTS_PATH = path.join(ROOT, 'public/mock/agents.json');
const CATEGORIES_PATH = path.join(ROOT, 'public/mock/categories.json');

const PORT = process.env.RUN_SERVER_PORT || 4500;
const MAX_LOG_LINES = 4000;

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRouter);
app.use('/api/auth/github', githubRouter);

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

app.get('/api/agents/validate-image', async (req, res) => {
  const image = (req.query.image || '').trim();
  if (!image) return res.status(400).json({ error: 'image is required' });

  // Detect custom registry: first segment contains a dot or colon (e.g. ghcr.io, localhost:5000)
  const firstSegment = image.split('/')[0];
  const isCustomRegistry = image.includes('/') && (firstSegment.includes('.') || firstSegment.includes(':'));
  if (isCustomRegistry) {
    return res.json({ valid: null, custom: true, message: 'Custom registry — image will be verified when you run it' });
  }

  // Parse [namespace/]name[:tag]
  const parts = image.split('/');
  const nameWithTag = parts[parts.length - 1];
  const namespace = parts.length > 1 ? parts.slice(0, -1).join('/') : 'library';
  const [name] = nameWithTag.split(':');

  try {
    const r = await fetch(`https://hub.docker.com/v2/repositories/${namespace}/${name}/`);
    if (!r.ok) {
      const error = r.status === 404 ? 'Image not found on Docker Hub' : 'Docker Hub returned an error';
      return res.json({ valid: false, error });
    }
    const data = await r.json();
    return res.json({
      valid: true,
      pullCount: data.pull_count,
      lastUpdated: data.last_updated,
      isOfficial: namespace === 'library',
      description: data.description,
    });
  } catch {
    return res.json({ valid: false, error: 'Could not reach Docker Hub' });
  }
});

app.post('/api/agents/register', requireAuth, async (req, res) => {
  const { name, author, desc, category, caps, models, color, dockerImage, dockerPort, embed, readme, envVars, inputs, outputs } = req.body || {};

  if (!name?.trim())        return res.status(400).json({ error: 'name is required' });
  if (!desc?.trim())        return res.status(400).json({ error: 'desc is required' });
  if (!category?.trim())    return res.status(400).json({ error: 'category is required' });
  if (!dockerImage?.trim()) return res.status(400).json({ error: 'dockerImage is required' });
  if (!readme?.trim())      return res.status(400).json({ error: 'README is required' });

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const agents = JSON.parse(await readFile(AGENTS_PATH, 'utf8'));
  if (agents.find((a) => a.slug === slug)) {
    return res.status(409).json({ error: `An agent named "${slug}" is already registered.` });
  }

  const parseTags = (v) =>
    Array.isArray(v) ? v : (v || '').split(',').map((s) => s.trim()).filter(Boolean);

  const port = dockerPort ? Number(dockerPort) : null;
  const isEmbed = Boolean(embed) && Boolean(port);

  const agent = {
    id: Math.max(0, ...agents.map((a) => a.id)) + 1,
    slug,
    name: name.trim(),
    author: author?.trim() || req.user.username,
    authorId: req.user.id,
    desc: desc.trim(),
    pulls: 0,
    updatedAt: new Date().toISOString(),
    category: category.trim(),
    caps: parseTags(caps),
    models: parseTags(models),
    runnable: true,
    verified: false,
    color: color || '#6366f1',
    dockerImage: dockerImage.trim(),
    ...(port ? { containerPort: port, hostPort: port } : {}),
    ...(isEmbed ? { kind: 'embedded', embedUrl: `http://localhost:${port}` } : {}),
    envVars: Array.isArray(envVars) ? envVars : [],
    inputs: Array.isArray(inputs) ? inputs : [],
    outputs: Array.isArray(outputs) ? outputs : [],
  };

  agents.push(agent);
  await writeFile(AGENTS_PATH, JSON.stringify(agents, null, 2));

  // Add category to categories.json if it's new
  const cats = JSON.parse(await readFile(CATEGORIES_PATH, 'utf8'));
  if (!cats.includes(agent.category)) {
    cats.push(agent.category);
    await writeFile(CATEGORIES_PATH, JSON.stringify(cats, null, 2));
  }

  const readmeDir = path.join(ROOT, 'public/readmes', slug);
  await mkdir(readmeDir, { recursive: true });
  await writeFile(path.join(readmeDir, 'README.md'), readme);

  res.status(201).json({ agent });
});

app.post('/api/runs', async (req, res) => {
  const { slug, userEnv = {} } = req.body || {};
  let config = getRunConfig(slug);

  if (!config) {
    const agents = JSON.parse(await readFile(AGENTS_PATH, 'utf8'));
    const agent = agents.find((a) => a.slug === slug);
    if (agent?.dockerImage) config = buildConfigFromAgent(agent);
  }

  if (!config) {
    return res.status(400).json({ error: `No run config for agent "${slug}".` });
  }

  // Merge user-supplied env vars (e.g. API keys) into the container env
  if (Object.keys(userEnv).length > 0) {
    const extra = Object.entries(userEnv).map(([k, v]) => `${k}=${v}`);
    config = { ...config, env: [...(config.env || []), ...extra] };
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

  // Fire-and-forget: increment pull count for registered agents
  readFile(AGENTS_PATH, 'utf8').then((raw) => {
    const agents = JSON.parse(raw);
    const idx = agents.findIndex((a) => a.slug === slug);
    if (idx !== -1 && typeof agents[idx].pulls === 'number') {
      agents[idx].pulls += 1;
      return writeFile(AGENTS_PATH, JSON.stringify(agents, null, 2));
    }
  }).catch(() => {});

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

app.put('/api/agents/:slug', requireAuth, async (req, res) => {
  const { slug } = req.params;
  const { name, author, desc, category, caps, models, color, dockerImage, dockerPort, embed, readme, envVars, inputs, outputs } = req.body || {};

  const agents = JSON.parse(await readFile(AGENTS_PATH, 'utf8'));
  const idx = agents.findIndex((a) => a.slug === slug);
  if (idx === -1) return res.status(404).json({ error: `Agent "${slug}" not found` });
  if (agents[idx].authorId && agents[idx].authorId !== req.user.id) {
    return res.status(403).json({ error: 'You do not have permission to edit this agent' });
  }

  const parseTags = (v) =>
    Array.isArray(v) ? v : (v || '').split(',').map((s) => s.trim()).filter(Boolean);

  const port = dockerPort ? Number(dockerPort) : null;
  const isEmbed = Boolean(embed) && Boolean(port);

  const updated = {
    ...agents[idx],
    ...(name?.trim()        && { name: name.trim() }),
    ...(author?.trim()      && { author: author.trim() }),
    ...(desc?.trim()        && { desc: desc.trim() }),
    ...(category?.trim()    && { category: category.trim() }),
    ...(caps  !== undefined && { caps: parseTags(caps) }),
    ...(models !== undefined && { models: parseTags(models) }),
    ...(color               && { color }),
    ...(dockerImage?.trim() && { dockerImage: dockerImage.trim() }),
    containerPort: port || agents[idx].containerPort || null,
    hostPort: port || agents[idx].hostPort || null,
    ...(isEmbed
      ? { kind: 'embedded', embedUrl: `http://localhost:${port}` }
      : { kind: undefined, embedUrl: undefined }),
    ...(Array.isArray(envVars)  && { envVars }),
    ...(Array.isArray(inputs)   && { inputs }),
    ...(Array.isArray(outputs)  && { outputs }),
    updatedAt: new Date().toISOString(),
  };

  agents[idx] = updated;
  await writeFile(AGENTS_PATH, JSON.stringify(agents, null, 2));

  // Add category if new
  if (category?.trim()) {
    const cats = JSON.parse(await readFile(CATEGORIES_PATH, 'utf8'));
    if (!cats.includes(updated.category)) {
      cats.push(updated.category);
      await writeFile(CATEGORIES_PATH, JSON.stringify(cats, null, 2));
    }
  }

  if (readme?.trim()) {
    const readmeDir = path.join(ROOT, 'public/readmes', slug);
    await mkdir(readmeDir, { recursive: true });
    await writeFile(path.join(readmeDir, 'README.md'), readme);
  }

  res.json({ agent: updated });
});

app.delete('/api/agents/:slug', requireAuth, async (req, res) => {
  const { slug } = req.params;
  const agents = JSON.parse(await readFile(AGENTS_PATH, 'utf8'));
  const idx = agents.findIndex((a) => a.slug === slug);
  if (idx === -1) return res.status(404).json({ error: `Agent "${slug}" not found` });
  if (agents[idx].authorId && agents[idx].authorId !== req.user.id) {
    return res.status(403).json({ error: 'You do not have permission to delete this agent' });
  }

  agents.splice(idx, 1);
  await writeFile(AGENTS_PATH, JSON.stringify(agents, null, 2));

  const { rm } = await import('node:fs/promises');
  await rm(path.join(ROOT, 'public/readmes', slug), { recursive: true, force: true });

  res.json({ deleted: slug });
});

app.post('/api/runs/test', async (req, res) => {
  const { dockerImage, dockerPort, embed } = req.body || {};
  if (!dockerImage?.trim()) return res.status(400).json({ error: 'dockerImage is required' });

  const port = dockerPort ? Number(dockerPort) : null;
  const config = {
    image: dockerImage.trim(),
    cmd: undefined,
    containerPort: port,
    hostPort: port,
    embed: Boolean(embed) && Boolean(port),
    env: [],
  };

  const sessionId = randomUUID();
  const session = {
    sessionId,
    slug: '__test__',
    config,
    container: null,
    status: 'starting',
    logs: [],
    _partial: '',
    sockets: new Set(),
    embedUrl: null,
  };
  sessions.set(sessionId, session);
  res.json({ sessionId, status: session.status });

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
