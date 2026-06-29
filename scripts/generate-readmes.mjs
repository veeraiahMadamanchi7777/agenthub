/** One-time generator: wiki.json → public/readmes/{slug}/README.md */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wiki = JSON.parse(readFileSync(join(root, 'public/mock/wiki.json'), 'utf8'));
const agents = JSON.parse(readFileSync(join(root, 'public/mock/agents.json'), 'utf8'));

function toMarkdown(slug, entry, agent) {
  const title = agent?.name || slug;
  const lines = [`# ${title}`, ''];
  if (entry.whatItDoes) lines.push(entry.whatItDoes, '');
  if (entry.howItWorks?.length) {
    lines.push('## How it works', '');
    entry.howItWorks.forEach((s) => lines.push(`- ${s}`));
    lines.push('');
  }
  if (entry.inputFormat || entry.outputFormat) {
    lines.push('## Parameters', '', '| Field | Description |', '|---|---|');
    if (entry.inputFormat) lines.push(`| **Input** | ${entry.inputFormat} |`);
    if (entry.outputFormat) lines.push(`| **Output** | ${entry.outputFormat} |`);
    lines.push('');
  }
  if (entry.examples?.length) {
    lines.push('## Example prompts', '');
    entry.examples.forEach((e) => lines.push(`- ${e}`));
    lines.push('');
  }
  if (entry.limitations?.length) {
    lines.push('## Limitations', '');
    entry.limitations.forEach((l) => lines.push(`- ${l}`));
    lines.push('');
  }
  return lines.join('\n');
}

for (const agent of agents) {
  const entry = wiki[agent.slug];
  if (!entry) continue;
  const dir = join(root, 'public/readmes', agent.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'README.md'), toMarkdown(agent.slug, entry, agent));
}

console.log('Generated README files for', agents.filter((a) => wiki[a.slug]).length, 'agents');
