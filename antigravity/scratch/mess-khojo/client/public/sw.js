// A production-grade PWA Service Worker with Stale-While-Revalidate and Network-First caching strategies.
const CACHE_NAME = 'messkhojo-cache-v2';
const STATIC_CACHE = 'messkhojo-static-v2';
const IMAGE_CACHE = 'messkhojo-images-v2';
const SHELL_CACHE = 'messkhojo-shell-v2';

// Assets to pre-cache on service worker install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear any old/deprecated cache scopes
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (
            key !== CACHE_NAME &&
            key !== STATIC_CACHE &&
            key !== IMAGE_CACHE &&
            key !== SHELL_CACHE
          ) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Do not intercept database requests, auth calls, analytical hooks, or server API routes
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('google-analytics.com') ||
    url.hostname.includes('analytics.google.com') ||
    url.hostname.includes('facebook.com') ||
    url.hostname.includes('facebook.net') ||
    url.hostname.includes('clarity.ms') ||
    url.pathname.startsWith('/.netlify/functions/')
  ) {
    return;
  }

  // 3. Navigation requests: Network-First strategy (fallback to offline index.html shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => {
            cache.put('/index.html', responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 4. Static assets (JS, CSS, static JSON configs, external fonts): Cache-First / Stale-While-Revalidate
  if (
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.json') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Background fetch to update the static cache if updated
          fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, networkResponse));
            }
          });
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Image assets (listing posters, local layout images, Firebase Storage objects): Stale-While-Revalidate
  if (
    request.destination === 'image' ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.hostname.includes('firebasestorage.googleapis.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
              const responseClone = networkResponse.clone();
              caches.open(IMAGE_CACHE).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
