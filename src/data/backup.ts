import { cloudEnabled } from "./supabase";

/**
 * Fire-and-forget: ask the server to write a timestamped backup + results export
 * (Supabase Storage + Google Drive). Called on tournament milestones and from the
 * M.O.C.'s manual button. No-op in local-only mode (there's no server function).
 * Never throws — a failed backup must never block the user action that triggered it.
 */
export function triggerBackup(): void {
  if (!cloudEnabled) return;
  fetch("/.netlify/functions/backup", { method: "POST" }).catch(() => {});
}
