// Sends a Web Push notification to every registered device. Called
// fire-and-forget from broadcast() (src/data/repository.ts) after any
// notification is written.
//
// ponytail: open endpoint (no auth), same accepted risk as backup.mjs.
// A shared secret can't actually gate this one — the caller is client-side JS
// (triggerPush() in src/data/push.ts), so any secret would ship in the public
// bundle and protect nothing. Real gating would need a server-only trigger
// path (e.g. a Postgres pg_net trigger instead of a client fetch) — upgrade
// to that if open-internet abuse of this endpoint ever becomes a problem.
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  let message;
  try {
    ({ message } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: "Invalid JSON body." };
  }
  if (!message) return { statusCode: 400, body: "Missing message." };

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } =
    process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, sent: 0, note: "push not configured" }) };
  }
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:admin@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: subs, error } = await supabase.from("push_subscriptions").select("*");
  if (error) return { statusCode: 500, body: JSON.stringify({ ok: false, error: error.message }) };

  const payload = JSON.stringify({ title: "Notification", body: message });
  const stale = [];
  let sent = 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) stale.push(s.id); // gone — device unsubscribed
      }
    }),
  );
  if (stale.length) await supabase.from("push_subscriptions").delete().in("id", stale);

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: true, sent, removed: stale.length }),
  };
}
