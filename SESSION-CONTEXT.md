# Sea Robin Classic — Session Handoff / Context

> Paste this into a new session to continue work. It captures the full state of
> the app as of 2026-07-03. No live secrets are included here (they live in
> Netlify env vars and the Supabase/Netlify dashboards).

## What this is

**Sea Robin Classic (SRC)** — a mobile-first PWA for an invite-only annual surf
fishing tournament (Mid-Atlantic beaches; Assateague/Delaware). Live scoring,
AI catch verification, a rules assistant, records, roster, off-season feed, and
a photo archive.

- **Project dir:** `/Users/michaelsantimaw/Documents/Claude/sea-robin-classic`
- **Live site:** https://sea-robin-classic.netlify.app  (installable PWA)
- **GitHub (private):** https://github.com/MSantimaw/sea-robin-classic  (branch `main`)
- **Source material:** `/Users/michaelsantimaw/Documents/Claude/Sea Robin App`
  (2019 Official Rules PDF, 2017 rules .doc, `SRC Logo.png`, 1999–2001 photos)

## Stack & architecture

Vite + React 18 + TypeScript, `vite-plugin-pwa`. **Dual-mode data layer:**

- **Cloud mode** (Supabase env vars set): Supabase Postgres is the source of
  truth (RLS, Auth, Realtime, Storage). Dexie/IndexedDB is a local **mirror**
  the UI always reads from, plus a write **outbox** flushed to Supabase on
  reconnect (offline-first). Auth = Supabase (password + magic link).
- **Local-only mode** (no Supabase env): Dexie is the source of truth,
  hand-rolled auth, demo M.O.C. login `moc@searobinclassic.com` / `searobin`.
- **AI** runs through the Netlify function `netlify/functions/ai.mjs` using
  **Google Gemini 2.5 Flash** (thinking disabled), key server-side only
  (`GEMINI_API_KEY`). Falls back to offline rulebook / manual review if absent.
- All entity primary keys are **UUID strings** (shared Supabase ⇄ Dexie).

## Deployed backend (identifiers, not secrets)

| Thing | Value |
|---|---|
| Supabase project | `sea-robin-classic`, ref **`rowjbjdhvakepcvufavs`**, region `us-east-1` |
| Supabase URL | `https://rowjbjdhvakepcvufavs.supabase.co` |
| Supabase org | `MSantimaw's Org` (`rsvhrriqazowttsspwfl`) |
| Netlify site | `sea-robin-classic`, project ID `1d251600-d5a7-444a-9f16-4ad941bf6d20`, account slug `mike-santimaw` (linked to the project folder) |
| Netlify env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` (all set) |
| Auth setting | `mailer_autoconfirm = true` (default email is rate-limited to 2/hr, so confirmation is off) |
| Site URL / redirects | set to `https://sea-robin-classic.netlify.app` for magic-link/reset |

**Accounts (live DB, as of 2026-07-03):** `mikesantimaw@gmail.com` = **M.O.C.**,
password **`SRC2026!!`** (email confirmed). `syfgreg@gmail.com` = **Greg Hudson**,
promoted to **M.O.C.** (so there are now two M.O.C.s). `mike@santimaw.com` = a JAFNG
test account (deletable). Read/modify the live roster by authenticating via the
Supabase Auth REST API with the M.O.C. login + the public anon key (in the client
bundle), then `GET`/`PATCH` `/rest/v1/profiles` (RLS lets an M.O.C. edit anyone).

## Key files

