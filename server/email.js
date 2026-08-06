import nodemailer from 'nodemailer';

const APP_NAME = 'AgentHub';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;
  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // Dev: auto Ethereal test account — preview URLs logged to console
    const test = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: test.user, pass: test.pass },
    });
    console.log(`[email] Using Ethereal test account: ${test.user}`);
  }
  return _transporter;
}

async function send({ to, subject, html }) {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: `"${APP_NAME}" <no-reply@agenthub.dev>`,
    to, subject, html,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`[email] Preview: ${preview}`);
}

export async function sendVerificationEmail(user, token) {
  const link = `${CLIENT_ORIGIN}/verify-email?token=${token}`;
  await send({
    to: user.email,
    subject: `Verify your ${APP_NAME} email`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Welcome to ${APP_NAME}${user.name ? ', ' + user.name : ''}!</h2>
        <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Verify email</a>
        <p style="color:#888;font-size:12px;margin-top:24px">Or copy this link: ${link}</p>
      </div>`,
  });
}

export async function sendPasswordResetEmail(user, token) {
  const link = `${CLIENT_ORIGIN}/reset-password?token=${token}`;
  await send({
    to: user.email,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Reset your password</h2>
        <p>Someone requested a password reset for your account. Click below to set a new password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a>
        <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#888;font-size:12px">Or copy this link: ${link}</p>
      </div>`,
  });
}
