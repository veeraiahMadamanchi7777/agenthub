import { rateLimit } from 'express-rate-limit';

const json429 = (_req, res) =>
  res.status(429).json({ error: 'Too many requests — please wait and try again.' });

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  handler: json429,
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  handler: json429,
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  handler: json429,
  standardHeaders: true,
  legacyHeaders: false,
});
