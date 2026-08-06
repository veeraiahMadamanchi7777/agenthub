import { Router } from 'express';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { db } from './db.js';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth.js';

export const router = Router();

const GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CLIENT_ORIGIN        = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const IS_PROD              = process.env.NODE_ENV === 'production';

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
}

function createRefreshToken(userId, req) {
  const raw  = genToken();
  const hash = sha256(raw);
  const exp  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const device = (req.headers['user-agent'] || '').slice(0, 200);
  const ip   = req.ip || '';
  db.prepare(
    'INSERT INTO refresh_tokens (user_id, token_hash, device, ip, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, hash, device, ip, exp);
  return raw;
}

if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_ORIGIN || 'http://localhost:4500'}/api/auth/github/callback`,
    },
    (_accessToken, _refreshToken, profile, done) => {
      const githubId       = String(profile.id);
      const githubUsername = profile.username || `gh-${githubId}`;
      const email          = profile.emails?.[0]?.value?.toLowerCase() || null;

      let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(githubId);
      if (!user && email) user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (user) {
        db.prepare('UPDATE users SET github_id = ?, github_username = ? WHERE id = ?')
          .run(githubId, githubUsername, user.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      } else {
        let username = githubUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) username = `${username}-${githubId.slice(-4)}`;

        const result = db.prepare(
          'INSERT INTO users (email, username, github_id, github_username, email_verified) VALUES (?, ?, ?, ?, ?)'
        ).run(email, username, githubId, githubUsername, email ? 1 : 0);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }

      done(null, user);
    }
  ));

  router.get('/', passport.authenticate('github', { session: false, scope: ['user:email'] }));

  router.get('/callback',
    passport.authenticate('github', { session: false, failureRedirect: `${CLIENT_ORIGIN}?auth=error` }),
    (req, res) => {
      const user = req.user;

      const accessToken  = signAccessToken(user);
      const refreshToken = createRefreshToken(user.id, req);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: IS_PROD ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: IS_PROD ? 'strict' : 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(`${CLIENT_ORIGIN}?auth=github`);
    }
  );
} else {
  router.get('/',         (_req, res) => res.status(501).json({ error: 'GitHub OAuth not configured — set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET' }));
  router.get('/callback', (_req, res) => res.status(501).json({ error: 'GitHub OAuth not configured' }));
}
