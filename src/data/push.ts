import { cloudEnabled, supabase } from "./supabase";

/** VAPID public keys are base64url; PushManager wants a raw Uint8Array. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Register this device for Web Push. Called after the user grants
 * notification permission (see Header.tsx). Safe to call repeatedly —
 * reuses an existing subscription if one is already active on this device.
 */
export async function subscribeToPush(userId: string): Promise<void> {
  if (!cloudEnabled || !supabase) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey) return; // push not configured on this deployment yet

  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    }));

  const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await supabase
    .from("push_subscriptions")
    .upsert({ user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: "endpoint" });
}

/**
 * Fire-and-forget: ask the server to push this message to every registered
 * device. Mirrors triggerBackup() — never throws, never blocks the caller.
 */
export function triggerPush(message: string): void {
  if (!cloudEnabled) return;
  fetch("/.netlify/functions/send-push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
  }).catch(() => {});
}