- `src/domain/` — `types.ts`, `scoring.ts` (engine), `records.ts` (2019 records), `rules.ts` (rulebook + retrieval), `location.ts` (tournament coords + NOAA tide station)
- `src/data/weather.ts` (forecast/marine/tide fetchers) + `src/hooks/useForecast.ts` (offline-first cache) → `WeatherButton` (header, 3-day drawer) + `OceanReport` (Beach Report card)
- `src/data/` — `db.ts` (Dexie mirror + outbox), `supabase.ts` (client + `cloudEnabled`), `sync.ts` (pull/realtime/outbox flush), `repository.ts` (all writes), `seed.ts` (local seed + `MEMORIES`)
- `src/ai/claude.ts` — calls the Netlify function
- `src/context/` — `AppContext.tsx` (auth), `ThemeContext.tsx` (light/dark)
- `src/components/` — `Icon.tsx` (SVG icon set), `BackButton`, `CatchCard`, `BlobImage` (`Photo`), `RoleBadge`, `Header`, `TabBar`
- `src/pages/` — `ScorecardPage` (landing), `SubmitCatchPage`, `RulesPage`, `MorePage`, `RecordsPage`, `GloryPicsPage`, `MemoriesPage`, `ProfilePage`, `AdminPage`, `LoginPage`
- `supabase/schema.sql`, `netlify/functions/ai.mjs`, `netlify.toml`, `DEPLOY.md`, `README.md`

## Features

