# AgentHub

A React prototype for browsing, launching, and managing AI agents — inspired by [Ollama](https://ollama.com). Agent catalog, wiki, and chat are mocked from local JSON — but clicking **Run** spins up a real Docker container via a small local backend.

## Clone and run

```bash
git clone https://github.com/veeraiahMadamanchi7777/agenthub.git
cd agenthub
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Run a real container when you click "Run"

Clicking **Run** on an agent starts an actual container, not a mock — its real stdout/stderr streams into the session page. This needs two things running side by side:

```bash
# Terminal 1
npm run dev      # frontend, :5173

# Terminal 2
npm run server   # run backend, :4500 — requires Docker Desktop running
```

What each runnable agent launches (see `server/runConfigs.js`):

- **financial-advisor** — the real Streamlit agent image. Build it first (see "Embedded agent" below); the session page shows its logs plus the live embedded app.
- **deepresearch / codeweaver / data-scout** — a small placeholder `alpine` container, since these agents have no real backend yet. It proves a real pod spins up and streams real logs; swap in a real image/cmd per agent in `server/runConfigs.js` to make any of them fully functional, with no frontend changes needed.

If Docker isn't running, the session page shows a clear "Cannot reach Docker" error instead of crashing.

## Build for production

```bash
npm run build
npm run preview
```

Preview serves the built app at [http://localhost:4173](http://localhost:4173).

## Requirements

- Node.js 18+
- npm 9+

## What you can do

- **Browse** — search and filter agents on the home page
- **Run** — boot an agent and open a session (mock or embedded)
- **Wiki** — docs loaded automatically from each agent's `README.md`
- **Sessions** — chat with running agents (mock replies)
- **Studio** — multi-agent pipeline feed

Toggle dark/light mode from the header.

## Wiki / docs

Each agent's wiki page reads from:

```
public/readmes/{agent-slug}/README.md
```

Drop a README in that folder and it appears on `/wiki/{slug}` — no manual wiki JSON. On register, upload or paste a README; that becomes the agent docs in production.

Regenerate README files from legacy `wiki.json` (optional):

```bash
npm run generate-readmes
```

## Embedded agent (optional)

The `financial-advisor` agent opens a live Streamlit app in an iframe at `http://localhost:8501`. Build the image once — the run backend (`npm run server`) starts and stops the container for you when you click **Run**:

```bash
git clone https://github.com/merendamattia/personal-financial-ai-agent
cd personal-financial-ai-agent
cp .env.example .env   # add your API key
docker build -t financial-ai-agent:local .
```

Then in AgentHub: find **financial-advisor** → click **Run** → **Open session**. The session page shows the real container logs plus the live embedded app.

If Docker is not running, or the image hasn't been built yet, the session page shows a clear error instead of crashing.

## Project structure

```
server/         Local run backend — POST /api/runs starts a real Docker container, WS streams its logs
src/
  api/          Mock client → /public/mock/*.json (+ runsApi.js → real run backend)
  components/   UI components
  context/      Theme, auth, search, boot providers
  hooks/        Data fetching
  pages/        Route views
  routes/       React Router config
  styles/       CSS themes and layout
public/mock/    Static JSON mock data
```

## Notes

This is mostly a **frontend prototype** — agent catalog, wiki, chat, and auth are mocked. The one real piece is the run backend (`server/`): clicking **Run** launches an actual Docker container and streams its real output into the session page.
