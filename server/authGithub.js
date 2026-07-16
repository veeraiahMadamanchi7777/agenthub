import { Router } from 'express';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { db } from './db.js';
import { JWT_SECRET } from './auth.js';
import jwt from 'jsonwebtoken';

export const router = Router();

const GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CLIENT_ORIGIN        = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

function safeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
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
        // Create new account — derive a unique username from GitHub handle
        let username = githubUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) username = `${username}-${githubId.slice(-4)}`;

        const result = db.prepare(
          'INSERT INTO users (email, username, github_id, github_username) VALUES (?, ?, ?, ?)'
        ).run(email, username, githubId, githubUsername);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }

      done(null, user);
    }
  ));

  router.get('/', passport.authenticate('github', { session: false, scope: ['user:email'] }));

  router.get('/callback',
    passport.authenticate('github', { session: false, failureRedirect: `${CLIENT_ORIGIN}?auth=error` }),
    (req, res) => {
      const token = signToken(req.user);
      const user  = encodeURIComponent(JSON.stringify(safeUser(req.user)));
      res.redirect(`${CLIENT_ORIGIN}?auth=github&token=${token}&user=${user}`);
    }
  );
} else {
  router.get('/',          (_req, res) => res.status(501).json({ error: 'GitHub OAuth not configured — set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET' }));
  router.get('/callback',  (_req, res) => res.status(501).json({ error: 'GitHub OAuth not configured' }));
}
