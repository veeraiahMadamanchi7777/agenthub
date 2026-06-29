# AgentHub

A React prototype for browsing, launching, and managing AI agents — inspired by [Ollama](https://ollama.com). Uses mock JSON data locally (no backend required).

## Clone and run

```bash
git clone https://github.com/veeraiahMadamanchi7777/agenthub.git
cd agenthub
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

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

The `financial-advisor` agent opens a live Streamlit app in an iframe at `http://localhost:8501`. To use it:

```bash
git clone https://github.com/merendamattia/personal-financial-ai-agent
cd personal-financial-ai-agent
cp .env.example .env   # add your API key
docker build -t financial-ai-agent:local .
docker run -p 8501:8501 --env-file .env financial-ai-agent:local
```

Then in AgentHub: find **financial-advisor** → click **Run** → **Open session**.

If Docker is not running, the session page shows a connection error — that is expected for this prototype.

## Project structure

```
src/
  api/          Mock client → /public/mock/*.json
  components/   UI components
  context/      Theme, auth, search, boot providers
  hooks/        Data fetching
  pages/        Route views
  routes/       React Router config
  styles/       CSS themes and layout
public/mock/    Static JSON mock data
```

## Notes

This is a **frontend prototype**. Agent data, sessions, and auth are mocked. No database or API server is included.
