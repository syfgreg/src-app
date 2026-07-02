# Deploying Sea Robin Classic — Netlify + Supabase

The app runs in two modes automatically:

- **No Supabase env vars** → local-only mode (IndexedDB, per-device data, hand-rolled auth). Great for offline dev.
- **Supabase env vars set** → cloud mode: one shared leaderboard, Supabase Auth (password + magic link), realtime updates, photos in Storage, and AI through a server function.

Follow the steps below to go live in cloud mode.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com). **Pick a plan/settings that won't pause the project on inactivity** — free-tier projects pause after ~a week idle. (This is the thing that bit the portals last time; keep a schema export.)
2. In the dashboard: **SQL Editor → New query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and **Run**. That creates every table, RLS policy, the signup trigger, realtime publication, storage buckets, and seeds the settings + official records.
3. **Auth → Providers → Email**: for a small trusted roster you can turn **"Confirm email" off** so registration logs you straight in. Leave it on if you prefer confirmed emails (users then get a confirmation link, and magic-link login also works).
4. Grab **Project Settings → API → Project URL** and the **anon public** key.

## 2. Make yourself the M.O.C.

Sign up once in the app (see step 4), then in the Supabase SQL Editor:

```sql
update public.profiles set role_tag = 'MOC' where email = 'you@example.com';
```

Reload the app — you now have the M.O.C. Panel. Set other anglers' roles from **More → M.O.C. Panel → Roster**.

## 3. Deploy to Netlify

1. Push this folder to a Git repo and **Import** it in Netlify (or `netlify deploy`). Build settings come from [`netlify.toml`](netlify.toml) — build `npm run build`, publish `dist`, functions in `netlify/functions`.
2. **Site settings → Environment variables**, add:

   | Key | Value | Notes |
   |---|---|---|
   | `VITE_SUPABASE_URL` | your project URL | client-safe, ships in the bundle |
   | `VITE_SUPABASE_ANON_KEY` | anon public key | client-safe by design (RLS protects data) |
   | `ANTHROPIC_API_KEY` | `sk-ant-…` | **server only** — used by the function, never sent to the browser |

3. Trigger a deploy. Done — HTTPS, installable PWA, shared live board.

## 4. Local dev against the cloud

```bash
cp .env.example .env.local     # fill in the three values
netlify dev                    # runs Vite + the AI function locally with env
```

`netlify dev` is what makes AI verification work locally (it runs `netlify/functions/ai.mjs` with `ANTHROPIC_API_KEY`). Plain `npm run dev` skips the function, so AI falls back to manual review / offline rulebook — everything else (auth, realtime, storage) still works.

## How the pieces map

| Need | Handled by |
|---|---|
| Shared leaderboard / records / feed | Supabase Postgres + RLS |
| Live "fish approved" broadcast to every device | Supabase Realtime → OS/Web notification |
| Login + passwordless magic links | Supabase Auth |
| Catch & glory photos | Supabase Storage (public buckets) |
| Offline scoring on the beach | Dexie/IndexedDB mirror + write outbox, flushed on reconnect |
| AI vision + rules chat without leaking a key | Netlify Function (`ANTHROPIC_API_KEY` server-side) |

## Offline behavior

The UI always reads the local Dexie mirror, so the board, records, and vault work with no signal. Catches logged offline are scored instantly, held locally (photo included), and queued in an outbox that flushes to Supabase — uploading the photo and pushing the row — the moment the phone reconnects.
