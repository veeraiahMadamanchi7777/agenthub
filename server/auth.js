import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'agenthub-dev-secret-change-in-prod';
const JWT_TTL = '7d';

export const router = Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_TTL });
}

function safeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, username, name, password } = req.body || {};
  if (!email?.trim())    return res.status(400).json({ error: 'Email is required' });
  if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const slug = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!slug) return res.status(400).json({ error: 'Username must contain letters or numbers' });

  const hash = await bcrypt.hash(password, 12);
  try {
    const result = db.prepare(
      'INSERT INTO users (email, username, name, password_hash) VALUES (?, ?, ?, ?)'
    ).run(email.trim().toLowerCase(), slug, name?.trim() || '', hash);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const field = err.message.includes('email') ? 'Email' : 'Username';
      return res.status(409).json({ error: `${field} is already taken` });
    }
    throw err;
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  res.json({ token: signToken(user), user: safeUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

// PUT /api/auth/me — update profile
router.put('/me', requireAuth, (req, res) => {
  const { username, name, bio, avatar_color, avatar_data } = req.body || {};
  const updates = {};
  if (username?.trim()) {
    const slug = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (slug) updates.username = slug;
  }
  if (name !== undefined)         updates.name = name;
  if (bio !== undefined)          updates.bio = bio;
  if (avatar_color?.trim())       updates.avatar_color = avatar_color.trim();
  if (avatar_data !== undefined)  updates.avatar_data = avatar_data;

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' });

  const sets = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  try {
    db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.user.id);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Username is already taken' });
    throw err;
  }
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: safeUser(updated) });
});

// PUT /api/auth/password
router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user.password_hash) return res.status(400).json({ error: 'Account uses GitHub login — no password to change' });

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ ok: true });
});

// DELETE /api/auth/me
router.delete('/me', requireAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.json({ deleted: true });
});

// GET /api/users/:username — public profile
router.get('/users/:username', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: safeUser(user) });
});

// ── Middleware ────────────────────────────────────────────────
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
