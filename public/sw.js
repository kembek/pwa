const staticCacheName = "site-static-v8";
const dynamicCacheName = "site-dynamic-v11";
const assets = [
  "/",
  "/index.html",
  "/js/app.js",
  "/js/materialize.min.js",
  "/js/ui.js",
  "/css/materialize.min.css",
  "/css/styles.css",
  "/img/dish.png",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2",
  "/pages/fallback.html"
];
const FALLBACK_PAGE = "/pages/fallback.html";

// limit cache size
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

// install service worker
self.addEventListener("install", evt => {
  console.log("service worker has been installed");
  evt.waitUntil(
    caches.open(staticCacheName).then(cache => cache.addAll(assets))
  );
});

// activate service worker
self.addEventListener("activate", evt => {
  console.log("service worker has been activated");
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== staticCacheName && key !== dynamicCacheName)
          .map(key => caches.delete(key))
      );
    })
  );
});

// fetch event
self.addEventListener("fetch", evt => {
  if (!evt.request.url.includes("firestore.googleapis.com")) {
    evt.respondWith(
      caches
        .match(evt.request)
        .then(cacheRes => {
          return (
            cacheRes ||
            fetch(evt.request).then(fetchRes => {
              return caches.open(dynamicCacheName).then(cache => {
                if (evt.request.url.includes("chrome-extension")) {
                  return fetchRes;
                }

                cache.put(evt.request.url, fetchRes.clone());
                limitCacheSize(dynamicCacheName, 15);
                return fetchRes;
              });
            })
          );
        })
        .catch(() => {
          console.log("### NOT FOUND HTML");
          if (evt.request.url.includes(".html")) {
            return caches.match(FALLBACK_PAGE);
          }
        })
    );
  }
});
