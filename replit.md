# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with AsyncStorage for local persistence

## Artifacts

### Mobile App - Oman Debates / مناظرات عُمان (`artifacts/mobile`)
- **Purpose**: Debate tournament scoring system for parliamentary debate competitions
- **Brand**: Oman Debates logo, cyan (#4ECDC4) and purple (#7B5EA7) color scheme
- **Features**:
  - Multi-tournament support: create, open, delete, and manage multiple tournament files
  - Home screen with logo (glow effect), saved tournaments list
  - Enter even number of teams with names
  - Round 1: Random matchup distribution
  - Round 2+: Winners vs Winners, Losers vs Losers pairing
  - Room assignment for each match
  - Choose Government (موالاة) vs Opposition (معارضة) roles
  - **Per-team speaker count**: each team independently set to 3 or 4 speakers during setup
  - **Reply speech scoring**: each team card has خطاب الرد section: select speaker (م١/م٢) + score input; included in team total
  - **Judge links (serverless)**: match/round data encoded in URL as base64; judge fills scores, gets "result code" to copy and send back to organizer; zero server/Firebase needed
  - **Score code import**: organizer pastes judge's result code in match screen to apply scores automatically
  - **Remote judging**: single-match and per-round judge links with reply speech support
  - Named speaker registration during setup (per-team)
  - Score individual speakers by name
  - Best speaker per room: highest individual score across both teams
  - Team total = sum of all speakers
  - Standings with wins, losses, total points
  - End tournament capability
  - Home button to return to tournament list
  - Auto-save progress via AsyncStorage
  - **Round judge link**: creates one shared URL for all rooms in a round; judges pick their room on the web page and enter scores; RTL Arabic UI
  - **Per-match judge link**: individual room links from the match screen
  - **PDF export**: `expo-print` + `expo-sharing` generates a styled tournament report
  - **Tournament editing**: edit team names, speaker names, speaker count per team after creation (edit.tsx screen)
  - **Dark mode**: toggle on home screen; persists via AsyncStorage key `app_theme_mode`; full dark palette in `constants/colors.ts`
  - **Speaker leaderboard**: speakers.tsx screen; aggregates speaker scores across all rounds, ranked by total
  - **Team match history**: team-history.tsx screen; per-team list of all matches with roles, opponents, scores, win/loss
  - **Backup/export**: export all tournaments as JSON; import JSON to restore (deduplicates by tournament id)
  - **Auto-notification**: banner when all rooms in current round complete (with haptic feedback)
  - **Judge names & notes**: match.tsx has judge name input field; judge HTML pages have name + notes textarea; stored in Match as `judgeNames: string[]` and `judgeNotes: string`
- **State Management**: AsyncStorage (key: `debate_tournaments_v2`) via TournamentContext
- **Theme**: ThemeContext in `context/ThemeContext.tsx`; `useColors()` hook reads palette based on dark/light mode
- **Navigation**: Stack-based (Home → Setup → Tournament → Match scoring / Edit / Speakers / Team History)
- **Color tokens**: cyan = government, purple = opposition, success = green
- **Key files**:
  - `context/TournamentContext.tsx` - multi-tournament state + pairing logic + `updateTeam` + `exportAllData` + `importAllData`
  - `context/ThemeContext.tsx` - dark mode toggle context with AsyncStorage persistence
  - `types/tournament.ts` - data types (speakersPerTeam on Team; judgeNames, judgeNotes on Match)
  - `constants/colors.ts` - brand color tokens (light + dark palettes)
  - `hooks/useColors.ts` - reads from ThemeContext to return current palette
  - `app/index.tsx` - home screen (tournament list + dark mode toggle + backup buttons)
  - `app/setup.tsx` - new tournament creation (per-team speaker count toggle)
  - `app/tournament.tsx` - tournament view (rounds + standings + speakers tab + PDF + judge link + edit + notification banner)
  - `app/match.tsx` - match scoring (per-match judge link + judge names input)
  - `app/edit.tsx` - edit team names, speaker names, speaker count
  - `app/speakers.tsx` - speaker leaderboard screen (modal)
  - `app/team-history.tsx` - team match history screen (modal)
  - `components/MatchCard.tsx` - match card component
  - `components/StandingRow.tsx` - standing row component
  - `lib/judgeApi.ts` - serverless judge codec (encodes match data into URL, decodes result codes)

### Web App - Oman Debates Web / مناظرات عُمان (`artifacts/web`)
- **Purpose**: Web version of the debate tournament scoring app (React + Vite)
- **Port**: 22333, preview path: `/web`
- **Features**: Same as mobile — multi-tournament management, teams, rounds, match scoring, speaker leaderboard, team history, judge info
- **Stack**: React + Vite + Tailwind CSS + shadcn/ui + wouter routing + framer-motion
- **Persistence**: localStorage (key: `debate_tournaments_v2`)
- **UI**: Arabic RTL with Cairo font, cyan/purple branding, dark mode toggle
- **Key files**:
  - `src/App.tsx` - routes and providers
  - `src/types/tournament.ts` - data types
  - `src/context/TournamentContext.tsx` - state management with useReducer + localStorage
  - `src/context/ThemeContext.tsx` - dark/light mode toggle
  - `src/pages/home.tsx` - tournament list + create
  - `src/pages/tournament-detail.tsx` - teams, rounds, standings tabs
  - `src/pages/match-scoring.tsx` - score entry with gov/opp teams side by side
  - `src/pages/leaderboard.tsx` - speaker rankings
  - `src/pages/team-history.tsx` - per-team match history
  - `src/pages/judge.tsx` - single-match judge scoring page (serverless, URL-encoded data)
  - `src/pages/judge-round.tsx` - round judge page (room selection + scoring)
  - `src/lib/judgeCodec.ts` - shared types + encode/decode helpers + `buildSessionUrl(kind, sessionId)` for `/web/judge/:id` and `/web/judge/round/:id`
  - `src/lib/firebaseJudgeApi.ts` - REST client for the Express api-server (`/api/judge/*`). Despite the legacy filename, this is **not** Firebase — it uses fetch + setInterval polling (4s) for `subscribeMatchResults` / `subscribeRoundResults`. Exports: `createMatchSession`, `createRoundSession`, `getMatchSession`, `getRoundSession`, `submitMatchResult`, `submitRoomResult`, `deleteMatchSession`, `deleteRoundResult`, `subscribeMatchResults`, `subscribeRoundResults`
- **Judge link transport (Phase 2 — production-ready)**: Organizer creates a session row in Postgres via `POST /api/judge/sessions` (single match) or `POST /api/judge/round-sessions` (whole round). Returns short session id. Judge URL contains only the id; judge page fetches session info, submits scores via `PUT`. Tournament detail page polls `/api/judge/tournaments/:tid/results` every 4s and ingests/deletes consumed rows. Works identically in dev and production (autoscale deploy).

### Backend - Judge API server (`artifacts/api-server`)
- **Purpose**: Express 5 + Postgres backend for judge sessions
- **Port**: 5050, mounted at `/api` via the global proxy
- **Stack**: Express 5, drizzle-orm, pg
- **Endpoints** (all under `/api/judge`):
  - `POST /sessions` `{tournamentId, matchInfo}` → `{id}`
  - `POST /round-sessions` `{tournamentId, roundData}` → `{id}`
  - `GET /sessions/:id` → match session info + result if submitted
  - `GET /round-sessions/:id` → round session info + per-room results
  - `PUT /sessions/:id/result` (judge submits match scores)
  - `PUT /round-sessions/:id/results/:room` (judge submits one room's scores)
  - `DELETE /sessions/:id` (organizer consumes a match)
  - `DELETE /round-sessions/:id/results/:room` (organizer consumes one room)
  - `GET /tournaments/:tid/results` (organizer polling aggregate)
- **Database**: PostgreSQL (Replit-managed). Schemas in `lib/db/src/schema/`:
  - `judge_sessions(id text pk, tournament_id text, kind text, info jsonb, results jsonb default '{}', created_at timestamptz)` with index on `tournament_id`.
  - `public_tournaments(id text pk, name text, topic text, updated_at timestamptz)` — published tournament info shown on the public registration pages.
  - `tournament_registrations(id text pk, tournament_id text, kind text 'team'|'judge', payload jsonb, created_at timestamptz)` with index on `tournament_id` — direct team & judge sign-ups via the public link, no copy/paste; the organizer's tournament page polls every 5s, ingests each row into the pending-requests list, then deletes it server-side.
  - Run `pnpm --filter @workspace/db run push` to apply schema changes.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/mobile run dev` — start Expo dev server
