/** Agent registry mock API. */
import { fetchMock } from './mockClient.js';

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export async function getAgents() {
  return fetchMock('agents.json');
}

export async function getCategories() {
  return fetchMock('categories.json', 80);
}

export async function searchAgents(q) {
  const agents = await getAgents();
  const s = q.toLowerCase();
  return agents.filter((a) => [a.name, a.desc, a.author].join(' ').toLowerCase().includes(s)).slice(0, 6);
}

export async function updateAgent(slug, data) {
  const res = await fetch(`/api/agents/${slug}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Update failed');
  return json.agent;
}

export async function deleteAgent(slug) {
  const res = await fetch(`/api/agents/${slug}`, { method: 'DELETE', headers: authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Delete failed');
  return json;
}

export async function registerAgent(data) {
  const res = await fetch('/api/agents/register', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Registration failed');
  return json.agent;
}

export function invalidateAgents() {
  window.dispatchEvent(new CustomEvent('agents:invalidate'));
}
