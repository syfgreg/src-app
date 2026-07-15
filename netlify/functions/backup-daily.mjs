// Daily scheduled backup (runs at 00:00 UTC). Netlify scheduled functions can't
// be invoked over HTTP — the on-demand path is backup.mjs. Both share the same
// engine in netlify/backup-core.mjs.
import { runBackup } from "../backup-core.mjs";

export const config = { schedule: "@daily" };

export async function handler() {
  const summary = await runBackup();
  console.log("Daily backup complete:", JSON.stringify(summary));
  return { statusCode: 200 };
}
