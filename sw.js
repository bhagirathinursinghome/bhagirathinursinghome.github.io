// Bhagirathi Health Care — Service Worker
// ⚠️  IMPORTANT: Bump CACHE_VERSION every time you deploy changes!
//     e.g. v2 → v3 → v4 ...  This forces all users to get fresh files.
const CACHE_VERSION = 'v3';
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
  '/css/style.css',
  '/js/auth.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// ── Install: cache shell assets ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting(); // Activate new SW immediately, don't wait for tabs to close
});

// ── Activate: delete old caches, then tell ALL open tabs to reload ───────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        }))
      )
      .then(() => self.clients.claim()) // Take control of all open tabs
      .then(() => {
        // ✅ KEY FIX: Tell every open tab to reload so they get the new SW
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UPDATED' });
          });
        });
      })
  );
});

// ── Message handler: support admin-triggered force reload ────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'FORCE_RELOAD_ALL') {
    // Admin sent this from the Supabase realtime channel → relay to all tabs
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
    });
  }
});

// ── Fetch: smart caching strategy ───────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always go to network for Supabase API calls
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/rest/')) {
    return;
  }

  // Network-first for HTML pages (always fresh content)
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Network-first for JS and CSS (so updates are always picked up)
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for images and other static assets
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
