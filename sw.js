// Bhagirathi Health Care — Service Worker
// Version: bump this string to force cache refresh
const CACHE_NAME = 'bhc-v1';

// Core shell files to cache on install
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
  self.skipWaiting();
});

// ── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always go to network for Supabase API calls
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/rest/')) {
    return; // let browser handle normally
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

  // Cache-first for static assets (CSS, JS, images, fonts)
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
