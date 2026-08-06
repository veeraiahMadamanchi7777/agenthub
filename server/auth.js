import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { db } from './db.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.js';
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from './rateLimiter.js';

export const JWT_SECRET  = process.env.JWT_SECRET  || 'agenthub-dev-secret-change-in-prod';
const ACCESS_TTL_MS      = 15 * 60 * 1000;           // 15 minutes
const REFRESH_TTL_MS     = 7  * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_TTL_LONG   = 30 * 24 * 60 * 60 * 1000; // 30 days (remember me)
const IS_PROD            = process.env.NODE_ENV === 'production';

export const router = Router();

// ── Helpers ──────────────────────────────────────────────────

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
}

function safeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

function setAccessCookie(res, token) {
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    maxAge: ACCESS_TTL_MS,
  });
}

function setRefreshCookie(res, token, rememberMe = false) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: rememberMe ? REFRESH_TTL_LONG : REFRESH_TTL_MS,
  });
}

function clearAuthCookies(res) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth' });
}

function createRefreshToken(userId, req, rememberMe = false) {
  const raw  = genToken();
  const hash = sha256(raw);
  const ms   = rememberMe ? REFRESH_TTL_LONG : REFRESH_TTL_MS;
  const exp  = new Date(Date.now() + ms).toISOString();
  const device = (req.headers['user-agent'] || '').slice(0, 200);
  const ip   = req.ip || '';
  db.prepare(
    'INSERT INTO refresh_tokens (user_id, token_hash, device, ip, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, hash, device, ip, exp);
  return raw;
}

function issueTokens(res, user, req, rememberMe = false) {
  const accessToken  = signAccessToken(user);
  const refreshToken = createRefreshToken(user.id, req, rememberMe);
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken, rememberMe);
}

// ── Routes ───────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', registerLimiter, async (req, res) => {
  const { email, username, name, password } = req.body || {};
  if (!email?.trim())    return res.status(400).json({ error: 'Email is required' });
  if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const slug = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!slug) return res.status(400).json({ error: 'Username must contain letters or numbers' });

  const hash = await bcrypt.hash(password, 12);
  let user;
  try {
    const result = db.prepare(
      'INSERT INTO users (email, username, name, password_hash) VALUES (?, ?, ?, ?)'
    ).run(email.trim().toLowerCase(), slug, name?.trim() || '', hash);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const field = err.message.includes('email') ? 'Email' : 'Username';
      return res.status(409).json({ error: `${field} is already taken` });
    }
    throw err;
  }

  // Send verification email (fire-and-forget)
  const verifyToken = genToken();
  db.prepare(
    'INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, sha256(verifyToken), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
  sendVerificationEmail(user, verifyToken).catch(console.error);

  issueTokens(res, user, req);
  res.status(201).json({ user: safeUser(user) });
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password, rememberMe = false } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  issueTokens(res, user, req, rememberMe);
  res.json({ user: safeUser(user) });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const raw = req.cookies?.refresh_token;
  if (!raw) return res.status(401).json({ error: 'No refresh token' });

  const hash = sha256(raw);
  const session = db.prepare(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0'
  ).get(hash);

  if (!session) return res.status(401).json({ error: 'Invalid refresh token' });
  if (new Date(session.expires_at) < new Date()) {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(session.id);
    return res.status(401).json({ error: 'Refresh token expired' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!user) return res.status(401).json({ error: 'User not found' });

  // Rotate: revoke old, issue new
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(session.id);
  const newRefresh = createRefreshToken(user.id, req);
  const newAccess  = signAccessToken(user);
  setAccessCookie(res, newAccess);
  setRefreshCookie(res, newRefresh);
  db.prepare("UPDATE refresh_tokens SET last_used = datetime('now') WHERE token_hash = ?").run(sha256(newRefresh));

  res.json({ user: safeUser(user) });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const raw = req.cookies?.refresh_token;
  if (raw) {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(sha256(raw));
  }
  clearAuthCookies(res);
  res.json({ ok: true });
});

