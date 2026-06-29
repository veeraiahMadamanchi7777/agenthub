/** Agent registry mock API. */
import { fetchMock } from './mockClient.js';

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
