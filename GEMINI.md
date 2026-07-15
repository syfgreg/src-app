# Sea Robin Classic — agent context

**Read `SRCSFT_APP.md` first.** It is the full app + developer handoff (stack, architecture, repo map, data flow, where-to-change-things). This file is only the short "don't break these" list.

## Project in one line
Mobile-first, invite-only React + TS PWA for a surf-fishing tournament. Vite build, Supabase (cloud) + Dexie/IndexedDB (local mirror + offline outbox), Netlify Functions, Google Gemini for AI. Ships via `netlify deploy --build --prod`.

## Rules for edits
- **`src/domain/` is pure logic** — no I/O, immutable transforms (return new objects, never mutate inputs). Scoring/standings/records live here and are code-driven, NOT editable at runtime.
- **Scoring rounds every measurement DOWN to the nearest ¼"** (`floorToQuarter`) at all write sites. Preserve this.
- **UI never calls Supabase directly.** Read/write through `src/data/repository.ts`; sync/realtime/outbox live in `src/data/sync.ts`.
- **Routing is a string** — `screen` state in `App.tsx` + `TabBar.tsx`. No router library.
- **Secrets:** only the Supabase *anon* key may reach the client. Gemini key + service role + Google OAuth are server-only, used from `netlify/` — never `VITE_`-prefixed.
- **Dexie schema** in `src/data/db.ts` is versioned — add tables additively with a new version block. Postgres changes = new `supabase/migration-*.sql` + `schema.sql`, then run on live.
- **No test framework yet.** Add non-trivial logic in `domain/` with a `*.test.ts` if you introduce tests (vitest).

## Verify before claiming done
```bash
npm run build            # tsc -b && vite build (typecheck included)
```
Deploy is the only ship path: `netlify deploy --build --prod`. The PWA service worker caches hard — fully close/reopen the installed app to see a new build.

## Local dev
Leave `VITE_SUPABASE_*` unset → local-only IndexedDB mode, demo login `moc@searobinclassic.com` / `searobin`. For AI/backup functions locally use `netlify dev` with `GEMINI_API_KEY` set.
