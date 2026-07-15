# Sea Robin Classic — App Reference (SRCSFT_APP)

Single source of truth for the app. State as of **2026-07-12**. No secrets here (they live in Netlify + Supabase dashboards).

## What it is
Mobile-first, invite-only PWA for an annual surf-fishing tournament. Live scoring, AI catch verification + a rules/Q&A assistant ("SRC AI"), records, roster, career accolades, Glory Shots + a "Glory Shot Fav" vote, weather/beach report, and a full M.O.C. admin panel.

- **Dir:** `/Users/michaelsantimaw/Documents/Claude/sea-robin-classic`
- **Live:** https://sea-robin-classic.netlify.app (installable PWA)
- **Deploy:** `netlify deploy --build --prod` from the project dir (this is how every change ships).
- **Design context:** `.impeccable.md` (dark-default, Bricolage Grotesque / Hanken Grotesk, ocean-teal accent `--flare`, **gold reserved for honors**, ceremonial-rugged-wry tone). Run `/impeccable` or `/polish` against it.

## Technology stack

| Layer | Technology | Notes |
|---|---|---|
| **Language** | TypeScript 5.6 | strict, `tsc -b` in build |
| **UI framework** | React 18.3 (react-dom) | SPA, mobile-first |
| **Build tool** | Vite 5.4 + `@vitejs/plugin-react` | dev server + prod bundler |
| **PWA** | `vite-plugin-pwa` 0.21 (Workbox) | installable, service-worker caching |
| **Local data** | Dexie 4 + `dexie-react-hooks` | IndexedDB mirror + offline write outbox |
| **Cloud backend** | Supabase (`@supabase/supabase-js` 2.110) | Postgres (RLS), Auth, Realtime, Storage |
| **Serverless** | Netlify Functions (Node/ESM `.mjs`) | AI proxy + backup engine |
| **AI model** | Google **Gemini 2.5 Flash** | via `generativelanguage` REST; `GEMINI_API_KEY` server-side |
| **Backup/export** | Google Sheets API + Google Drive API | OAuth; timestamped Sheet + Supabase Storage |
| **Hosting / CI** | Netlify | `netlify deploy --build --prod`; `@daily` cron function |
| **Styling** | Hand-authored CSS (`index.css`) | custom props; Bricolage Grotesque / Hanken Grotesk |

Notes: `@anthropic-ai/sdk` is a listed dependency but the live AI path uses Gemini, not Anthropic — dead weight unless there are plans for it. No test framework installed (no vitest/jest).

---

# Developer handoff

## Getting started
```bash
git clone <repo> && cd sea-robin-classic
npm install
cp .env.example .env.local          # optional — see modes below
npm run dev                         # Vite on http://localhost:5173
```
**Two run modes**, decided purely by whether the Supabase env vars are set:
- **Local-only** (leave `VITE_SUPABASE_*` unset): IndexedDB is the whole world. No auth server, no sync, AI disabled. Demo login `moc@searobinclassic.com` / `searobin`. This is the fastest way to work on UI/scoring.
- **Cloud** (`.env.local` filled from the real Supabase project): real Auth + Postgres + Realtime. For the AI/backup functions to run locally you need `netlify dev` (not `npm run dev`) with `GEMINI_API_KEY` set, since those are Netlify Functions.

Env vars (`.env.example` is the template):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — client-safe, shipped to the browser.
- `GEMINI_API_KEY` — **server only**, never `VITE_`-prefixed, never in the bundle. Used by `netlify/functions/ai.mjs`.
- Backup→Drive needs 5 more server vars (see Outstanding section).

Build / ship:
- `npm run build` → `tsc -b && vite build` (typecheck is part of the build).
- `netlify deploy --build --prod` — the only deploy path. After deploy, the PWA service worker caches aggressively — fully close & reopen the installed app to pick up a new version.

