# Base44 Dev Environment

## Project Overview
Sistem Iuran Kantin Sekolah — a school canteen fee management PWA.
Vite + React 19 + TypeScript + Tailwind CSS 4, with an Express server (`server.ts`)
that serves the Vite dev middleware and one API endpoint (`/api/ai-assistant`).

## Architecture
- **Single server**: `tsx server.ts` starts Express on port 3000. In dev mode it
  mounts Vite as middleware (SPA), so the frontend and API share one origin/port.
- **No database**: All data is client-side localStorage (see `src/utils/storage.ts`).
  Seed data is auto-generated on first load.
- **External service**: `GEMINI_API_KEY` (Google Gemini) powers the AI assistant
  endpoint. The app boots without it; the endpoint returns an error if called
  without a valid key.

## Running
```
docker compose -f docker-compose.base44.yml up -d --build
```
- Node 22 slim image, repo bind-mounted at `/app`.
- Deps installed at startup via `npm install --include=dev`.
- File-watch polling enabled (`CHOKIDAR_USEPOLLING=true`) for bind-mount live reload.
- Port 3000 is the web entry point.

## Login
Default credentials (seeded in localStorage):
- Email: `ekopurnawan55@gmail.com`
- Password: `password123`

## Verification
- `curl -s http://localhost:3000/` should return the HTML with `<div id="root">`.
- The login screen should render in the preview.
- The AI assistant (`/api/ai-assistant`) requires a real `GEMINI_API_KEY` to function.
