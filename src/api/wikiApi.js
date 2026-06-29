/** Agent wiki mock API. */
import { fetchMock } from './mockClient.js';

export async function getWikiIndex() {
  return fetchMock('wiki.json');
}

export async function getWikiEntry(slug) {
  const wiki = await getWikiIndex();
  return wiki[slug] ?? null;
}