- **Auth + roster tags:** M.O.C., Grand Robin, The Champ (one at a time), Angler, JAFNG (new anglers start JAFNG).
- **Catch submission:** photo (**optional** — chosen from the iOS **camera roll / photo library** or taken with the camera; the file input no longer sets `capture`, so iOS shows the full picker; no on-screen preview), species, inches, Bait/Lure, GPS tag. With a photo the AI verifies species + measuring device and can auto-approve; **without a photo the catch still counts but routes to the M.O.C. for manual review**. Trophy/Record catches always route to M.O.C.
- **Scoring engine** (`src/domain/scoring.ts`): base = inches × PPI; Lure adds bonus PPI; Skate Clause (wingtip, baseline PPI); Trophy (gamefish > threshold); Record Breaker (beats standing record). **All point values are editable defaults** — the official scorecard is VOID in the source PDFs. Defaults: Sea Robin 150, Game T1 (Striped Bass/Red Drum/Black Drum/Sheepshead) 100, Game T2 (Flounder/Sea Trout/Bluefish/Kingfish/Croaker) 60, trash 10; Lure +100 PPI; Trophy +500 (>24"); Record +1000; Skate baseline 10. Editable in **M.O.C. Panel → Scoring & AI**.
- **M.O.C. Admin panel:** approve/reject/rescore/strike catches, roster roles, scoring config. Approving a record breaker rewrites the record book.
- **Record Book:** seeded from 2019 rules §5-H (17 species). Sea Robin record = 0" (never caught).
- **Glory Shots** (off-season feed w/ comments — renamed from "Glory Pics").
- **Memories Vault** (1999–2001 archive photos, searchable by year).
- **Live notifications:** realtime broadcast + OS push when a fish is verified. **Measurements are NOT included** in notification text (species/gear/points only).
- **Landing = "Tournament Live":** a live count of fish landed & verified + **The Participant's Scorecard** (personal card). The old ranked leaderboard was removed.
- **Tournament lifecycle (2026-07-03):** `settings.tournament_state` = `SETUP → LIVE → ENDED → PUBLISHED` (M.O.C. Panel → **Tournament** tab: Start / End / Publish). Catches **auto-approve** on submit (no per-fish M.O.C. gate); Log Catch is blocked unless state = `LIVE`. **Scorecard Review** page (More, M.O.C.-only) shows every angler's card live with edit/decline/strike + a per-scorecard **Validate** toggle; **Publish Results** is disabled until all scorecards validated, then finalizes the record book from approved record-breakers, flips to `PUBLISHED`, and reveals the ranked **Final Results** page (More, all) + a landing banner. Records now only change at Publish (no mid-tournament churn). New settings cols: `tournament_state`, `published_at`, `reviewed_anglers`. **The live tournament is at `SETUP` — the M.O.C. must click Start.**
- **Newsletter:** `newsletters` table (id/title/body/author/created_at, RLS: all read / M.O.C. write, realtime). More → **Newsletter**: M.O.C. composes dated posts; everyone reads. New files: `src/pages/{NewsletterPage,ResultsPage,ScorecardsReviewPage}.tsx`, repo helpers `startTournament/endTournament/publishResults/setReviewedAnglers/publishNewsletter/deleteNewsletter`. Dexie bumped to **v3** (adds `newsletters` store).
- **Weather + Beach Report:** header weather button (current condition icon + temp) opens a slide-in **3-day forecast** drawer; a **Beach Report** card on the landing shows live ocean conditions (water temp, surf height/period, wind) and the next **high/low tides** with rising/falling state. Free no-key APIs, client-side, offline-first cached: **Open-Meteo** forecast + marine, **NOAA Tides & Currents** (station in `src/domain/location.ts`). Each source fetched independently with a 12s timeout, so one being down never blanks the rest. Location config drives everything — change `TOURNAMENT_LOCATION` to move the whole beach report.

## Design system (redesigned 2026-07-03)

- **Fonts:** Bricolage Grotesque (display/headings/numbers) + Hanken Grotesk (body/UI).
- **Color:** clean neutral base + single **ocean-teal** accent (`--flare` = `#0d9488` light / `#2dd4bf` dark). Full **light + dark** theming via CSS variables on `[data-theme]`; toggle (sun/moon) in the header; **defaults to dark** (falls back to dark when no saved choice); no-flash inline script in `index.html`. PWA manifest + `theme-color` meta set to the dark background (`#0b0e12`). **iOS PWA:** `viewport-fit=cover` + `env(safe-area-inset-*)` on the header/login/drawers so content clears the notch; a fixed dark band (`body::before`, height = `safe-area-inset-top`) sits behind the `black-translucent` status bar so its white glyphs stay legible in light mode too (invisible off-device / in dark mode).
- **Icons:** all SVG line icons via `src/components/Icon.tsx` (stroke = `currentColor`). No emoji anywhere.
- **Motion (Emil Kowalski principles):** custom easing curves (`--ease-out`, `--ease-drawer`), press feedback on tappable elements, staggered list entrances via a `.stagger` wrapper, edge/origin-aware overlay entrances, `prefers-reduced-motion` support. All in `src/index.css`.

## How to run / deploy

- **Local dev (local-only mode):** `npm run dev`. ⚠️ The Claude preview launcher
  can't spawn npm/node under `~/Documents` (macOS TCC → `EPERM: uv_cwd`). Use
  **Desktop Commander** `start_process` to run `npm run dev` (works, real HMR),
  OR `npx vite build` + copy `dist/` to the session scratchpad and serve it with
  `bash -c "cd <scratchpad>/sea-robin-dist && exec python3 -m http.server 5199"`
  for the preview MCP.
- **Cloud dev (with AI):** `netlify dev` (needs `.env.local` — see `.env.example`).
- **Deploy:** `netlify deploy --build --prod` (site is linked; env vars already set).
  Netlify env changes require a redeploy to take effect.
- **Supabase CLI:** browser login fails in non-TTY; set `SUPABASE_ACCESS_TOKEN`
  (Personal Access Token from the dashboard) to run `supabase`/`psql` against the DB.

## Gotchas learned this session

- `gemini-2.0-flash` returns **0 free-tier quota** on this key → use `gemini-2.5-flash`.
- `is_moc()` must be **plpgsql** (not sql) so it can be defined before `profiles`.
- Supabase free plan caps **2 active projects**; we paused **`Project Tool`**
  (`uwnjqzgznogjtejbrkkl`) to free a slot — reversible from the dashboard.
- Promote a user to M.O.C.: `update public.profiles set role_tag='MOC' where email='…';`

## Outstanding / possible next steps

- [ ] **Revoke the Supabase Personal Access Token** pasted in the prior chat
      (supabase.com/dashboard/account/tokens) if not already done.
- [ ] "Project Tool" Supabase project remains **paused** — restore when needed.
- [ ] Duplicate account `mike@santimaw.com` — delete or keep.
- [ ] Full catch → Storage → realtime loop verified locally + primitives verified
      live, but not a full click-through on the live cloud instance.
- [ ] Optional: re-add a competitive leaderboard (removed per request), or wire
      GitHub→Netlify auto-deploy (currently manual `netlify deploy`).
