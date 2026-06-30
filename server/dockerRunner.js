/** Thin wrapper around dockerode: ensure image, run container, stream logs, stop/remove. */
import Docker from 'dockerode';

const docker = new Docker(); // honors DOCKER_HOST env var; defaults to /var/run/docker.sock

/** Friendlier error for the common "Docker Desktop isn't running" case. */
function isDockerUnreachable(err) {
  return err?.code === 'ENOENT' || err?.code === 'ECONNREFUSED' || err?.errno === -61;
}

export function explainDockerError(err, config) {
  if (isDockerUnreachable(err)) {
    return 'Cannot reach Docker. Make sure Docker Desktop (or your Docker daemon) is running, then try again.';
  }
  if (err?.statusCode === 404) {
    return `Image "${config?.image}" not found locally and could not be pulled. ${config?.note ?? ''}`.trim();
  }
  return err?.message || String(err);
}

async function ensureImage(image) {
  try {
    await docker.getImage(image).inspect();
    return;
  } catch (err) {
    if (isDockerUnreachable(err)) throw err;
    // Not present locally — try to pull (works for public images like alpine;
    // local-only tags like financial-ai-agent:local will fail here with a 404,
    // which the caller surfaces as "build it first" guidance).
    await new Promise((resolve, reject) => {
      docker.pull(image, (pullErr, stream) => {
        if (pullErr) return reject(pullErr);
        docker.modem.followProgress(stream, (followErr) => (followErr ? reject(followErr) : resolve()));
      });
    });
  }
}

/**
 * Starts a container for the given run config.
 * @param {object} config - entry from runConfigs.js
 * @param {(line: string) => void} onLog - called with each chunk of stdout/stderr
 * @param {(status: 'running'|'exited'|'errored', code?: number) => void} onStatus
 * @returns {Promise<import('dockerode').Container>}
 */
export async function runContainer(config, onLog, onStatus) {
  await ensureImage(config.image);

  const exposedPorts = {};
  const portBindings = {};
  if (config.containerPort) {
    const key = `${config.containerPort}/tcp`;
    exposedPorts[key] = {};
    portBindings[key] = [{ HostPort: String(config.hostPort ?? config.containerPort) }];
  }

  const container = await docker.createContainer({
    Image: config.image,
    Cmd: config.cmd,
    Env: config.env ?? [],
    Tty: false,
    ExposedPorts: exposedPorts,
    HostConfig: { PortBindings: portBindings, AutoRemove: false },
  });

  await container.start();
  onStatus('running');

  const logStream = await container.logs({ follow: true, stdout: true, stderr: true });
  const sink = (chunk) => onLog(chunk.toString('utf8'));
  container.modem.demuxStream(logStream, { write: sink }, { write: sink });

  container
    .wait()
    .then((res) => onStatus(res.StatusCode === 0 ? 'exited' : 'errored', res.StatusCode))
    .catch(() => {}); // container removed/stopped manually — stopContainer already reports status

  return container;
}

export async function stopContainer(container) {
  try {
    await container.stop({ t: 3 });
  } catch {
    /* already stopped */
  }
  try {
    await container.remove();
  } catch {
    /* already removed */
  }
}
