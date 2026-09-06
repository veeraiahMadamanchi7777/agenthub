# AgentHub — Production Architecture

Companion to `docs/POC-PLAN.md`. That document gets every surface *running*.
This one describes what the system has to become before strangers can register
images on it and other people's workloads run next to theirs.

---

## 1. The constraint everything else follows from

AgentHub is not "a React app with a backend." It is a marketplace that
**executes third-party container images on shared infrastructure**. Once anyone
can register an image and anyone else can click Run, the platform is running
untrusted code on behalf of untrusted users, funded by the platform's own API
keys.

Read the POC design against that sentence and the gap is not a matter of
polish:

| POC does | At production scale that is |
| --- | --- |
| Mounts `/var/run/docker.sock` into the API process | Root on the host, handed to whoever can reach the API |
| Runs any image the user names, by tag | Arbitrary code, from a mutable reference that can be swapped after review |
| Keeps runs in an in-process `Map` | A single point of failure that can't scale past one replica |
| Passes user API keys as plaintext JSON in a POST body | Credentials in request logs, in memory, in the container |
| Binds a fixed host port per agent | A global namespace two tenants can collide in |
| Fires schedules from `setInterval` | Duplicate firing on every replica; silent loss on restart |

None of these are bugs. They are correct choices for a laptop demo and wrong
ones for a multi-tenant platform. The architecture below is what replaces them.

**Design principle:** the container is the security boundary, and it is assumed
hostile. Nothing the platform values — keys, other tenants' data, the host
kernel, the network — is reachable from inside it.

---

## 2. Topology

Five planes, each with a different trust level and a different scaling
characteristic.

### Edge

- **CDN + WAF** in front of the static SPA. The frontend is a build artifact;
  it holds no secrets and needs no compute.
- **API gateway** terminating TLS, doing coarse rate limiting and JWT
  pre-validation.
- **A separate origin for agent traffic** — `*.run.agenthub.io`, never a path
  on the app's domain. Embedded agents (the Streamlit case) serve untrusted
  HTML and JavaScript; same-origin would hand them the user's session. This is
  the single highest-value change from the POC's `localhost:8501` iframe.

### Control plane — stateless, horizontally scaled

| Service | Responsibility | Notably does *not* |
| --- | --- | --- |
| `api` | REST + WebSocket termination, auth, catalog, runs and schedules API | Touch the container runtime at all |
| `orchestrator` | The only component holding cluster credentials. Turns "start run" into a pod spec; watches lifecycle | Accept public traffic |
| `workflows` | Durable execution for scheduled runs and Studio pipelines | Keep state in memory |
| `registry-gate` | Admission on registration: pull, scan, sign, pin | Run anything |

Splitting `api` from `orchestrator` is what lets the API scale to any number of
replicas. In the POC they are the same process, which is exactly why runs die
with it.

### Data plane — one pod per run, untrusted

Each run is a Kubernetes Job in a **per-tenant namespace**, with:

- **gVisor (`runsc`) as the runtime class.** Syscalls are intercepted in
  userspace; the container never speaks directly to the host kernel. This is
  the control that makes running strangers' images defensible. Firecracker
  microVMs are the alternative if you want hardware-level isolation and can
  absorb the cold-start cost.
- Read-only root filesystem, all Linux capabilities dropped, non-root UID,
  seccomp profile, no service-account token projected.
- Hard limits on CPU, memory, ephemeral storage, and PIDs — plus a **run TTL**
  that kills the pod unconditionally.
- A `NetworkPolicy` that **denies egress by default**. The only reachable
  destination is the egress proxy.
- A **sidecar** that owns everything the agent isn't trusted to do: it speaks
  the agent protocol over localhost, injects decrypted secrets into the agent
  process, publishes log lines and events to the broker, and redacts secrets
  from that stream on the way out.

### Egress proxy — the component that earns its keep

Every packet an agent sends leaves through it. That single chokepoint solves
four problems that are otherwise solved four times, badly:

1. **The platform's LLM key is injected at egress.** The container never holds
   it and cannot exfiltrate it. A hostile agent can spend budget; it cannot
   steal the credential.
