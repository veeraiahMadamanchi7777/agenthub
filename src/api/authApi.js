const BASE = '/api/auth';

function token() {
  return localStorage.getItem('auth_token');
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
}

async function handle(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

export async function apiRegister({ email, username, password }) {
  return handle(await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  }));
}

export async function apiLogin({ email, password }) {
  return handle(await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }));
}

export async function apiMe() {
  return handle(await fetch(`${BASE}/me`, { headers: authHeaders() }));
}

export async function apiUpdateProfile({ username, name, bio, avatar_color, avatar_data } = {}) {
  return handle(await fetch(`${BASE}/me`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ username, name, bio, avatar_color, avatar_data }),
  }));
}

export async function apiChangePassword({ currentPassword, newPassword }) {
  return handle(await fetch(`${BASE}/password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  }));
}

export async function apiDeleteAccount() {
  return handle(await fetch(`${BASE}/me`, { method: 'DELETE', headers: authHeaders() }));
}

export function githubLoginUrl() {
  return '/api/auth/github';
}