// POST /api/auth/logout-all
router.post('/logout-all', requireAuth, (req, res) => {
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(req.user.id);
  clearAuthCookies(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

// PUT /api/auth/me
router.put('/me', requireAuth, (req, res) => {
  const { username, name, bio, avatar_color, avatar_data } = req.body || {};
  const updates = {};
  if (username?.trim()) {
    const slug = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (slug) updates.username = slug;
  }
  if (name         !== undefined) updates.name         = name;
  if (bio          !== undefined) updates.bio          = bio;
  if (avatar_color?.trim())       updates.avatar_color = avatar_color.trim();
  if (avatar_data  !== undefined) updates.avatar_data  = avatar_data;

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
  if (!user.password_hash) return res.status(400).json({ error: 'Account uses social login — no password to change' });

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  // Revoke all sessions on password change for security
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(user.id);
  clearAuthCookies(res);
  res.json({ ok: true });
});

// DELETE /api/auth/me
router.delete('/me', requireAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  clearAuthCookies(res);
  res.json({ deleted: true });
});

// GET /api/auth/sessions
router.get('/sessions', requireAuth, (req, res) => {
  const sessions = db.prepare(
    "SELECT id, device, ip, created_at, last_used, expires_at FROM refresh_tokens WHERE user_id = ? AND revoked = 0 AND expires_at > datetime('now') ORDER BY last_used DESC"
  ).all(req.user.id);
  res.json({ sessions });
});

// DELETE /api/auth/sessions/:id
router.delete('/sessions/:id', requireAuth, (req, res) => {
  const result = db.prepare(
    'UPDATE refresh_tokens SET revoked = 1 WHERE id = ? AND user_id = ?'
  ).run(Number(req.params.id), req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Session not found' });
  res.json({ ok: true });
});

// GET /api/auth/verify-email
router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  const hash = sha256(token);
  const row  = db.prepare('SELECT * FROM email_verifications WHERE token_hash = ?').get(hash);
  if (!row) return res.status(400).json({ error: 'Invalid or already used verification link' });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Verification link has expired' });

  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(row.user_id);
  db.prepare('DELETE FROM email_verifications WHERE token_hash = ?').run(hash);
  res.json({ ok: true });
});

// POST /api/auth/resend-verification
router.post('/resend-verification', requireAuth, async (req, res) => {
  if (req.user.email_verified) return res.status(400).json({ error: 'Email already verified' });

  db.prepare('DELETE FROM email_verifications WHERE user_id = ?').run(req.user.id);
  const token = genToken();
  db.prepare(
    'INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).run(req.user.id, sha256(token), new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

  await sendVerificationEmail(req.user, token);
  res.json({ ok: true });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body || {};
  // Always 200 to avoid email enumeration
  if (!email?.trim()) return res.json({ ok: true });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !user.password_hash) return res.json({ ok: true });

  db.prepare('UPDATE password_resets SET used = 1 WHERE user_id = ?').run(user.id);
  const token = genToken();
  db.prepare(
    'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, sha256(token), new Date(Date.now() + 60 * 60 * 1000).toISOString());

  await sendPasswordResetEmail(user, token).catch(console.error);
  res.json({ ok: true });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and newPassword are required' });
  if (newPassword.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const hash = sha256(token);
  const row  = db.prepare('SELECT * FROM password_resets WHERE token_hash = ? AND used = 0').get(hash);
  if (!row) return res.status(400).json({ error: 'Invalid or already used reset link' });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Reset link has expired' });

  const pwHash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(pwHash, row.user_id);
  db.prepare('UPDATE password_resets SET used = 1 WHERE token_hash = ?').run(hash);
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(row.user_id);
  res.json({ ok: true });
});

// GET /api/users/:username — public profile
router.get('/users/:username', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: safeUser(user) });
});

// ── Middleware ────────────────────────────────────────────────
export function requireAuth(req, res, next) {
  // Prefer httpOnly cookie; fall back to Authorization header
  const cookieToken = req.cookies?.access_token;
  const headerToken = (req.headers.authorization || '').startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = cookieToken || headerToken;

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
