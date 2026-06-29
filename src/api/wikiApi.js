/** Agent wiki — loads README markdown from public/readmes. */
import { getReadmePath } from '../utils/readme.js';

export async function fetchReadme(agentOrSlug) {
  const path = getReadmePath(agentOrSlug);
  const res = await fetch(path);
  if (!res.ok) return null;
  return res.text();
}
