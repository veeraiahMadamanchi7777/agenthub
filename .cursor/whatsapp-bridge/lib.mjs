import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const BRIDGE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(BRIDGE_DIR, '../..');
const ENV_CANDIDATES = [
  path.join(REPO_ROOT, '.cursor/whatsapp.env'),
  path.join(process.env.HOME || '', '.cursor/whatsapp.env'),
];

export const PATHS = {
  bridgeDir: BRIDGE_DIR,
  repoRoot: REPO_ROOT,
  authDir: path.join(BRIDGE_DIR, 'auth'),
  inboxFile: path.join(BRIDGE_DIR, 'inbox/queue.json'),
};

let cachedEnv = null;

export function loadEnv() {
  if (cachedEnv) return cachedEnv;

  const env = {};
  for (const file of ENV_CANDIDATES) {
    if (!file || !fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      env[key] = value;
    }
    break;
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('WHATSAPP_') || key.startsWith('CALLMEBOT_') || key === 'CURSOR_PROJECT_DIR') {
      env[key] = value;
    }
  }

  cachedEnv = env;
  return env;
}

function ensureInboxFile() {
  fs.mkdirSync(path.dirname(PATHS.inboxFile), { recursive: true });
  if (!fs.existsSync(PATHS.inboxFile)) {
    fs.writeFileSync(PATHS.inboxFile, JSON.stringify({ messages: [] }, null, 2));
  }
}

function readInbox() {
  ensureInboxFile();
  try {
    return JSON.parse(fs.readFileSync(PATHS.inboxFile, 'utf8'));
  } catch {
    return { messages: [] };
  }
}

function writeInbox(data) {
  ensureInboxFile();
  const tmp = `${PATHS.inboxFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, PATHS.inboxFile);
}

export function queueInstruction(text, meta = {}) {
  const inbox = readInbox();
  const entry = {
    id: randomUUID(),
    text: text.trim(),
    source: 'whatsapp',
    status: 'pending',
    receivedAt: new Date().toISOString(),
    ...meta,
  };
  inbox.messages.push(entry);
  writeInbox(inbox);
  return entry;
}

export function consumePendingInstructions(limit = 5) {
  const inbox = readInbox();
  const pending = inbox.messages.filter((m) => m.status === 'pending').slice(0, limit);
  if (pending.length === 0) return [];

  for (const message of pending) {
    message.status = 'consumed';
    message.consumedAt = new Date().toISOString();
  }
  writeInbox(inbox);
  return pending;
}

export function peekPendingCount() {
  return readInbox().messages.filter((m) => m.status === 'pending').length;
}

function buildQuery(params) {
  return new URLSearchParams(params).toString();
}

export async function sendWhatsAppMessage(text) {
  const env = loadEnv();
  const phone = env.CALLMEBOT_PHONE;
  const apikey = env.CALLMEBOT_API_KEY;
  if (!phone || !apikey) {
    throw new Error('Missing CALLMEBOT_PHONE or CALLMEBOT_API_KEY in .cursor/whatsapp.env');
  }

  const url = `https://api.callmebot.com/whatsapp.php?${buildQuery({
    phone,
    apikey,
    text,
    source: 'cursor-hook',
  })}`;

  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`CallMeBot WhatsApp failed (${res.status}): ${body}`);
  }
  return body;
}

export async function makePhoneCall(text, options = {}) {
  const env = loadEnv();
  const phone = env.CALLMEBOT_PHONE;
  const apikey = env.CALLMEBOT_CALL_API_KEY || env.CALLMEBOT_API_KEY;
  if (!phone || !apikey) {
    throw new Error('Missing CALLMEBOT_PHONE or CALLMEBOT_API_KEY for phone calls');
  }

  const params = {
    phone,
    apikey,
    text,
  };
  if (env.CALLMEBOT_CALL_LANG) params.lang = env.CALLMEBOT_CALL_LANG;
  if (options.lang) params.lang = options.lang;

  const url = `https://api.callmebot.com/call.php?${buildQuery(params)}`;
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`CallMeBot call failed (${res.status}): ${body}`);
  }
  return body;
}

export async function notifyAgentFinished(summary) {
  const env = loadEnv();
  const mode = (env.WHATSAPP_NOTIFY_MODE || 'message').toLowerCase();
  const text = summary.slice(0, 900);

  if (mode === 'call' || mode === 'phone') {
    return makePhoneCall(text);
  }
  if (mode === 'both') {
    await sendWhatsAppMessage(text);
    return makePhoneCall(text);
  }
  return sendWhatsAppMessage(text);
}

export function isAllowedSender(jid, env = loadEnv()) {
  const allowed = (env.WHATSAPP_ALLOWED_NUMBERS || '')
    .split(',')
    .map((n) => n.replace(/\D/g, ''))
    .filter(Boolean);

  if (allowed.length === 0) return true;

  const senderDigits = jid.split('@')[0].replace(/\D/g, '');
  return allowed.some((n) => senderDigits.endsWith(n) || n.endsWith(senderDigits));
}

export function normalizeInstruction(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return null;
  return trimmed.replace(/^cursor:\s*/i, '').trim();
}