## Repo map
```
index.html, vite.config.ts, netlify.toml, tsconfig.json   # app shell + build/deploy config
.env.example                                              # env template (copy to .env.local)
src/
  main.tsx, App.tsx           # entry + the whole "router": a single `screen` state string, no router lib
  index.css                   # ALL styling — hand-authored CSS custom properties, dark-default
  context/
    AppContext.tsx            # auth (current user), tournament state, actions — the app-wide store
    ThemeContext.tsx          # light/dark
  data/                       # the data engine (see flow below)
    db.ts                     # Dexie schema (versioned), password hash, OS notify
    supabase.ts               # client + `cloudEnabled` flag (drives dual-mode everywhere)
    repository.ts             # all reads/writes the UI calls — mode-agnostic
    sync.ts                   # pullAll (cloud→local), outbox flush (local→cloud), realtime
    seed.ts                   # demo/local seed data
    backup.ts                 # triggerBackup() → hits the Netlify backup function
    weather.ts, useForecast   # ocean/beach report
  domain/                     # pure logic, no I/O — safe to unit test in isolation
    scoring.ts, standings.ts, records.ts   # code-driven scoring (NOT M.O.C.-editable)
    accolades.ts              # career/Hall of Fame/Shiner data (generated from the xlsx)
    rules.ts                  # SRC AI grounding text + retrieveSections()
    types.ts, location.ts
  ai/claude.ts                # client wrapper → /.netlify/functions/ai (named "claude" but calls Gemini)
  pages/                      # one file per screen (Scorecard, SubmitCatch, Admin, GloryPics, Rules, …)
  components/                 # shared UI (TabBar, Header, CatchCard, Badges, RoleBadge, …)
netlify/
  functions/ai.mjs            # Gemini proxy (catch verify + rules Q&A)
  backup-core.mjs             # backup engine (Supabase Storage + Google Sheet/Drive)
  functions/backup.mjs        # HTTP trigger    functions/backup-daily.mjs  # @daily cron
supabase/
  schema.sql                  # fresh-install schema
  migration-*.sql             # incremental migrations — ALL already run on live
public/                       # PWA icons, emblem, /memories/<year>/*.jpg photo archive
```

## Data flow (the part to understand first)
The UI **never** talks to Supabase directly. It calls `repository.ts`, which reads/writes **Dexie (IndexedDB)**. The UI reacts to Dexie via `dexie-react-hooks` live queries, so it's always rendering local state — instant, offline-safe.

- **Write:** `repository` writes to Dexie immediately; in cloud mode it also enqueues the change in the **`outbox`** table. `sync.ts` flushes the outbox to Postgres when online.
- **Read/refresh:** `sync.pullAll()` pulls Postgres → Dexie (and reconciles deletions), Realtime pushes live updates into Dexie. UI re-renders off Dexie.
- **`cloudEnabled`** (from `supabase.ts`, = "are the env vars set") is the single switch that makes every path either sync-backed or local-only.

Dexie schema is **versioned** in `db.ts` (currently v5). Adding a table/index = bump the version with an additive `.stores({...})` block — don't mutate existing version blocks. Postgres changes go in a new `supabase/migration-*.sql` **and** `schema.sql`, then get run on live.

