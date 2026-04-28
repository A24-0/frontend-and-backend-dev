const APP_SHELL = 'app-shell-v1';
const DYNAMIC = 'dynamic-content-v1';
const SHELL_ASSETS = [
  './', './index.html', './style.css', './app.js', './manifest.json',
  './content/home.html', './content/about.html',
  './icons/favicon-16x16.png', './icons/favicon-32x32.png', './icons/favicon-48x48.png',
  './icons/favicon-64x64.png', './icons/favicon-128x128.png', './icons/favicon-192x192.png',
  './icons/favicon-256x256.png', './icons/favicon-512x512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_SHELL).then((cache) => cache.addAll(SHELL_ASSETS)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![APP_SHELL, DYNAMIC].includes(k)).map((k) => caches.delete(k))))
  );
});
self.addEventListener('fetch', (event) => {
  const { pathname, origin } = new URL(event.request.url);
  if (origin !== self.location.origin) return;
  if (pathname.includes('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          const cloned = networkRes.clone();
          caches.open(DYNAMIC).then((cache) => cache.put(event.request, cloned));
          return networkRes;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./content/home.html')))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
