const CACHE_NAME = 'mail-dashboard-pwa-v1';
const PRECACHE_URLS = [
  '/',
  '/sign-in',
  '/manifest.webmanifest',
  '/pwa-icon.svg',
  '/logo/og-image.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith('/api/')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedResponse = await caches.match('/');
        return cachedResponse || Response.error();
      })
    );
    return;
  }

  if (
    requestUrl.pathname.startsWith('/_next/static') ||
    requestUrl.pathname.startsWith('/_next/image') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|webmanifest)$/i.test(requestUrl.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        });
      })
    );
  }
});