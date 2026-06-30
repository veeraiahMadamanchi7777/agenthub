/**
 * Per-agent container run configuration.
 *
 * Each entry tells the backend what to `docker run` when someone clicks
 * "Run" on that agent. financial-advisor already has a real image (built
 * from the personal-financial-ai-agent repo per the README). The other
 * three "runnable" agents (deepresearch, codeweaver, data-scout) have no
 * real backend yet, so they spin a small placeholder container that
 * proves a real pod is created and its real stdout is streamed.
 *
 * To grow this: swap `image`/`cmd` for a real one once that agent has an
 * actual backend — no frontend changes are required.
 */

function demoConfig(slug, lines) {
  const escaped = lines.map((l) => l.replace(/'/g, "'\\''"));
  const script = escaped.map((l) => `echo '${l}'; sleep 1;`).join(' ');
  return {
    image: 'alpine:3.19',
    cmd: ['sh', '-c', `${script} echo 'Done. (demo placeholder container for ${slug} — swap the image/cmd in server/runConfigs.js to wire in a real agent backend)'`],
    embed: false,
    env: [],
    note: 'Demo placeholder container (alpine) — proves a real pod spins up and streams real logs. Swap in a real image to make this agent fully functional.',
  };
}

export const RUN_CONFIGS = {
  'financial-advisor': {
    image: 'financial-ai-agent:local',
    cmd: undefined,
    containerPort: 8501,
    hostPort: 8501,
    embed: true,
    env: [],
    note: 'Real Streamlit agent. Build it first: clone personal-financial-ai-agent, then `docker build -t financial-ai-agent:local .` (see Workstation page).',
  },
  deepresearch: demoConfig('deepresearch', [
    'Booting research sandbox...',
    'Loading web-search toolchain...',
    'Sub-query planner ready.',
    'Agent container is live — wire a real backend to make this agent functional.',
  ]),
  codeweaver: demoConfig('codeweaver', [
    'Booting coding sandbox...',
    'Cloning repo context...',
    'Indexing files for multi-file edits...',
    'Agent container is live — wire a real backend to make this agent functional.',
  ]),
  'data-scout': demoConfig('data-scout', [
    'Booting data sandbox...',
    'Loading pandas / stats toolchain...',
    'Waiting for a dataset...',
    'Agent container is live — wire a real backend to make this agent functional.',
  ]),
};

export function getRunConfig(slug) {
  return RUN_CONFIGS[slug] ?? null;
}
