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
    process.stdout.write(raw || '{}');
    return;
  }

  const { consumePendingInstructions } = await import(libUrl);
  const pending = consumePendingInstructions(5);
  if (pending.length === 0) {
    process.stdout.write(raw);
    return;
  }

  const whatsappBlock = pending
    .map((m, i) => `${i + 1}. ${m.text}`)
    .join('\n');

  const prompt =
    input.prompt ||
    input.content ||
    input.message ||
    input.text ||
    '';

  const mergedPrompt = [
    'The user sent the following instruction(s) from WhatsApp. Treat them as the active task:',
    whatsappBlock,
    '',
    prompt ? `Current prompt:\n${prompt}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const output = { ...input, prompt: mergedPrompt };
  process.stdout.write(JSON.stringify(output));
}

main().catch(() => {
  process.stdout.write('{}');
});