2. **Per-agent domain allowlists**, declared at registration and reviewed. A
   research agent reaches search APIs; it does not reach your metadata service.
3. **Authoritative token metering.** The proxy parses `usage` off each response
   — input, output, cache reads. Billing telemetry that agent code cannot
   under-report, because it never sees the meter.
4. **Budget enforcement in the request path.** When a run or tenant crosses its
   cap, the proxy returns 429 and the run ends. Budgets that are checked after
   the fact are not budgets.

### State

| Store | Holds | Why |
| --- | --- | --- |
| **Postgres** | Users, catalog, runs, messages, schedules, pipelines, budgets, audit | Relational, transactional, read replicas for the catalog's read-heavy traffic |
| **Redis** | Sessions, rate limits, live run status, pub/sub fan-out | Sub-millisecond, disposable |
| **Broker** (NATS JetStream or Redis Streams) | Live log and event fan-out | Lets *any* API replica stream *any* run's logs |
| **Object store** (S3) | Terminal logs, run artifacts, READMEs, uploaded datasets | Logs are append-heavy and read-rarely; they don't belong in a database |

The broker is what replaces the POC's in-process socket set. Today the
WebSocket must land on the process that started the container. With a broker,
the sidecar publishes to a per-run subject and any replica subscribes — which
is the precondition for both horizontal scaling and reconnect-after-restart.

### Registry

Users never pull from Docker Hub at run time. On registration the image is
pulled once, **scanned** (Trivy), **signed** (cosign), and stored in a private
registry, and the catalog records the **digest**.

Runs pin digests, never tags. A tag is a mutable pointer: an image that passes
review on Monday can be replaced with something else on Tuesday under the same
name. Digest pinning closes that, and it is a one-column decision that is
nearly impossible to retrofit once runs reference tags.

---

## 3. What a run actually does

```
 user clicks Run
   │
   ├─▶ api            authz, quota check, INSERT runs row (status=queued)
   │                  returns run id immediately
   │
   ├─▶ orchestrator   resolves agent → pinned digest, builds pod spec,
   │                  creates Job in tenant namespace
   │
   ├─▶ run pod        gVisor sandbox, egress denied except proxy
   │     ├── sidecar  decrypts secrets, injects env, waits for /health
   │     └── agent    the third-party image, protocol on localhost
   │
   ├─▶ sidecar        publishes log lines + status to broker (per-run subject)
   │
   ├─▶ api replica    subscribes, relays to the browser over WebSocket
   │                  (any replica — it need not be the one that started it)
   │
   └─▶ on exit        sidecar flushes logs to S3, orchestrator updates the row
                      with status, exit code, and metered token spend
```

The important property: **no component holds the run in memory as the source of
truth.** Postgres holds the record, S3 holds the logs, the broker holds the live
tail. Any process can die and be replaced.

---

## 4. Cross-cutting concerns

**Secrets.** User-supplied keys are envelope-encrypted — a per-tenant data key
wrapped by a KMS master key. Ciphertext in Postgres, decryption only in the
sidecar at pod start, plaintext never in a request log, never in the run's log
stream (the sidecar redacts on the way out), never in the database.

**Observability.** One OpenTelemetry trace spanning `api → orchestrator → pod →
egress proxy → model provider`. Token spend is a first-class metric dimensioned
by agent, tenant, and run — because at this system's cost structure (§6) it is
the primary business metric, not an infrastructure one.

**Multi-tenancy.** Namespace per tenant, with `ResourceQuota` capping concurrent
runs and total compute, `LimitRange` for defaults, and `NetworkPolicy` for
isolation. A tenant that goes berserk exhausts its own quota and no one else's.

**Abuse.** Concurrency caps and run TTLs bound the blast radius. Egress
allowlists bound exfiltration. CPU-profile heuristics catch the cryptominer
that inevitably registers as "data-processing-agent" in month three.

**Availability.** The API and orchestrator are stateless and multi-AZ. Postgres
runs with a synchronous replica and PITR. Run pods are deliberately *not* highly
available — a run that dies is retried or reported failed, and building
mid-flight run migration is not worth the complexity.

---

