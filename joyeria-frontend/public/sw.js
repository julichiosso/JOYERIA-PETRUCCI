/**
 * public/sw.js — Service Worker de Petrucci Joyería
 *
 * Estrategia:
 *  - Assets estáticos de Next.js (/_next/static/) → Cache-first
 *  - Imágenes del CDN/S3 → Cache-first con límite de 60 entradas
 *  - API del catálogo (/catalog/) → Network-first (datos frescos primero)
 *  - Todo lo demás → Network-first con fallback a cache
 */

const CACHE_VERSION = 'petrucci-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

const MAX_IMAGE_CACHE = 60;
const MAX_API_CACHE = 30;

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/nosotros',
        '/offline',
        '/logo-petrucci-v2.svg',
      ]).catch(() => { /* páginas offline no críticas */ });
    })
  );
  self.skipWaiting();
});

// ── Activate: limpiar caches viejos ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('petrucci-') && k !== STATIC_CACHE && k !== IMAGE_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar GET
  if (request.method !== 'GET') return;

  // Assets estáticos de Next.js → Cache-first
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Imágenes → Cache-first con límite
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
  ) {
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, MAX_IMAGE_CACHE));
    return;
  }

  // API pública del catálogo → Network-first
  if (url.pathname.startsWith('/catalog/')) {
    event.respondWith(networkFirst(request, API_CACHE, MAX_API_CACHE));
    return;
  }

  // Todo lo demás (páginas HTML) → Network-first
  event.respondWith(networkFirst(request, STATIC_CACHE, 50));
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Sin conexión', { status: 503 });
  }
}

async function cacheFirstWithLimit(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      // Limpiar entradas excedentes (FIFO)
      const keys = await cache.keys();
      if (keys.length > maxEntries) {
        await cache.delete(keys[0]);
      }
    }
    return response;
  } catch {
    return new Response('Sin conexión', { status: 503 });
  }
}

async function networkFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      const keys = await cache.keys();
      if (keys.length > maxEntries) await cache.delete(keys[0]);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response('Sin conexión', { status: 503 });
  }
}
