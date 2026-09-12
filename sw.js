/* =========================================================
   POKÉDEX — SERVICE WORKER
   ========================================================= */

const CACHE_NAME = "pokedex-v2";

const APP_ROOT = new URL("./", self.registration.scope);

/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(APP_ROOT.href);
    }),
  );

  self.skipWaiting();
});

/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /*
   * Recursos externos, como Google Fonts e PokéAPI,
   * continuam sob responsabilidade da rede.
   */

  if (url.origin !== self.location.origin) {
    return;
  }

  /*
   * Navegação.
   *
   * Como usamos hash routing, todas as páginas da aplicação
   * continuam apontando para a raiz física da Pokédex.
   */

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));

    return;
  }

  /*
   * Assets internos usam network-first.
   *
   * Isso evita manter JavaScript, CSS ou imagens antigos
   * depois de um novo deploy. O cache é usado somente
   * quando a rede não estiver disponível.
   */

  event.respondWith(handleAssetRequest(request));
});

/* =========================================================
   NAVIGATION
   ========================================================= */

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);

    if (canCacheResponse(response)) {
      const cache = await caches.open(CACHE_NAME);

      await cache.put(APP_ROOT.href, response.clone());
    }

    return response;
  } catch {
    const cachedResponse = await caches.match(APP_ROOT.href);

    if (cachedResponse) {
      return cachedResponse;
    }

    return Response.error();
  }
}

/* =========================================================
   ASSETS
   ========================================================= */

async function handleAssetRequest(request) {
  try {
    const response = await fetch(request);

    if (canCacheResponse(response)) {
      const cache = await caches.open(CACHE_NAME);

      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return Response.error();
  }
}

/* =========================================================
   CACHE VALIDATION
   ========================================================= */

function canCacheResponse(response) {
  return response && response.ok && response.type === "basic";
}