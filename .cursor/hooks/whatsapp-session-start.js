#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const bridgeDir = path.dirname(fileURLToPath(import.meta.url));
const libUrl = pathToFileURL(path.join(bridgeDir, '../whatsapp-bridge/lib.mjs')).href;

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const raw = await readStdin();
  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    process.stdout.write(raw || '{}');
    return;
  }

  const { PATHS, peekPendingCount } = await import(libUrl);

  if (!fs.existsSync(PATHS.inboxFile)) {
    process.stdout.write(raw || '{}');
    return;
  }

  const inbox = JSON.parse(fs.readFileSync(PATHS.inboxFile, 'utf8'));
  const pending = inbox.messages.filter((m) => m.status === 'pending').slice(0, 5);
  if (pending.length === 0) {
    process.stdout.write(raw || '{}');
    return;
  }

  const whatsappBlock = pending
    .map((m, i) => `${i + 1}. ${m.text}`)
    .join('\n');

  const remaining = peekPendingCount() - pending.length;
  const context = [
    'Pending WhatsApp instructions for this Cursor session:',
    whatsappBlock,
    remaining > 0 ? `${remaining} more queued.` : '',
    'These will be applied on the next prompt unless the user overrides them.',
  ]
    .filter(Boolean)
    .join('\n');

  process.stdout.write(
    JSON.stringify({
      additional_context: context,
    })
  );
}

main().catch(() => {
  process.stdout.write('{}');
});
