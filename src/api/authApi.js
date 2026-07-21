const BASE = '/api/auth';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function handle(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

export async function apiRegister({ email, username, name, password }) {
  return handle(await fetch(`${BASE}/register`, {
    method: 'POST',
    credentials: 'include',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, username, name, password }),
  }));
}

export async function apiLogin({ email, password, rememberMe = false }) {
  return handle(await fetch(`${BASE}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password, rememberMe }),
  }));
}

export async function apiRefresh() {
  return handle(await fetch(`${BASE}/refresh`, {
    method: 'POST',
    credentials: 'include',
  }));
}

export async function apiMe() {
  return handle(await fetch(`${BASE}/me`, { credentials: 'include' }));
}

export async function apiLogout() {
  return handle(await fetch(`${BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  }));
}

export async function apiLogoutAll() {
  return handle(await fetch(`${BASE}/logout-all`, {
    method: 'POST',
    credentials: 'include',
  }));
}

export async function apiUpdateProfile({ username, name, bio, avatar_color, avatar_data } = {}) {
  return handle(await fetch(`${BASE}/me`, {
    method: 'PUT',
    credentials: 'include',
    headers: JSON_HEADERS,
    body: JSON.stringify({ username, name, bio, avatar_color, avatar_data }),
  }));
}

export async function apiChangePassword({ currentPassword, newPassword }) {
  return handle(await fetch(`${BASE}/password`, {
    method: 'PUT',
    credentials: 'include',
    headers: JSON_HEADERS,
    body: JSON.stringify({ currentPassword, newPassword }),
  }));
}

export async function apiDeleteAccount() {
  return handle(await fetch(`${BASE}/me`, { method: 'DELETE', credentials: 'include' }));
}

export async function apiForgotPassword(email) {
  return handle(await fetch(`${BASE}/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  }));
}

export async function apiResetPassword({ token, newPassword }) {
  return handle(await fetch(`${BASE}/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: JSON_HEADERS,
    body: JSON.stringify({ token, newPassword }),
  }));
}

export async function apiVerifyEmail(token) {
  return handle(await fetch(`${BASE}/verify-email?token=${encodeURIComponent(token)}`, {
    credentials: 'include',
  }));
}

export async function apiResendVerification() {
  return handle(await fetch(`${BASE}/resend-verification`, {
    method: 'POST',
    credentials: 'include',
  }));
}

export async function apiGetSessions() {
  return handle(await fetch(`${BASE}/sessions`, { credentials: 'include' }));
}

export async function apiRevokeSession(id) {
  return handle(await fetch(`${BASE}/sessions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }));
}

export function githubLoginUrl() {
  return '/api/auth/github';
}
