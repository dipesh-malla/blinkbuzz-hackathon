/* BlinkBuzz service worker: makes repeat visits load almost instantly.
 *
 *  pages (HTML)                   network first, cached copy if offline or slow (> 3.5 s)
 *  /assets/* (hashed JS, CSS, fonts)  cache first: the file name changes whenever the content does
 *  icons, demo art, share image   cached, refreshed in the background
 *  uploaded images (Supabase storage)  cache first (an upload never changes under the same name)
 *  Google Fonts                   cached, refreshed in the background
 *  Supabase data, login, functions  never cached here (the app keeps its own fresh copy)
 */
const VERSION = 'bb-v1';
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const MEDIA = `${VERSION}-media`;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(PAGES).then((c) => c.add(new Request('./', { cache: 'reload' })).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

async function cacheFirst(req, name, max) {
  const c = await caches.open(name);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') {
    c.put(req, res.clone()).then(() => trim(name, max));
  }
  return res;
}

async function staleWhileRevalidate(req, name, max, event) {
  const c = await caches.open(name);
  const hit = await c.match(req);
  const fresh = fetch(req)
    .then((res) => {
      if (res.ok || res.type === 'opaque') c.put(req, res.clone()).then(() => trim(name, max));
      return res;
    })
    .catch(() => hit);
  if (hit) {
    event.waitUntil(fresh);
    return hit;
  }
  return fresh;
}

async function page(event) {
  const c = await caches.open(PAGES);
  const network = (async () => {
    const pre = await event.preloadResponse;
    const res = pre || (await fetch(event.request));
    if (res.ok) c.put(event.request, res.clone());
    return res;
  })();
  try {
    return await Promise.race([network, new Promise((_, no) => setTimeout(() => no(new Error('slow')), 3500))]);
  } catch {
    return (await c.match(event.request)) || (await c.match('./')) || network;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      if (url.pathname.startsWith('/admin')) return; // admin always straight from the network
      return event.respondWith(page(event));
    }
    if (url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirst(req, ASSETS, 120));
    if (/\.(png|svg|webp|jpg|ico|webmanifest)$/.test(url.pathname)) return event.respondWith(staleWhileRevalidate(req, ASSETS, 120, event));
    return;
  }

  if (url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/public/')) {
    return event.respondWith(cacheFirst(req, MEDIA, 150));
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    return event.respondWith(staleWhileRevalidate(req, ASSETS, 120, event));
  }
});
