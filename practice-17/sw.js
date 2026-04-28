const CACHE = 'ws-push-v1';
const ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.json', './content/home.html', './content/about.html'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('fetch', (event) => event.respondWith(caches.match(event.request).then((r) => r || fetch(event.request))));
self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: '', reminderId: null };
  if (event.data) data = event.data.json();
  const options = {
    body: data.body,
    icon: './icons/favicon-128x128.png',
    badge: './icons/favicon-48x48.png',
    data: { reminderId: data.reminderId },
  };
  if (data.reminderId) {
    options.actions = [{ action: 'snooze', title: 'Отложить на 5 минут' }];
  }
  event.waitUntil(self.registration.showNotification(data.title, options));
});
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'snooze') {
    const reminderId = event.notification?.data?.reminderId;
    event.waitUntil(fetch(`http://localhost:3001/snooze?reminderId=${reminderId}`, { method: 'POST' }));
  }
  event.notification.close();
});
