import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import fs from 'node:fs';
import {
  PATHS,
  isAllowedSender,
  loadEnv,
  makePhoneCall,
  normalizeInstruction,
  queueInstruction,
  sendWhatsAppMessage,
} from './lib.mjs';

const HELP_TEXT = [
  'Cursor WhatsApp bridge commands:',
  '/help - show this message',
  '/status - bridge status',
  '/call <message> - test a phone call via CallMeBot',
  '/ping - health check',
  '',
  'Send any other text (or "cursor: ...") to queue a Cursor instruction.',
].join('\n');

async function handleCommand(text, reply) {
  const [command, ...rest] = text.trim().split(/\s+/);
  const arg = rest.join(' ').trim();

  switch (command.toLowerCase()) {
    case '/help':
      await reply(HELP_TEXT);
      return true;
    case '/status': {
      const pending = fs.existsSync(PATHS.inboxFile)
        ? JSON.parse(fs.readFileSync(PATHS.inboxFile, 'utf8')).messages.filter(
            (m) => m.status === 'pending'
          ).length
        : 0;
      await reply(`Bridge online. Pending Cursor instructions: ${pending}.`);
      return true;
    }
    case '/ping':
      await reply('pong');
      return true;
    case '/call':
      if (!arg) {
        await reply('Usage: /call your spoken message');
        return true;
      }
      await makePhoneCall(arg.slice(0, 240));
      await reply('Phone call requested.');
      return true;
    default:
      return false;
  }
}

async function startBridge() {
  loadEnv();
  fs.mkdirSync(PATHS.authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(PATHS.authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('\nScan this QR code with WhatsApp (Linked Devices):\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      console.log('[whatsapp-bridge] Connected. Waiting for instructions...');
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldRestart = code !== DisconnectReason.loggedOut;
      console.log(`[whatsapp-bridge] Disconnected (${code}). Restarting=${shouldRestart}`);
      if (shouldRestart) {
        setTimeout(startBridge, 3000);
      } else {
        console.log('[whatsapp-bridge] Logged out. Delete auth/ and scan QR again.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid || jid.endsWith('@g.us')) continue;
      if (!isAllowedSender(jid)) continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        '';

      const trimmed = text.trim();
      if (!trimmed) continue;

      const reply = async (body) => {
        try {
          await sendWhatsAppMessage(body.slice(0, 900));
        } catch (err) {
          console.error(`[whatsapp-bridge] Failed to reply: ${err.message}`);
        }
      };

      if (trimmed.startsWith('/')) {
        await handleCommand(trimmed, reply);
        continue;
      }

      const instruction = normalizeInstruction(trimmed);
      if (!instruction) continue;

      queueInstruction(instruction, { from: jid });
      await reply(`Queued for Cursor: "${instruction.slice(0, 180)}"`);
      console.log(`[whatsapp-bridge] Queued instruction from ${jid}: ${instruction}`);
    }
  });
}

startBridge().catch((err) => {
  console.error(`[whatsapp-bridge] Fatal: ${err.message}`);
  process.exit(1);
});
