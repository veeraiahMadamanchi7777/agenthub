/** Mock HTTP client — fetches static JSON from /public/mock with simulated latency. */
import { delay } from '../utils/delay.js';

export async function fetchMock(file, ms = 180) {
  await delay(ms);
  const res = await fetch(`/mock/${file}`);
  if (!res.ok) throw new Error(`Mock API error: ${file}`);
  return res.json();
}
