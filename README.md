# AgentHub — Frontend Prototype

Production-grade **React prototype** with mock JSON data (no backend, no database).

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Features

- **Browse** — agent catalog with category filters
- **Wiki** — global documentation for all agents
- **Sessions** — chat with running agents (mock replies)
- **Studio** — multi-agent pipeline A2A feed
- **Theme toggle** — Ollama-style dark / light mode (☀ / ☾ in header)

## Architecture

```
src/
  api/          Mock client → /public/mock/*.json
  context/      Theme, Auth, Boot providers
  hooks/        Data fetching + UI logic
  components/   Small reusable UI (<30 lines each)
  pages/        Route-level views
  routes/       React Router config
  styles/       CSS variables + themes
public/mock/    Static JSON mock server data
```

## Mock data

All data lives in `public/mock/` as JSON files loaded via `fetchMock()`.

No backend required until prototype is approved.
