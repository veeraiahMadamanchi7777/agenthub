#!/usr/bin/env node
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
    input = {};
  }

  const {
    notifyAgentFinished,
    consumePendingInstructions,
    peekPendingCount,
  } = await import(libUrl);

  const cwd = input.cwd || input.workspace_roots?.[0] || process.cwd();
  const stopReason = input.stop_reason || input.status || 'finished';
  const pendingBefore = peekPendingCount();

  const summary = [
    'Cursor agent finished.',
    `Project: ${path.basename(cwd)}`,
    `Status: ${stopReason}`,
    pendingBefore > 0 ? `${pendingBefore} WhatsApp instruction(s) waiting.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  try {
    await notifyAgentFinished(summary);
  } catch (err) {
    console.error(`[whatsapp-notify] ${err.message}`);
  }

  const pending = consumePendingInstructions(1);
  if (pending.length > 0) {
    const instruction = pending[0].text;
    process.stdout.write(
      JSON.stringify({
        followup_message: `[WhatsApp instruction] ${instruction}`,
      })
    );
    return;
  }

  process.stdout.write('{}');
}

main().catch((err) => {
  console.error(`[whatsapp-notify] ${err.message}`);
  process.stdout.write('{}');
});
