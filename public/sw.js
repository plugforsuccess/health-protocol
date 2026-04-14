/* Rest-timer Service Worker — handles Web Push events. */

self.addEventListener('install', (event) => {
  // Activate immediately on first install so the very first push works.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Rest timer done', body: 'Next set ready.' };
  }

  const title = payload.title || 'Rest timer done';
  const options = {
    body: payload.body || 'Next set ready.',
    tag: payload.tag || 'rest-timer',
    renotify: true,
    requireInteraction: false,
    icon: payload.icon,
    badge: payload.badge,
    vibrate: [1500, 100, 1500, 100, 1500, 100, 1500],
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});
