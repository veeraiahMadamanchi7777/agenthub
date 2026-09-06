# AgentHub POC Plan — "run all the things"

**Goal:** turn AgentHub from a frontend prototype with one real backend seam into a
proof-of-concept where **every surface in the nav actually runs** — a real catalog,
real container runs, real chat with a real agent, real scheduling, real multi-agent
pipelines — bootable with one command on a laptop.

Status of this document: plan only. Nothing below has been implemented yet.

---

## 1. Where the POC stands today

Verified on `claude/agenthub-poc-planning-txdvcs` (`npm install`, `npm run build`,
and a server boot + `/api/health` smoke test all pass).

### Already real

| Surface | What actually runs |
| --- | --- |
| Frontend | Vite 6 + React 19 + React Router 7, builds clean (474 kB JS) |
| Auth | `server/auth.js` — SQLite (`better-sqlite3`), bcrypt, JWT access (15m) + refresh cookies, email verification, password reset, rate limiting |
| GitHub OAuth | `server/authGithub.js` — real, activates when `GITHUB_CLIENT_ID`/`SECRET` are set |
| Email | `server/email.js` — real SMTP when `SMTP_HOST` is set; otherwise an Ethereal test account with preview URLs on stdout |
| Agent register/edit/delete | `POST /api/agents/register`, `PUT`/`DELETE /api/agents/:slug` — auth-gated, writes JSON + README to disk |
| Image validation | `GET /api/agents/validate-image` — real Docker Hub v2 lookup |
| Container runs | `server/dockerRunner.js` via dockerode — real `create`/`start`/`logs`/`stop`, demuxed stdout+stderr streamed to the browser over WS at `/ws/runs/:sessionId` |

### Still mocked

| Surface | Route | What's fake |
| --- | --- | --- |
| Catalog | `/` | `public/mock/agents.json` fetched through `fetchMock` with artificial 180 ms latency |
| Runs list | `/runs` | `sessions.json` — static rows, completely disconnected from real runs started via `/api/runs` |
| Session chat | `/runs/:id` | `useSessionChat` replays canned strings from `agent-replies.json` on `setTimeout` |
| Studio | `/studio` | `useStudioFeed` replays a scripted A2A transcript from `a2a-demos.json` on a timer |
| Discover | `/discover` | `matchAgentFromAsk` — local keyword scoring, no model call |
| Automate | `/automate` | `useSchedules` — localStorage only; **nothing ever fires** |
| Workstation | `/workstation` | Three hardcoded text blocks; no probe of Docker, ports, or images |
| Reels / boot | shell | `reels.json`, `boot-lines.json`, `presets.json` |

### Structural gaps that will bite

1. **The catalog is a file, not a store.** The server writes `public/mock/agents.json`;
   the browser reads `/mock/agents.json`. That works in `vite dev` (public/ is served
   live) but **breaks in `npm run build` + `preview`** — `dist/` is a build-time copy,
   so registering an agent in a production build appears to succeed and then vanishes.
   Meanwhile SQLite is already there, used only for users.
2. **Run sessions are in-memory.** `const sessions = new Map()` in `server/index.js`.
   Restart the server and every run, its logs, and its status are gone — and the
   containers are orphaned (`AutoRemove: false`).
3. **Only one agent is genuinely runnable.** `financial-advisor` needs a hand-built
   `financial-ai-agent:local` image cloned from a third-party repo. `deepresearch`,
   `codeweaver`, `data-scout` run an `alpine` placeholder that echoes four lines. The
   other 8 of 12 agents have `runnable: false`.
4. **No test, lint, or CI infrastructure at all.** No `.github/`, no test runner, no
   ESLint config.
5. **`JWT_SECRET` falls back to a hardcoded dev string**, and `hostPort` collides
   across concurrent runs (fixed host port per agent).

---

## 2. Definition of done for the POC

A reviewer clones the repo, runs **one command**, and every one of these is true:

