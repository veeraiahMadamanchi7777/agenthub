/** Session mock API. */
import { fetchMock } from './mockClient.js';

export async function getSessions() {
  return fetchMock('sessions.json');
}

export async function getSession(id) {
  const sessions = await getSessions();
  return sessions.find((s) => s.id === id) ?? null;
}
