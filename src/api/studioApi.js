/** Studio pipeline mock API. */
import { fetchMock } from './mockClient.js';

export async function getPresets() {
  return fetchMock('presets.json');
}

export async function getA2ADemo(presetId) {
  const demos = await fetchMock('a2a-demos.json', 100);
  return demos[presetId] ?? [];
}

export async function getBootLines() {
  return fetchMock('boot-lines.json', 60);
}

export async function getAgentReplies() {
  return fetchMock('agent-replies.json', 60);
}
