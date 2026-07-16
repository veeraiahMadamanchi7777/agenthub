import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'agenthub.db');

// Ensure data directory exists
import { mkdirSync } from 'node:fs';
mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    UNIQUE,
    username        TEXT    UNIQUE NOT NULL,
    name            TEXT    DEFAULT '',
    password_hash   TEXT,
    github_id       TEXT    UNIQUE,
    github_username TEXT,
    bio             TEXT    DEFAULT '',
    avatar_color    TEXT    DEFAULT '#6366f1',
    avatar_data     TEXT    DEFAULT '',
    created_at      TEXT    DEFAULT (datetime('now'))
  );
`);

// Safe migrations for existing DBs
for (const col of ['name TEXT DEFAULT ""', 'avatar_data TEXT DEFAULT ""']) {
  try { db.exec(`ALTER TABLE users ADD COLUMN ${col}`); } catch { /* already exists */ }
}
