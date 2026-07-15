// Web Push handler, imported into the generated service worker via
// vite.config.ts's workbox.importScripts. Runs even when the app is fully
// closed — this is what makes push notifications work on an installed PWA.
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Notification", {
      body: data.body || "",
      icon: "/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
