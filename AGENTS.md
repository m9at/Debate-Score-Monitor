# Base44 Dev Environment

## Overview
pnpm monorepo — "Oman Debates" debate tournament scoring system. Three runtime services + PostgreSQL via `docker-compose.base44.yml`.

## Architecture
- **web** (`artifacts/web`): Vite 7 + React 19 + Tailwind 4 + wouter + Clerk auth. Served on host port 3000. Requires env vars `PORT` and `BASE_PATH` (vite.config.ts throws without them). Uses `localStorage` for tournament persistence; calls API at relative `/api/*` via a Vite dev-server proxy (`server.proxy["/api"]` → `http://api:5050`).
- **api** (`artifacts/api-server`): Express 5 + Drizzle ORM + node-postgres. Runs `tsx watch` on port 5050 (internal only, not exposed to host). Requires `DATABASE_URL`.
- **db**: PostgreSQL 16 (alpine). Credentials are inline in compose (not secrets).
- **migrate**: One-shot `drizzle-kit push` (via `pnpm --filter @workspace/db run push`) that creates/syncs all tables. Runs before `api` starts.
- **setup**: One-shot `pnpm install --frozen-lockfile` that installs all workspace dependencies. Runs before everything else.

## Secrets
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key. Without it the web app renders an Arabic "Clerk key missing" error screen instead of the UI. All routes are public (auth is optional), but `ClerkProvider` requires the key to initialize. Delivered via `/run/base44/app.env` (env_file on the `web` service).

## Key env vars
| Service | Var | Value |
|---------|-----|-------|
| web | PORT | 3000 |
| web | BASE_PATH | / |
| web | API_URL | http://api:5050 (Vite proxy target) |
| api | DATABASE_URL | postgresql://oman:oman_debates_dev@db:5432/oman_debates |
| api | PORT | 5050 |

## pnpm notes
- Lockfile version 9.0; uses pnpm 10 (installed via `npm install -g pnpm@10` in each container).
- `pnpm-workspace.yaml` has `minimumReleaseAge: 1440` — `--frozen-lockfile` bypasses this since resolution is skipped.
- Workspace packages: `artifacts/*`, `lib/*`, `lib/integrations/*`, `scripts`.

## PWA
- `public/manifest.webmanifest` defines the existing Arabic app identity and standalone display. HTML uses Vite's `%BASE_URL%` so icons/manifest work from deep links.
- `src/lib/registerServiceWorker.ts` registers `public/sw.js` only in production. Dev unregisters only this app's worker and clears only `oman-debates-*` caches to prevent stale live source.
- The worker precaches an Arabic offline fallback and existing icons only; navigations stay network-first and API/auth data are never cached. This is an online PWA, not offline tournament editing.
- `InstallAppButton` in the home header uses the browser install prompt when offered, otherwise shows Arabic manual instructions. Native installation must be checked outside the embedded preview on HTTPS.
- Deployment and post-publish install checks are in `DEPLOY.md`. Production Express explicitly revalidates worker and manifest responses (`Cache-Control: no-cache`).
- Original PWA PNGs were actually 2000×2000 despite their filenames; corrected to 192×192, 512×512 and Apple 180×180. Preserve these actual dimensions when replacing artwork.
- Verified production in headless Chromium: no installability errors, worker controls the page, deep-link manifest resolves, offline navigation shows fallback, API requests are not cached, and clicking retry online restores the page. Native OS installation still requires a real device.

## Verification
1. `docker compose -f docker-compose.base44.yml ps` — db healthy, setup/migrate exited 0, api + web up.
2. `curl -sf http://localhost:3000/` — returns the Vite-served HTML.
3. `curl -sf http://localhost:3000/api/healthz` — returns `{"ok":true,...}` (proxied to the API).
4. `curl -sf -H "Host: external" http://localhost:3000/src/main.tsx` — returns transformed TS (confirms live dev server, not prebuilt).
