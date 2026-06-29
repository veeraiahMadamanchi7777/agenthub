/** README path helpers and summary extraction. */

export function getReadmePath(agentOrSlug) {
  const slug = typeof agentOrSlug === 'string' ? agentOrSlug : agentOrSlug.slug;
  const custom = typeof agentOrSlug === 'object' && agentOrSlug.readme;
  return custom || `/readmes/${slug}/README.md`;
}

/** First paragraph after the title — used for wiki index previews. */
export function extractReadmeSummary(markdown) {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  const body = [];
  let passedTitle = false;
  for (const line of lines) {
    if (/^#\s/.test(line)) { passedTitle = true; continue; }
    if (!passedTitle) continue;
    if (/^#{1,6}\s/.test(line)) break;
    const t = line.trim();
    if (!t) { if (body.length) break; continue; }
    body.push(t);
  }
  return body.join(' ').trim();
}
