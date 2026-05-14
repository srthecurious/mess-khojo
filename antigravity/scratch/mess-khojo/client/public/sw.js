// A basic service worker to satisfy PWA installability requirements
const CACHE_NAME = 'messkhojo-cache-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Empty fetch handler to bypass service worker interception
    // and let the browser handle requests normally.
});