## 5. Sizing, at the scale the token model assumes

Deriving from 100K MAU (~1.2M runs/month):

| Quantity | Value | Derivation |
| --- | --- | --- |
| Runs/day | ~40,000 | 1.2M / 30 |
| Mean runs/minute | ~28 | flat average |
| Peak runs/minute | ~140 | 5× diurnal peaking |
| Mean run duration | ~3.5 min | weighted across the agent mix |
| **Concurrent run pods at peak** | **~500** | 140 × 3.5 |
| Peak pod compute | ~350 vCPU / ~700 GiB | at 0.5 vCPU / 1 GiB per pod |
| Worker nodes at peak | ~50 | 8 vCPU / 32 GiB nodes, autoscaled |

Runs are bursty and interruptible, which makes them an excellent fit for spot
capacity with on-demand fallback.

---

## 6. The cost structure decides the roadmap

| Line | Monthly at 100K MAU |
| --- | --- |
| Model tokens (cached + routed + batched) | **~$820,000** |
| Compute, storage, network, managed services | ~$40,000–70,000 |
| **Token share of COGS** | **~92%** |

This is the most important number in the document, and it is counterintuitive
for a system whose defining feature is container orchestration. **A 10%
improvement in cache hit rate is worth more than eliminating the entire
infrastructure bill.**

Practical consequences:

- Engineering effort belongs in prompt-prefix stability, per-agent model
  routing, effort tuning, and batch scheduling — not in shaving container
  overhead.
- The egress proxy's metering is a **revenue-grade** system, not telemetry. It
  needs the correctness and durability of billing infrastructure.
- Per-tenant budgets must be enforced synchronously, in the request path.
- Free tiers are structurally impossible at ~$8–9 of token cost per MAU/month
  without hard per-user run caps.

---

## 7. Migration from the POC

The POC plan's phases are not wasted — most of them are the same work, done
against a different substrate. The delta is isolation, tenancy, and metering.

| POC phase | Carries over | Must change for production |
| --- | --- | --- |
| 1 — catalog in SQLite | Schema, endpoints, seed | Postgres; add `digest`, `model`, `effort`, `egress_allowlist` columns |
| 2 — persisted runs | Runs schema, reconciliation, labels | Broker-based streaming; S3 for terminal logs; orchestrator split out of `api` |
| 3 — real agents | The agent protocol, unchanged | Add prefix-stable caching to the contract; sidecar-injected secrets |
| 4 — chat and Discover | Proxy shape, message persistence | Route through the egress proxy for metering |
| 5 — scheduler and Studio | Data model, pipeline semantics | Durable workflow engine instead of `setInterval` |
| 6 — compose, Workstation | Demo value only | Replaced by Kubernetes; keep compose for local dev |

**Four decisions worth making during the POC, because they are cheap now and
expensive later.** All four are columns or contracts, not systems:

1. Pin **digests** in the catalog from Phase 1, not tags.
2. Put `input_tokens`, `output_tokens`, `cache_read_tokens`, `cost_usd` on the
   runs table in Phase 2.
3. Make the agent protocol **prefix-stable for caching** in Phase 3 — ordering
   and cache breakpoints are part of the contract, not an optimization.
4. Declare a **per-agent egress allowlist** at registration in Phase 1, even if
   nothing enforces it until production.

---

## 8. Deliberate non-goals

Being explicit about what this architecture declines to do:

- **Kubernetes below roughly 1,000 runs/day.** Fly Machines or ECS Fargate give
  most of the isolation with a fraction of the operational burden. Adopt K8s
  when per-run pod density and network policy actually pay for the cluster.
- **A bespoke scheduler.** Temporal (or equivalent) exists; agent runs are
  precisely the long-running, retry-heavy, timeout-prone workload it was built
  for.
- **Multi-cloud.** The egress proxy and gVisor are portable; the operational
  cost of provider neutrality is not repaid at this stage.
- **Highly-available individual runs.** Retry, don't migrate.
- **Running untrusted images without a sandboxed runtime.** If gVisor or
  microVMs are unavailable in the target environment, the answer is not a
  hardened plain container — it is not offering third-party registration.