- [ ] Catalog loads from a real API backed by SQLite — no `/mock/*.json` reads left in the app
- [ ] `Run` on **any** of at least 5 agents starts a real container and streams real logs
- [ ] `/runs` lists **real** runs (live + historical), survives a server restart, and reconnects to a live log stream
- [ ] Chat in a run session reaches a **real** agent process and gets a real, non-canned answer
- [ ] `/discover` answers with a real model call grounded in the agents' READMEs
- [ ] `/studio` executes a real 2-agent pipeline where agent A's real output becomes agent B's real input
- [ ] A schedule created in `/automate` **actually fires** and produces a run visible in `/runs`
- [ ] `/workstation` reports live truth: Docker reachable? images present? ports free?
- [ ] `npm test` runs and passes; CI runs it on every push
- [ ] Stopping the stack kills every container it started — nothing orphaned

---

## 3. Target architecture

```
                    docker compose up          (one command, Phase 6)
┌──────────────────────────────────────────────────────────────────────┐
│  web  (vite / nginx :5173)                                           │
│    └── /api, /ws  ──proxy──▶                                         │
│                                                                       │
│  api  (express :4500)                                                │
│    ├── auth          (exists)                                         │
│    ├── catalog       agents/categories        ─┐                      │
│    ├── runs          start/stop/logs/history   ├── SQLite (data/)     │
│    ├── chat          agent I/O bridge          │   agenthub.db        │
│    ├── schedules     cron tick loop           ─┘                      │
│    └── pipelines     studio orchestration                             │
│                        │                                              │
│                        ├── dockerode ──▶ /var/run/docker.sock         │
│                        └── LLM provider (Anthropic / OpenAI, keyed)   │
│                                                                       │
│  agent containers  (one per run, on an `agenthub` docker network)     │
│    each speaks a tiny **Agent Protocol**: HTTP POST /invoke + SSE     │
└──────────────────────────────────────────────────────────────────────┘
```

**The one new concept: the Agent Protocol.** Everything downstream (real chat, real
Studio pipelines, real scheduled runs) needs agents to be *callable*, not just
*loggable*. Keep it minimal so any image can adopt it:

```
GET  /health            -> 200 {"ok":true}
POST /invoke            -> {"input": "...", "context": {...}}
                           returns SSE: event: token | event: result | event: error
GET  /schema            -> {"inputs":[...], "outputs":[...]}   (optional)
```

Agents that don't implement it stay **log-only** — they still run and stream stdout,
they just can't be chatted with or chained. That keeps the migration incremental
instead of all-or-nothing.

---

## 4. Phased plan

Phases are ordered so each one leaves the app in a working, demoable state. Estimates
assume one developer.

### Phase 0 — Foundations (½ day)

Nothing in this phase is visible, but every later phase depends on it.

- Add `vitest` + `@testing-library/react` + `supertest`; add `test`, `test:watch` scripts
- Add ESLint (flat config) + `lint` script
- Add `.github/workflows/ci.yml`: install → lint → test → build on push and PR
- Add `.env.example` (`JWT_SECRET`, `CLIENT_ORIGIN`, `SERVER_ORIGIN`, `GITHUB_*`, `SMTP_*`, `ANTHROPIC_API_KEY`, `RUN_SERVER_PORT`) and load it with `node --env-file` or `dotenv`
- **Fail fast on a default `JWT_SECRET` when `NODE_ENV=production`** (`server/auth.js:9`)

**Done when:** CI is green on the branch and `npm test` passes with one placeholder test.

### Phase 1 — Real catalog (1 day)

Kill the JSON-file-as-database problem before anything else builds on it.

- New `server/catalog.js`: `agents` and `categories` tables in the existing SQLite DB
  (id, slug, name, author, author_id, desc, category, caps, models, docker_image,
  container_port, host_port, kind, embed_url, env_vars, inputs, outputs, readme,
  pulls, verified, color, created_at, updated_at)
- `scripts/seed-catalog.mjs` — one-time import of `public/mock/agents.json` +
  `public/readmes/*` into SQLite, idempotent
- New endpoints: `GET /api/agents`, `GET /api/agents/:slug`, `GET /api/categories`,
  `GET /api/agents/:slug/readme`
- Rewrite `register` / `PUT` / `DELETE` in `server/index.js` to hit SQLite instead of
  `readFile`/`writeFile` on `public/mock/agents.json`
