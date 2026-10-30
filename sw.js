// Bhagirathi Health Care — Service Worker
// Works together with assets/updater.js (admin "Publish Update" button).
// You NO LONGER need to bump CACHE_VERSION on every deploy: HTML/JS/CSS are
// always fetched fresh from the network (bypassing the browser HTTP cache),
// and the Publish Update popup wipes caches on each user's device.
// Only bump CACHE_VERSION if you change THIS file's caching logic or SHELL_ASSETS.
const CACHE_VERSION = 'v4';
const CACHE_NAME = `bhc-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/webapp/index.html',
  '/webapp/app.html',
  '/webapp/assets/style.css',
  '/webapp/assets/auth.js',
  '/webapp/assets/menu.js',
  '/webapp/assets/page.js',
  '/webapp/assets/config.js',
  '/webapp/assets/updater.js',
  '/css/style.css',
  '/js/auth.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ── Install: cache shell assets (one missing file will NOT break install) ────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        SHELL_ASSETS.map(url =>
          // cache: 'reload' bypasses the browser HTTP cache so we store fresh copies
          fetch(new Request(url, { cache: 'reload' }))
            .then(res => (res.ok ? cache.put(url, res) : null))
            .catch(err => console.warn('[SW] Skip precache:', url, err))
        )
      )
    )
  );
  self.skipWaiting(); // Activate new SW immediately
});

// ── Activate: delete old caches, tell open tabs to reload ONLY on a real update
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      const oldKeys = keys.filter(k => k !== CACHE_NAME);
      await Promise.all(oldKeys.map(k => caches.delete(k)));
      await self.clients.claim();

      // Only notify when an older cache existed (= a genuine SW update).
      // Skips: first-time install, and the Publish Update flow (which already
      // wiped caches and reloads itself) → no double reload.
      if (oldKeys.length > 0) {
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }));
      }
    })
  );
});

// ── Messages from pages ──────────────────────────────────────────────────────
self.addEventListener('message', event => {
  const type = event.data && event.data.type;

  if (type === 'FORCE_RELOAD_ALL') {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
    });
  }

  // Optional: pages can ask the SW to wipe every cache
  if (type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    );
  }
});

// ── Push: show a notification when the server pushes one ─────────────────────
// Delivered by the push service as soon as the phone is online, even if the
// app is closed. (Separate from the Publish Update / SW_UPDATED logic above.)
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { title: 'Bhagirathy Nursing Home', body: event.data ? event.data.text() : '' }; }

  const title = data.title || 'Bhagirathy Nursing Home';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.id || undefined,          // same id = replaces instead of stacking
    data: { url: data.url || '/webapp/app.html', id: data.id || null },
    vibrate: [100, 50, 100]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Click: open the app (or focus it if already open) ────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || '/webapp/app.html',
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) {
        if (c.url.includes('/webapp/') && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});

// ── Helpers ──────────────────────────────────────────────────────────────────
// Fetch fresh from the server, skipping the browser's HTTP cache.
// (GitHub Pages sends max-age=600, which is why users saw stale files.)
const fetchFresh = request => fetch(request, { cache: 'no-store' });

// Cache key without ?v=123 query strings, so the cache doesn't fill with copies
const cacheKeyFor = request => {
  const u = new URL(request.url);
  if (u.origin !== self.location.origin) return request;
  return new Request(u.origin + u.pathname);
};

function networkFirst(request) {
  const key = cacheKeyFor(request);
  return fetchFresh(request)
    .then(res => {
      if (res && res.ok && res.type !== 'opaque') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(key, clone));
      }
      return res;
    })
    .catch(() => caches.match(key).then(hit => hit || caches.match(request, { ignoreSearch: true })));
}

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET over http(s); let everything else pass through
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Always go straight to network for Supabase API calls
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/rest/')) return;

  // Network-first for pages. IMPORTANT: your module pages load inside an
  // <iframe>, whose destination is 'iframe' (not 'document'). The old code
  // sent those to cache-first, so they stayed stale. Now they're covered.
  if (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.destination === 'iframe'
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network-first for JS, CSS, manifest
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for images, fonts and other static assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return res;
      });
    })
  );
});
