
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/db.js",
    "/styles.css",
    "/service-worker.js",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
  ];
  
  const PRECACHE = 'precache-v1';
  const RUNTIME = 'runtime';
  
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(RUNTIME).then((cache) => cache.add("/api/transaction/bulk"))
    );
    event.waitUntil(
      caches
        .open(PRECACHE)
        .then((cache) => cache.addAll(FILES_TO_CACHE))
        .then(self.skipWaiting())
    );
  });
  
  self.addEventListener("activate", (event) => {
    const currentCaches = [PRECACHE, RUNTIME];
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return cacheNames.filter(
            (cacheName) => !currentCaches.includes(cacheName)
          );
        })
        .then((cachesToDelete) => {
          return Promise.all(
            cachesToDelete.map((cacheToDelete) => {
              return caches.delete(cacheToDelete);
            })
          );
        })
        .then(() => self.clients.claim())
    );
  });
  
  self.addEventListener("fetch", (event) => {
    if (
      event.request.url.startsWith(self.location.origin) ||
      event.request.method !== "GET"
    ) {
      event.respondWith(fetch(event.request));
      return;
    }
  
    if (event.request.url.includes("/api/transaction/bulk")) {
      event.respondWith(
        caches.open(RUNTIME).then((cache) => {
          return fetch(event.request).then((response) => {
            return cache
              .put(event.request, response.clone())
              .then(() => {
                return response;
              })
              .catch(() => caches.match(event.request));
          });
        })
      );
      return;
    }
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
  
        return caches.open(RUNTIME).then((cache) => {
          return fetch(event.request).then((response) => {
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  });