## Conventions & gotchas
- **`domain/` is pure** — no I/O, immutable transforms (returns new objects, never mutates inputs). Keep scoring/standings/records there so they stay testable and M.O.C. can't edit them at runtime.
- **Scoring rounds every measurement DOWN to the nearest ¼"** (`floorToQuarter`) at all write sites — preserve this if you touch catch entry or rescoring.
- **Routing is a string** (`screen` state in `App.tsx` + `TabBar`). No React Router. Add a screen = add a case + a tab entry.
- **Secrets:** only the Supabase *anon* key is allowed in the client. Anything sensitive (Gemini, service role, Google OAuth) lives server-side in Netlify env and is used only from `netlify/`.
- **AI degrades gracefully** — `aiAvailable()` gates the UI, and calls fall back if the function is unreachable (offline/local). Don't make features hard-depend on AI.
- **No tests exist.** If you add non-trivial logic, `domain/` is the right place to introduce the first `*.test.ts` (you'd add vitest).
- **`src/ai/claude.ts`** is historically named — it calls the Gemini-backed function, not Anthropic.

## Where to change things (quick index)
| I want to… | Edit |
|---|---|
| Change how a fish scores / bands / bonuses | `src/domain/scoring.ts` (+ `standings.ts` for per-angler) |
| Add/reclassify a species | `src/domain/scoring.ts` category maps |
| Edit records logic | `src/domain/records.ts` |
| Change SRC AI knowledge / easter eggs | `src/domain/rules.ts` |
| Change AI prompt/model behavior | `netlify/functions/ai.mjs` |
| Add a screen | new file in `src/pages/`, wire in `App.tsx` + `TabBar.tsx` |
| Admin / M.O.C. tools | `src/pages/AdminPage.tsx` |
| Data read/write | `src/data/repository.ts` (never call Supabase from a component) |
| Sync / realtime / outbox | `src/data/sync.ts` |
| DB schema (local) | `src/data/db.ts` — bump Dexie version additively |
| DB schema (cloud) | new `supabase/migration-*.sql` + `schema.sql`, run on live |
| Styling / theme tokens | `src/index.css` |
| Backup/export | `netlify/backup-core.mjs` (+ `src/data/backup.ts` to trigger) |

---

## Stack / architecture
Vite + React 18 + TS, `vite-plugin-pwa`. **Dual-mode data:**
- **Cloud** (Supabase env set): Postgres = source of truth (RLS, Auth, Realtime, Storage). Dexie/IndexedDB = local mirror the UI always reads + an offline write **outbox**. `pullAll` reconciles deletions.
- **Local** (no env): Dexie is truth, demo login `moc@searobinclassic.com` / `searobin`.
- **AI:** Netlify function `netlify/functions/ai.mjs` → Google **Gemini 2.5 Flash** (`GEMINI_API_KEY` server-side only).
- **M.O.C. cloud account:** `mikesantimaw@gmail.com` (⚠️ still should rotate the password from transcripts).
- Supabase ref `rowjbjdhvakepcvufavs`; Netlify site `sea-robin-classic`.

## Scoring (code-driven, NOT M.O.C.-editable)
`src/domain/scoring.ts` (per-fish), `standings.ts` (per-angler), `records.ts`.
- Banded PPI: Sea Robin 500 · Tier1 (Striped Bass, Flounder, Red Drum) <18"→120/≥18"→200 · Tier2 <13"→50/13–<18"→100/≥18"→120 · Trash <12"→20/12–<17"→30/≥17"→50.
- **Every measurement rounds DOWN to the nearest ¼"** before scoring (`floorToQuarter`, applied at all write sites).
- Bonuses (+100 PPI×len): Lure, Trophy, Record Breaker. Full Monty = flat +1000. Trash-3 cap + tie-breaks in standings.ts.
- **Species categories:** Puffer Fish, Eel, Cusk Eel → **Trash**; **Weakfish** in Tier 2.
- Records finalize at Publish; also rewritten when a record-breaker is approved in Scorecard review.

## Career data — `src/domain/accolades.ts` (auto-generated from `SRC Cumulative Scoring Standings - 2026.xlsx`, Artifacts folder)
`HALL_OF_FAME: Accolade[]` (34 anglers). `history: [year, SeasonResult][]` where a `SeasonResult` is points (0 = **Shiner**), or **"DQ"**/**"ABD"** (disqualified / abandoned — NOT Shiners, and they break streaks). 5 DQ/ABD events are encoded (Greg Hudson '11 ABD, Pete Dzien '07 & '12 DQ, Mike Cooper '11 ABD, Mike Santimaw '11 ABD).
- **Shiner** = participated + zero scoring fish that year. `shinerSeasons(a)` counts them.
- **Shiner Club President** = each year's current Shiner with the longest active streak; ties → most-recent prior President → M.O.C. ruling; vacant if nobody blanks. `computeShinerPresidents()` / `SHINER_PRESIDENTS` / `presidencyYears(a)`. Historic ledger computed from the career file (John Friscia leads, 9).
- Both surface as: badges (pewter Shiner coin `--shiner`, bronze President shield `--president`), stat tiles/lines, season-by-season labels, and columns in the career Google Sheet export.

## SRC AI (`src/pages/RulesPage.tsx`, `src/domain/rules.ts`, `netlify/functions/ai.mjs`)
- Tab labeled **"SRC AI"**, page title **"Rules & Question Assistant"**, thinking message **"Consulting our SRC gods…"**.
- Grounded in `rules.ts`. **Easter eggs** (unofficial legends, told SHORT & punchy, NEVER shown in the "Try asking" chips): Derek Clause (hot dogs → 34,000 unscored pts), Sandimas Cheeseburger Phenomenon (~10:54am McDonald's, hand-off or fastball to the chest), 3-Room Vacation Home (Sandimas's retired-2016 non-canvas instant cabin; residents Sandimas/Tony "Spot"/Greg Hudson/John Friscia; propane heat; upgrade from the canvas tent "The Hilary").

## M.O.C. Panel (`src/pages/AdminPage.tsx`)
Tabs (two-row wrap): **Tournament · Current Scorecards · Glory Fav · Roster · Scoring & AI** (the old **Catches** tab is hidden; `CatchModeration` code kept). Opens on **Current Scorecards** when any card awaits a ruling.
- **Tournament:** lifecycle stepper (Setup→Live→Ended→Published) + "Next step" hint; **Start a new tournament** (collapsed participant picker, forces an unused year → clean scorecards); **Past Tournaments** (each expands to that year's full standings, champion gold); **Backup & Export Now** card.
- **Current Scorecards:** the end-of-tournament review, embedded (`ScorecardsReviewPage embedded`). Per-catch controls: **Reinstate** (if not approved) · **Strike** · **Edit inches** · **Rescore** — all 44px tall; the per-catch **Decline** button was removed (Reject still lives in the "needs a ruling" alert). Approving a record-breaker here broadcasts + rewrites the record book.
- **Roster:** ONE unified list. Every row has a full status dropdown incl. **INACTIVE** (a role; inactive anglers can't log in). Registered anglers save to their profile; historic/non-login names save to `settings.roster_overrides` (name→role). These 10 default to Inactive: Nick Insley, Tony Marandola, John Dinlocker, Kevin Tumola, Ken Thompson, Carlo Gambone, Mike Hurrell, Chris Coughlin, Mason Keresty, Karlos Gutierrez.
- **Glory Fav:** curate the ballot (upload or add existing shots), **Publish for voting** → participants vote, **Close voting**, **Publish results**, **Clear all votes**. M.O.C.-only tallies until publish.

## Glory Shot Fav voting (`src/pages/GloryPicsPage.tsx`)
Top section on Glory Shots. **Tap a shot to vote, tap another to change, tap your pick to clear — until the M.O.C. closes voting** (no submit/lock). M.O.C. can always vote; otherwise the tournament roster (or everyone if empty). Tallies hidden from participants until PUBLISHED; winner shown with gold. State: `settings.glory_fav_state` (OFF/OPEN/CLOSED/PUBLISHED). Data on `glory_pics`: `nominated_year`, `votes` (jsonb array of userIds).

## Live "Tournament Live" page (`src/pages/ScorecardPage.tsx`)
Teal panel: emblem `public/src-emblem.png` centered right (the 29th-annual logo), big count (72px), label **"Fish Landed Today"**, bright-orange live dot (`--live`). Scorecard header labels the tournament by name · season · date. Banner when Glory Fav voting is OPEN → jumps to the vote.

## Netlify functions
- `netlify/functions/ai.mjs` — Gemini (verify + rules).
- `netlify/backup-core.mjs` (engine) + `functions/backup.mjs` (HTTP) + `functions/backup-daily.mjs` (`@daily` cron). Writes timestamped, never-overwritten files: full JSON + results CSVs → **Supabase Storage** bucket `backups`; and a formatted native **Google Sheet** (3 tabs: Career Leaderboard, Current Tournament, Scorecard Detail) → **Google Drive**. Fires daily, on `endTournament`/`publishResults`/`publishGloryFav`, and from the manual button (`src/data/backup.ts` `triggerBackup()`).

## Supabase migrations (in `supabase/`, ALL RUN on live already)
`migration-glory-fav.sql` (glory_pics.nominated_year + votes, settings.glory_fav_state), `migration-inactive-role.sql` (INACTIVE in role_tag checks), `migration-roster-overrides.sql` (settings.roster_overrides). `schema.sql` updated for fresh installs. Earlier: tournaments/invites/penalties/2026-records migrations.

## ⏳ OUTSTANDING — the only pending item
**Backup → Google Drive needs 5 Netlify env vars** (Supabase Storage half needs only the first). Add in Netlify → Site settings → Environment variables, then redeploy:
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API → service_role)
- `GDRIVE_FOLDER_ID` = `12O7vOSqn8AayV9o3fn9F0PzOs3GD-F7M`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` — OAuth for the user's OWN Google account (NOT a service account; a service account can't write to a personal Drive). Get the refresh token via OAuth Playground with scopes `drive.file` + `spreadsheets`; set the consent screen to **Production** so the token doesn't expire in 7 days.
See memory note `backup-export-setup.md` for the full steps.

## Run / verify
- Deploy is the verify path: `netlify deploy --build --prod`. Typecheck: `npx tsc --noEmit` (cd into project first). Build: `npx vite build`.
- Preview MCP can't spawn npm under `~/Documents` (TCC) and the app is behind login, so screens are verified by deploying + the user hard-refreshing the PWA (service worker caches — fully close/reopen to update).
- Source backups: `/Users/michaelsantimaw/Documents/Claude/backups/sea-robin-classic-*.tar.gz`.

## Nice-to-next (optional)
- Rotate the M.O.C. password.
- Crown the Shiner Club President **live** at Publish (extend the ledger for 2026+; add the M.O.C. tie-picker) — currently the ledger is historic-only from the career file.
- SME validation of borderline species mappings.
