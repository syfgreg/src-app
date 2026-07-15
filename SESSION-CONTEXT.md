# Sea Robin Classic — Session Handoff

Paste into a new Claude Code session to continue. State as of **2026-07-14**. No secrets here (they live in Netlify + Supabase dashboards, and in `.env.local` which is gitignored).

## What it is
Mobile-first, invite-only PWA for an annual surf-fishing tournament. Live scoring, AI catch verification + a rules/Q&A assistant ("SRC AI"), records, roster, career accolades, Glory Shots + a "Glory Shot Fav" vote, weather/beach report, Web Push notifications, and a full M.O.C. admin panel.

- **Dir:** `C:\dev\sea-robin-classic` (Windows machine, PowerShell/Git Bash)
- **Live:** https://sea-robin-app.netlify.app (installable PWA) — **this is Greg's own site, not Mike's**
- **⚠️ Do NOT confuse with `sea-robin-classic.netlify.app`** — that's Mike's original, unrelated site on his own separate Supabase project. Testing there wastes time and causes phantom-account confusion (already happened once — see Gotchas below).
- **Deploy:** `netlify deploy --build --prod` from the project dir.
- **⚠️ Standing instruction: bump `package.json`'s `version` before every deploy** — patch (`1.1.0` → `1.1.1`) for fixes/config, minor (`1.1.0` → `1.2.0`) for real new features. Current version: **1.1.0**. The login screen shows it (`v{pkg.version}`, imported straight from `package.json` in `src/pages/LoginPage.tsx`) so anyone can confirm what build they're on.
- **git remote** (`origin`) still points at `https://github.com/MSantimaw/sea-robin-classic.git` (Mike's GitHub). Nothing has ever been pushed there this migration — all work so far is local-only / deployed straight via Netlify CLI. Greg was asked if he wants his own GitHub repo + repointed remote and said "hold that thought" — unresolved, revisit if asked.
- **Design context:** `.impeccable.md` (dark-default, Bricolage Grotesque / Hanken Grotesk, ocean-teal accent `--flare`, **gold reserved for honors**, ceremonial-rugged-wry tone). No `PRODUCT.md`/`DESIGN.md` yet — `/impeccable init` was started but the strategic-questions round was dismissed, so it's still pending.

## Account migration — off Mike's accounts, onto Greg's own
- **Supabase:** project ref `smgpiurruamrvxlvlxoh`, region us-east-2. `schema.sql` (includes all migrations folded in) is current on live. Mike's old project (`rowjbjdhvakepcvufavs`) is untouched and unused by this app.
- **Netlify:** site `sea-robin-app`. Env vars set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus the new VAPID push vars (see below).
- **Gemini AI key:** Greg's own. `netlify/functions/ai.mjs` uses `gemini-flash-lite-latest` (an auto-updating alias) after the original hardcoded `gemini-2.5-flash` turned out deprecated for new accounts.
- **Data import:** `searobin-import-package/` (import.sql + verify.sql + photos/) kept in the project folder (gitignored). `import.sql` is idempotent, email-keyed. **Re-run it any time more anglers register** to backfill their catches/glory pics.
- **Roster / invites:** **10 registered, 19 pending invites** (as of this save). Registered: Greg Hudson (MOC), Eric Keresty (MOC), Jerome Garcia (MOC), Mike Santimaw (MOC), Steve O aka Sputnik (ANGLER), Christian Vlot, Derek Hall, Phill Hall, Stu Bish, and one more recent registration. The 19 pending invites include the original roster stragglers plus **16 historic Hall-of-Fame anglers** added as ANGLER-role invites (everyone from `src/domain/accolades.ts`'s 34-person career file who wasn't already registered/invited and wasn't on Greg's "Inactive Anglers" exclusion list: Mason Keresty, Nick Insley, Tony Marandola, John Dinlocker, Kevin Tumola, Ken Thompson, Carlo Gambone, Mike Hurrell, Chris Coughlin, Karlos Gutierrez). Will Koth has **two** active invites intentionally (`wok451167@gmail.com` and `wok451@aol.com`) — same person, unclear which email he'll actually use, both left open on purpose.
- **M.O.C. role:** Greg Hudson, Eric Keresty, Jerome Garcia, and Mike Santimaw all hold `MOC` (intentional, multiple admins). Only William Koth was demoted from MOC to ANGLER during the roster review.
- **Email/SMTP:** Supabase's built-in sender rate-limits hard. Custom SMTP via Resend hit its sandbox restriction (can only email the account owner). **Switched to SendGrid instead** (single-sender verification, no domain needed) — confirm this fully landed if picking back up. Also, **"Confirm email" was toggled OFF** in Supabase Auth (Greg confirmed this is done) — registration no longer needs email at all; only password resets still depend on working SMTP.
- Google Drive backup (original migration Step 8) was **explicitly aborted**. Supabase-Storage backup (JSON + CSVs) works standalone and is sufficient.

## Web Push notifications — built from scratch this session
Greg asked for this after an earlier session (with a different, since-corrected assumption that it was "already built") was aborted. It's now real:
- `public/push-sw.js` — push + notificationclick handlers, wired into the generated service worker via `vite.config.ts`'s `workbox.importScripts: ["push-sw.js"]`.
- `supabase/migration-push.sql` (+ folded into `schema.sql`) — `push_subscriptions` table (user_id, endpoint, p256dh, auth), RLS scoped to each device's own row.
- `src/data/push.ts` — `subscribeToPush(userId)` (called from `Header.tsx`'s bell-tap handler once `Notification.permission === "granted"`) and `triggerPush(message)` (fire-and-forget, mirrors `triggerBackup()`).
- `src/data/repository.ts`'s `broadcast()` now calls `triggerPush()` after every notification write.
- `netlify/functions/send-push.mjs` — sends via the new `web-push` dependency, auto-prunes dead subscriptions (404/410).
- **Deliberate simplification:** no `PUSH_SECRET` gate — since the trigger is client-side JS, a secret would ship in the public bundle and protect nothing real. Open endpoint, same accepted risk as `backup.mjs`. Upgrade path noted in a `ponytail:` comment in `send-push.mjs` if it's ever needed (would require a server-only trigger, e.g. a Postgres `pg_net` trigger instead of the client fetch).
- **VAPID keys generated and set** on Netlify (`VITE_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:syfgreg@gmail.com`) and in `.env.local` for local dev. Migration run on live DB, confirmed via `pg_policies` query. Deployed.
- **Not yet confirmed:** Greg was mid-testing on his iPhone (install to home screen, allow notifications, trigger a broadcast) when this save happened. If picking back up: check `push_subscriptions` for a row, and debug via the usual (PWA cache, wrong site, etc.) if nothing arrived.

## Bugs found + fixed this session
- **M.O.C. couldn't log catches** (`SubmitCatchPage.tsx`): roster check didn't exempt M.O.C. the way the live board already did. Fixed.
- **Couldn't publish a tournament with zero catches** (`AdminPage.tsx`): `allValidated` required `anglerIds.length > 0`. Fixed to treat zero catches as vacuously validated.
- **Stale "Our Tournament has Ended!" banner** on a freshly-started LIVE tournament (`ScorecardPage.tsx`): the banner only checks `settings.gloryFavState === "OPEN"`, and `startNewTournament()` never reset that flag from the previous tournament cycle. Fixed `startNewTournament()` to reset `gloryFavState: "OFF"`; also manually cleared the stale flag on the live DB for the tournament that already had it.
- **Contrast fix (from an `/impeccable polish` pass):** `--sand-faint` failed WCAG AA (~2.3–3.6:1) against every background it's used on, in both themes — used in ~50+ places app-wide for muted/tertiary text. Fixed by adjusting the token itself (dark `#626b78`→`#89919d`, light `#97a0ad`→`#5f6775`), landing ~5:1 in both themes. One root-token fix instead of 50+ edits.
- **Removed** the "M.O.C. demo login" credential line from the bottom of the login screen (leftover from local-only-mode docs, shouldn't be user-facing).
- **Added** a "Downloads" list under M.O.C. Panel → Tournament → Backup & Export Now (signed-URL links to files in the `backups` Storage bucket, 1-hour expiry) — needed a new storage RLS policy (`migration-backups-storage.sql`).
- **Added** a version number to the bottom of the login screen (`v{pkg.version}` from `package.json`).

## Non-bugs clarified this session (don't re-investigate these)
- **Why only 5 people show in the tournament participant picker**: M.O.C.-tagged users are deliberately excluded from that picker (`AdminPage.tsx`), but can still log catches/fish via the roster-bypass already in `SubmitCatchPage.tsx`/`ScorecardPage.tsx`.
- **Why M.O.C. gets notified about his own catches**: intentional — `broadcast()` is a shared feed, not a personalized one; every device including the sender's gets the OS push via realtime echo.
- **Offline-outbox + device-sharing edge case**: `logout()` never clears local Dexie/outbox. If someone logs a catch offline then hands the phone to someone else before reconnecting, that queued write fails RLS under the new session and stays stuck until the original person logs back in on that device. Rare, not fixed (documented only).
- **Shiner badge**: pewter/tarnished "anti-badge" (`v-shiner` variant in `index.css`, fish icon), shown for any angler with `shinerSeasons(a) > 0`. 33 of 34 Hall-of-Famers have at least one (only Steve Opsitnick doesn't — just 1 year played, and he scored).

## Gotchas hit this session (so you don't re-debug them)
- **`sea-robin-classic.netlify.app` vs `sea-robin-app.netlify.app`** — easy to confuse; caused a long debugging detour once already (phantom "Jerome Garcia" M.O.C. login was real, just on Mike's *other* site).
- **PWA caches hard** — after every deploy, fully close and reopen an installed instance (not just refresh).
- **`remoteWrite`'s `queueOnFail: false` pattern** (`upsertTournament`/`deleteTournament` in `repository.ts`) silently drops failed writes, zero error shown, zero retry. If a tournament/roster action seems to vanish with no trace, check for a plain client-side validation block (e.g. a disabled button, a taken-year guard) before assuming it's a sync bug — this has been the actual cause every time so far this session.
- Google's Gemini API key format changed after Jan 2026 (`AQ.xxxx`, not `AIzaSy...`). Don't trust stale training knowledge on API formats — test empirically against the live API first.
- The Claude Code mobile app's session screen shows the git remote owner/repo (`MSantimaw/sea-robin-classic`) — that's just `origin`, not a sign anything was pushed to Mike's account.

## Stack / architecture
Vite + React 18 + TS, `vite-plugin-pwa`. **Dual-mode data:**
- **Cloud** (Supabase env set): Postgres = source of truth (RLS, Auth, Realtime, Storage). Dexie/IndexedDB = local mirror the UI always reads + an offline write **outbox**. `pullAll` reconciles deletions.
- **Local** (no env): Dexie is truth, demo login `moc@searobinclassic.com` / `searobin`.
- **AI:** Netlify function `netlify/functions/ai.mjs` → Google **Gemini** (`gemini-flash-lite-latest`), `GEMINI_API_KEY` server-side only.
- **Push:** see Web Push section above.
- Local dev: `npm run dev` (port 5174, forced via `.claude/launch.json`). Cloud-mode local testing incl. AI/backup/push functions: `netlify dev` (port 8888).

## Scoring (code-driven, NOT M.O.C.-editable)
`src/domain/scoring.ts` (per-fish), `standings.ts` (per-angler), `records.ts`.
- Banded PPI: Sea Robin 500 · Tier1 (Striped Bass, Flounder, Red Drum) <18"→120/≥18"→200 · Tier2 <13"→50/13–<18"→100/≥18"→120 · Trash <12"→20/12–<17"→30/≥17"→50.
- **Every measurement rounds DOWN to the nearest ¼"** before scoring (`floorToQuarter`, applied at all write sites).
- Bonuses (+100 PPI×len): Lure, Trophy, Record Breaker. Full Monty = flat +1000. Trash-3 cap + tie-breaks in standings.ts.
- **M.O.C. can score/fish like anyone else but never places or wins** (prize-rank counter skips M.O.C.-tagged users in `ScorecardPage.tsx`/`ResultsPage.tsx`). Can still set official records (explicit decision — left as-is).
- Records finalize at Publish; also rewritten when a record-breaker is approved in Scorecard review.

## Career data — `src/domain/accolades.ts` (34 anglers, auto-generated from a career spreadsheet)
`HALL_OF_FAME: Accolade[]`. `history: [year, SeasonResult][]` where a `SeasonResult` is points (0 = **Shiner**), or **"DQ"**/**"ABD"** (NOT Shiners, and they break streaks). 25 of 34 have an email on record; 9 are name-only (pre-digital or never had an account).
- **Shiner Club President** = each year's current Shiner with the longest active streak; ties → most-recent prior President → M.O.C. ruling.

## SRC AI (`src/pages/RulesPage.tsx`, `src/domain/rules.ts`, `netlify/functions/ai.mjs`)
Tab labeled **"SRC AI"**, grounded in `rules.ts`. Easter eggs (Derek Clause, Sandimas Cheeseburger Phenomenon, 3-Room Vacation Home) — SHORT & punchy, never in "Try asking" chips.

## M.O.C. Panel (`src/pages/AdminPage.tsx`)
Tabs: **Tournament · Current Scorecards · Glory Fav · Roster · Scoring & AI**.
- **Tournament:** lifecycle stepper; **Start a new tournament** (participant picker excludes M.O.C.-tagged users on purpose, forces an unused year, now resets Glory Fav state too); **Past Tournaments**; **Backup & Export Now** + **Downloads** list.
- **Roster:** unified list incl. every registered profile + historic/non-login names (`settings.roster_overrides`, currently empty on this project — Mike's old INACTIVE overrides weren't recreated here).
- **Glory Fav:** curate ballot, publish/close/publish-results/clear votes.

## Netlify functions
- `netlify/functions/ai.mjs` — Gemini (verify + rules).
- `netlify/backup-core.mjs` (engine) + `functions/backup.mjs` (HTTP) + `functions/backup-daily.mjs` (`@daily` cron) — Supabase Storage backup (working); Google Sheet → Drive (not configured, aborted).
- `netlify/functions/send-push.mjs` — Web Push sender (new this session).

## Supabase migrations (in `supabase/`)
All folded into `schema.sql` for fresh installs: `migration-glory-fav.sql`, `migration-inactive-role.sql`, `migration-roster-overrides.sql`, `migration-2026-records.sql`, `migration-penalties.sql`, `migration-tournaments-invites.sql`, `migration-backups-storage.sql`, and the new `migration-push.sql`.

## ⏳ OUTSTANDING
1. **Confirm push notifications actually work** — Greg was mid-test on his iPhone. Check `push_subscriptions` for rows; debug if nothing arrived.
2. **Confirm the SendGrid SMTP switch fully landed** (verified sender, API key set in Supabase SMTP settings) — last known state was "switched to SendGrid" but not re-verified end-to-end since.
3. **Backfill remaining anglers** — re-run `searobin-import-package/import.sql` each time someone new registers (many historic invites now pending; expect a wave of backfills as they trickle in).
4. Decide on git: create Greg's own GitHub repo and repoint `origin`? ("Hold that thought" — unresolved.)
5. Once fully rolled out: tell Mike to point everyone at the new URL; remind everyone the PWA caches hard.
6. `/impeccable init` was started — PRODUCT.md/DESIGN.md still don't exist.
7. Optional/deferred: Google Drive backup, roster_overrides recreation for historic INACTIVE anglers.

## Run / verify
- Deploy is the verify path: `netlify deploy --build --prod` (bump `package.json` version first — see standing instruction above). Typecheck: `npx tsc --noEmit`. Build: `npx vite build`.
- Local dev ports: `npm run dev` → 5174, `netlify dev` → 8888 (both in `.claude/launch.json`).
- Direct DB access: `supabase link --project-ref smgpiurruamrvxlvlxoh` (already linked), then `supabase db query --linked "<sql>"` — no DB password needed, uses the authenticated CLI session via the Management API.
