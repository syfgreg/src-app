// HTTP-triggered backup — called by the app on key events (tournament ended,
// results published, Glory Fav published) and by the M.O.C.'s manual button.
// The daily cron lives in backup-daily.mjs; both share netlify/backup-core.mjs.
//
// ponytail: open endpoint (no auth). Worst case someone triggers an extra
// timestamped backup — harmless. Add a shared-secret header check if that ever
// matters.
import { runBackup } from "../backup-core.mjs";

export async function handler() {
  try {
    const summary = await runBackup();
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: true, ...summary }) };
  } catch (err) {
    return { statusCode: 500, headers: { "content-type": "application/json" }, body: JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }) };
  }
}
