// Only public static files are cached. API responses and authentication stay online.
const CACHE_PREFIX = "oman-debates-";
const CACHE_NAME = `${CACHE_PREFIX}static-v2`;
const base = self.registration.scope;
const offlineUrl = new URL("offline.html", base).href;
const publicFiles = ["offline.html", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]
  .map((file) => new URL(file, base).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(publicFiles)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Never intercept API calls, including direct navigation to an API endpoint.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match(offlineUrl)) || Response.error()
    ));
    return;
  }

  if (!publicFiles.includes(url.href)) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
