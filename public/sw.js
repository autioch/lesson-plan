/* Offline caching for the lesson plan — a school schedule people check on
 * phones inside a building where the signal is poor. The site is a static
 * Astro build on GitHub Pages, so there is no server to lean on: this worker
 * is the whole offline story.
 *
 * Strategy, by what the request is:
 *   - a page navigation -> network-first with a short timeout, cache fallback.
 *     The network fetch bypasses the HTTP cache (see navigationFirst), so any
 *     load on a real connection — a reload or a re-open — gets the freshly
 *     published plan and updates our cache; on a poor or dead one it falls back
 *     to the last page seen. That is the "online fetches the new one, offline
 *     still shows the old one" the request asks for.
 *   - a hashed /_astro/ asset -> cache-first. The filename carries a content
 *     hash, so a cached copy can never be stale and a new build ships new names.
 *   - anything else same-origin (favicon, manifest) -> stale-while-revalidate:
 *     serve the cached copy at once, refresh it in the background.
 *
 * Nothing is precached: the cache fills from what the visitor actually loads
 * while online, which for a two-page site is the whole app after one visit.
 * That keeps the worker free of the build's hashed filenames — no manifest to
 * regenerate, no version to bump on every deploy. Bump CACHE only when this
 * worker's own logic changes; activate then drops the older cache.
 */

const CACHE = "lesson-plan-v1";
const BASE = new URL("./", self.location).href; // https://host/lesson-plan/
const NAV_TIMEOUT_MS = 4000;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // The browser fetches the worker script itself out of band; never serve it
  // from our cache, or a new deploy could be shadowed by an old worker.
  if (url.pathname.endsWith("/sw.js")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationFirst(request));
  } else if (url.pathname.includes("/_astro/")) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function navigationFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    // Bypass the browser's HTTP cache. GitHub Pages serves pages with a short
    // max-age, so a plain fetch could be answered from that cache and miss a
    // just-published plan — "network-first" only means "fresh when online" if
    // it reaches the origin. A reload already bypasses it; this extends the
    // same freshness to a re-open, which matters in the weeks a plan changes
    // often. The offline fallback below is our own cache, not the HTTP one, so
    // it is untouched by this.
    const fresh = await withTimeout(
      fetch(request, { cache: "no-store" }),
      NAV_TIMEOUT_MS,
    );
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match(BASE)) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh.ok) cache.put(request, fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => cached);
  return cached || network;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