- Point `src/api/agentsApi.js` and `src/api/wikiApi.js` at the real endpoints; delete
  `fetchMock` usage for agents/categories
- Move `pulls` increment into a SQL `UPDATE` (drops the fire-and-forget read-write race
  at `server/index.js:~205`)

**Done when:** registering an agent in a **production build** (`npm run build && npm run preview`)
persists across a server restart. Test: supertest round-trip register → list → delete.

### Phase 2 — Real runs, persisted (1–1.5 days)

- `runs` + `run_logs` tables; every run row carries `id, agent_slug, user_id, status,
  image, host_port, container_id, started_at, ended_at, exit_code`
- Replace the in-memory `sessions` Map with a store that writes through to SQLite;
  keep the in-memory map only as a live-socket cache
- **On boot, reconcile:** list containers labelled `agenthub.run=<id>`, re-attach log
  streams for ones still alive, mark the rest `exited`
- Label every container (`agenthub.run`, `agenthub.slug`) and set resource caps
  (`Memory`, `NanoCpus`, `PidsLimit`) — a POC that can OOM a laptop isn't demoable
- **Dynamic host ports:** allocate a free port per run instead of the fixed `hostPort`,
  so two runs of the same agent don't collide (`server/dockerRunner.js:~55`)
- `GET /api/runs` (list, filter by status), `GET /api/runs/:id/logs?since=` for
  reconnect-with-backlog
- Rewire `/runs` (`SessionsPage`) and `useSessions` to the real endpoint; delete
  `sessionsApi.js` and `public/mock/sessions.json`
- Shutdown handler stops **all** labelled containers, not just ones in the current map

**Done when:** start 3 runs, `kill` the server, restart it — `/runs` still shows all 3
with correct status, and the live one still streams.

### Phase 3 — Real agents (2 days) ← *the phase that makes the demo*

This is where "run all the things" is won or lost. Build **three** first-party agent
images in a new `agents/` directory, each ~80 lines of Python (FastAPI) implementing
the Agent Protocol:

| Agent | Image | What it really does |
| --- | --- | --- |
| `deepresearch` | `agenthub/deepresearch` | Real web fetch + LLM synthesis, streams tokens, returns a cited summary |
| `data-scout` | `agenthub/data-scout` | Accepts an uploaded CSV, runs real pandas profiling, returns stats + a chart |
| `codeweaver` | `agenthub/codeweaver` | Takes a repo URL + task, clones it, returns a real proposed diff (no push) |

Plus:
- `agents/_sdk/` — the shared 40-line protocol server, so a 4th agent is a copy-paste
- `agents/build-all.sh` and a compose profile that builds them
- Update `server/runConfigs.js` to point at these images; **delete `demoConfig`**
- Keep `financial-advisor` as the "bring your own image" example, and keep log-only
  mode as the fallback for any image without `/health`
- Health-gate the run: poll `/health` after start, only flip status to `running` when
  the agent answers (today status flips the instant the container starts)

**Done when:** 4+ agents in the catalog start, pass health, and answer a real `/invoke`.

**Decision needed:** which LLM provider keys the POC. Default to Anthropic
(`ANTHROPIC_API_KEY`) with a documented `LLM_PROVIDER` switch, and a deterministic
`mock` provider so CI and offline demos still pass.

### Phase 4 — Real chat + real Discover (1 day)

- `POST /api/runs/:id/chat` → proxies to the container's `/invoke`, relays SSE tokens
  out over the existing run WebSocket as `{type:'token'}` / `{type:'message'}`
- Rewrite `useSessionChat` to call it; **delete `agent-replies.json`** and the
  `setTimeout` fake-thinking
- Persist chat turns in a `messages` table so a reopened session shows its history
- `/discover`: `POST /api/discover` — embed or keyword-prefilter the catalog, then one
  real LLM call over the candidate agents' READMEs, returning a ranked pick **with a
  reason**. Keep `matchAgentFromAsk` as the offline fallback rather than deleting it.

**Done when:** a question typed into a `deepresearch` session comes back with an answer
that provably isn't in the repo (cites a live URL).

### Phase 5 — Real Automate + real Studio (1.5 days)

