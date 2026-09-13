/* sw.js — offline support.

   The app shell is cached on install so the whole thing works on a plane, in a
   basement, or anywhere the signal dies. Calls to the Anthropic API are never
   cached and never intercepted — only the coach needs the network. */

const CACHE = 'plate-v5';

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
  './js/path.js',
  './js/health.js',
  './js/foods.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // cache: 'reload' skips the HTTP cache, so a new worker never fills
      // itself with the previous version's files.
      .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
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

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/* Network first while online, cache when not. The app has no server-side
   data, so the only thing the network is for is picking up a new version —
   and when it is there, it should show up on the next launch, not the one
   after. */
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // never touch the API

  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
  );
});
