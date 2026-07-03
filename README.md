# Sea Robin Classic — Official Tournament PWA

Mobile-first Progressive Web App for the Sea Robin Classic Surf Fishing Tournament
(S.R.C.S.F.T.). Live scoring, AI catch verification, the official record book, a
rules assistant, and the Memories Vault — built to keep working with zero bars on
the beach at Assateague.

## Two modes

- **Local-only** (no Supabase env vars): IndexedDB, per-device data, hand-rolled auth. Zero setup — just `npm run dev`. Demo M.O.C. login `moc@searobinclassic.com` / `searobin`.
- **Cloud** (Supabase env vars set): one shared live leaderboard, Supabase Auth (password + magic link), realtime broadcasts, photos in Storage, and AI behind a Netlify function. **See [DEPLOY.md](DEPLOY.md) for the full Netlify + Supabase setup.**

## Run it locally

```bash
npm install
npm run dev        # local-only mode (no backend needed)
npm run build      # production build -> dist/

# Cloud mode locally (needs .env.local — see .env.example):
netlify dev        # runs Vite + the AI function with your env vars
```

New anglers register in-app and start as **JAFNG (Rookie)**.

## What's inside

| Feature | Where | Notes |
|---|---|---|
| Auth & roster tags | Login screen, M.O.C. Panel → Roster | M.O.C., Grand Robin, The Champ (one at a time), Angler, JAFNG |
| Catch submission & scoring | Log Catch tab | Photo + species + inches + Bait/Lure; live point breakdown |
| Bait vs. Lure multiplier | Scoring engine | Lure adds bonus PPI (default +100, editable) |
| Skate Clause | Scoring engine | Wingtip-to-wingtip, M.O.C. baseline PPI |
| Trophy Fish Clause | Scoring engine | Gamefish over 24" (editable) flagged for M.O.C. measurement |
| Record Breaker detection | Scoring engine + Record Book | Seeded from the 2019 rulebook; approval rewrites the book |
| AI catch verification | Log Catch (needs API key) | Claude vision IDs the species & checks the tape measure |
| Rules Assistant | Rules AI tab | RAG over the official rulebook; offline mode quotes rules directly |
| Live notifications | Bell icon + Web Notifications | Broadcasts the second the M.O.C. verifies a fish |
| M.O.C. Admin panel | More → M.O.C. Panel | Approve/reject/rescore catches, roster roles, all scoring config |
| Glory Shots | More → Glory Shots | Off-season feed with comments |
| Memories Vault | More → Memories Vault | Real SRC 1999–2001 archive photos, searchable |
| Offline-first | Everywhere | IndexedDB ledger + service worker precache; installable PWA |

## AI

AI runs through the Netlify function `netlify/functions/ai.mjs`, which holds the
Anthropic key server-side (`ANTHROPIC_API_KEY` in the Netlify env) — **the key is
never shipped to the browser**. It powers:

- Vision verification of catch photos (species ID + measurement sanity check).
  High-confidence matches auto-approve; everything else queues for the M.O.C.
- The full conversational rules assistant.

Without the backend (local `npm run dev`, or offline), both fall back gracefully:
catches queue for manual M.O.C. review and the assistant quotes the rulebook
directly. Use `netlify dev` to exercise the function locally.

## Scoring defaults

The point values on the official scorecard are VOID in the source documents, so
the engine ships with editable defaults: Sea Robin 150 PPI, Game Tier 1
(Striped Bass, Red Drum, Black Drum, Sheepshead) 100 PPI, Game Tier 2 60 PPI,
trash fish 10 PPI, lure bonus +100 PPI, Trophy +500, Record Breaker +1000.
The M.O.C. can change every number in the admin panel.

## Architecture

- **Vite + React + TypeScript**, no router (single-file screen switch)
- **Supabase** (cloud mode) — Postgres source of truth with row-level security,
  Auth (password + magic link), Realtime (live board), and Storage (photos)
- **Dexie/IndexedDB** — local mirror the UI always reads from (offline-first),
  plus a write **outbox** that flushes to Supabase on reconnect
- **Netlify Function** — server-side Anthropic proxy; the API key never reaches
  the browser
- **vite-plugin-pwa** — installable, precached shell, runtime-cached photos

All entity primary keys are UUID strings shared between Supabase and the Dexie
mirror. When Supabase env vars are absent the app runs local-only and Dexie is
the source of truth.

Source layout: `src/domain` (scoring engine, rulebook, records),
`src/data` (`supabase` client, `db` Dexie mirror + outbox, `sync` pull/realtime/
flush, `repository` writes, `seed`), `src/ai` (Netlify function client),
`src/context` (auth), `src/pages`, `src/components`.
`supabase/schema.sql` provisions the backend; `netlify/functions/ai.mjs` is the
AI proxy.