**Automate** — the biggest credibility gap today (the UI implies scheduling; nothing runs).

- `schedules` table + `GET/POST/DELETE /api/schedules`
- A tick loop in the API (`setInterval`, 30 s) that claims due schedules with a
  transactional `UPDATE … WHERE next_run_at <= now`, starts the run, and computes
  `next_run_at`. No new dependency needed for `once | hourly | daily | weekly`.
- Rewrite `useSchedules` off localStorage onto the API; link each fired schedule to its
  run row so `/automate` can show "last run → /runs/:id"

**Studio** — real A2A.

- `pipelines` table: an ordered list of steps `{agentSlug, inputFrom}`
- `POST /api/pipelines/:id/run` — start step 1's container, `/invoke` it, feed its
  `result` into step 2's `/invoke`, stream every hop to the browser over WS
- Rewrite `useStudioFeed` to consume that stream; **delete `a2a-demos.json`**
- Ship 2 real presets: `deepresearch → codeweaver` and `data-scout → deepresearch`

**Done when:** a schedule set for 2 minutes out fires on its own and its run appears in
`/runs`; and a Studio preset produces output where step 2 visibly consumed step 1's text.

### Phase 6 — One command, and the demo script (1 day)

- `docker-compose.yml`: `web`, `api` (socket mounted), a shared `agenthub` network,
  named volume for `data/`
- `npm run poc` → `docker compose up --build` after `agents/build-all.sh`
- `/workstation` becomes live: `GET /api/system/status` reports Docker daemon
  reachability + version, which agent images are present, port availability,
  which env keys are configured (**names only, never values**), DB path and size.
  Replace the three hardcoded steps with real checks and per-check remediation.
- `DEMO.md`: a 5-minute click-through covering register → run → chat → schedule →
  studio → runs history
- README rewrite: the "mostly a frontend prototype" framing is no longer true

**Done when:** a clean clone reaches a full demo with `npm run poc` and nothing else.

---

## 5. Effort summary

| Phase | Focus | Est. |
| --- | --- | --- |
| 0 | Tests, lint, CI, env | 0.5 d |
| 1 | Catalog → SQLite | 1 d |
| 2 | Runs persisted + reconciled | 1.5 d |
| 3 | Three real agent images | 2 d |
| 4 | Real chat + real Discover | 1 d |
| 5 | Real scheduler + real Studio | 1.5 d |
| 6 | Compose, live Workstation, docs | 1 d |
| | **Total** | **~8.5 days** |

**Shortest credible demo path** if time is tight: Phases 1 → 2 → 3 (~4.5 days). That
alone gets a real catalog, real persisted runs, and real agents — Studio and Automate
can stay honestly labelled as mocked in the meantime.

---

## 6. Risks and how the plan handles them

| Risk | Mitigation |
| --- | --- |
| **API keys** — real agents need real LLM keys; a demo shouldn't leak them | Keys live in the API's env, never in the browser; a `mock` provider keeps CI and offline demos working |
| **Docker-in-Docker** — the API container needs the host socket | Mount `/var/run/docker.sock`; documented as POC-only, called out explicitly as not a production pattern |
| **Arbitrary user images** — register lets anyone run any image | Non-root, no `--privileged`, memory/CPU/PID caps, dedicated network, no host bind mounts. POC-scope, documented as such |
| **Orphaned containers** | Labels + boot reconciliation + shutdown sweep (Phase 2) |
| **Port collisions** | Dynamic host-port allocation (Phase 2) |
| **Scope creep into a product** | Agent Protocol stays 3 endpoints; anything not on the Definition-of-Done list is out |

---

## 7. Open questions

1. **LLM provider** — Anthropic by default, or provider-agnostic from day one?
2. **Does the POC need auth to be mandatory**, or should browse/run stay anonymous with
   auth only for register/schedule? (Today `/api/runs` is unauthenticated.)
3. **Should Studio pipelines be user-editable** in the POC, or are two fixed presets enough?
4. **Deploy target** — laptop-only, or does this need to survive on a cloud host?
   That changes the Docker-socket decision materially.
5. **Keep the 8 non-runnable catalog agents** as browse-only filler, or trim the catalog
   to what actually runs?
