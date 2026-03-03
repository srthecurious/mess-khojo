// A basic service worker to satisfy PWA installability requirements
const CACHE_NAME = 'messkhojo-cache-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Simple fetch handler - network first, then cache
    // This is just to satisfy the PWA requirement, not true offline mode
    event.respondWith(
        fetch(event.request).catch(function () {
            return caches.match(event.request);
        })
    );
});
