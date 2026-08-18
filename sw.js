/* sw.js — offline support.

   The app shell is cached on install so the whole thing works on a plane, in a
   basement, or anywhere the signal dies. Calls to the Anthropic API are never
   cached and never intercepted — only the coach needs the network. */

const CACHE = 'plate-v2';

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/store.js',
  './js/engine.js',
  './js/recipes.js',
  './js/planner.js',
  './js/context.js',
  './js/ai.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // never touch the API

  // Cache first: this app has no server-side data, so a stale shell is never wrong.
  event.respondWith(
    caches.match(request).then(hit => {
      if (hit) {
        // Refresh in the background so the next launch has the newer file.
        fetch(request).then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(request)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
