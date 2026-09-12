/* =========================================================
   POKÉDEX — POKÉMON IMAGE
   ========================================================= */

/* =========================================================
   CONFIG
   ========================================================= */

const IMAGE_RETRY_DELAYS = Object.freeze([250, 750]);

const MAX_SOURCE_FAILURES = 2;

/* =========================================================
   SESSION FAILURE MEMORY
   ========================================================= */

const failedImageSources = new Map();

function getSourceFailureCount(source) {
  return failedImageSources.get(source) ?? 0;
}

function registerSourceFailure(source) {
  const failureCount = getSourceFailureCount(source) + 1;

  failedImageSources.set(source, failureCount);

  return failureCount;
}

function clearSourceFailure(source) {
  failedImageSources.delete(source);
}

function isSourceUnavailable(source) {
  return getSourceFailureCount(source) >= MAX_SOURCE_FAILURES;
}

/* =========================================================
   SOURCE NORMALIZATION
   ========================================================= */

function normalizeSource(source) {
  return typeof source === "string" ? source.trim() : "";
}

function normalizePokemonId(id) {
  const pokemonId = Number(id);

  return Number.isInteger(pokemonId) && pokemonId > 0 ? pokemonId : null;
}

/* =========================================================
   FALLBACK SOURCES
   ========================================================= */

function getPokemonFallbackSources(id, { shiny = false } = {}) {
  const pokemonId = normalizePokemonId(id);

  if (!pokemonId) {
    return [];
  }

  if (shiny) {
    return [
      `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/shiny/${pokemonId}.png`,
      `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/shiny/${pokemonId}.png`,
    ];
  }

  return [
    `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
    `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/${pokemonId}.png`,
  ];
}

/* =========================================================
   SOURCE LIST
   ========================================================= */

function createSourceList({ id, source, shiny = false }) {
  const sources = [];

  const primarySource = normalizeSource(source);

  if (primarySource) {
    sources.push({
      source: primarySource,

      allowRetry: true,
    });
  }

  getPokemonFallbackSources(id, { shiny }).forEach((fallbackSource) => {
    const alreadyIncluded = sources.some(
      (item) => item.source === fallbackSource,
    );

    if (alreadyIncluded) {
      return;
    }

    sources.push({
      source: fallbackSource,

      allowRetry: false,
    });
  });

  return sources;
}

/* =========================================================
   RETRY URL
   ========================================================= */

function createRetryUrl(source) {
  try {
    const url = new URL(source, window.location.href);

    url.searchParams.set(
      "pokedex-retry",
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );

    return url.href;
  } catch {
    return source;
  }
}

/* =========================================================
   IMAGE LOADER
   ========================================================= */

export function loadPokemonImage({
  image,
  id,
  source,
  shiny = false,
  onLoad,
  onUnavailable,
} = {}) {
  if (!(image instanceof HTMLImageElement)) {
    throw new TypeError("Uma imagem válida deve ser informada.");
  }

  const sources = createSourceList({
    id,
    source,
    shiny,
  });

  let sourceIndex = 0;

  let retryIndex = 0;

  let currentSource = null;

  let retryTimeoutId = null;

  let disposed = false;

  let loadToken = 0;

  function clearRetryTimeout() {
    if (retryTimeoutId === null) {
      return;
    }

    window.clearTimeout(retryTimeoutId);

    retryTimeoutId = null;
  }

  function getNextAvailableSource() {
    while (sourceIndex < sources.length) {
      const candidate = sources[sourceIndex];

      sourceIndex += 1;

      if (!isSourceUnavailable(candidate.source)) {
        return candidate;
      }
    }

    return null;
  }

  function setSource(sourceToLoad, { retry = false } = {}) {
    if (disposed) {
      return;
    }

    loadToken += 1;

    image.src = retry ? createRetryUrl(sourceToLoad) : sourceToLoad;
  }

  function markUnavailable() {
    clearRetryTimeout();

    currentSource = null;

    image.removeAttribute("src");

    image.hidden = true;

    if (typeof onUnavailable === "function") {
      onUnavailable(image);
    }
  }

  function loadNextSource() {
    clearRetryTimeout();

    retryIndex = 0;

    currentSource = getNextAvailableSource();

    if (!currentSource) {
      markUnavailable();

      return;
    }

    image.hidden = false;

    setSource(currentSource.source);
  }

  function scheduleRetry() {
    if (!currentSource?.allowRetry) {
      loadNextSource();

      return;
    }

    const delay = IMAGE_RETRY_DELAYS[retryIndex];

    if (delay === undefined) {
      loadNextSource();

      return;
    }

    retryIndex += 1;

    const token = loadToken;

    retryTimeoutId = window.setTimeout(() => {
      retryTimeoutId = null;

      if (disposed || token !== loadToken) {
        return;
      }

      setSource(currentSource.source, {
        retry: true,
      });
    }, delay);
  }

  function handleLoad() {
    if (disposed || !currentSource) {
      return;
    }

    clearRetryTimeout();

    clearSourceFailure(currentSource.source);

    image.hidden = false;

    if (typeof onLoad === "function") {
      onLoad(image, {
        source: currentSource.source,
      });
    }
  }

  function handleError() {
    if (disposed || !currentSource) {
      return;
    }

    clearRetryTimeout();

    registerSourceFailure(currentSource.source);

    if (isSourceUnavailable(currentSource.source)) {
      loadNextSource();

      return;
    }

    scheduleRetry();
  }

  image.addEventListener("load", handleLoad);

  image.addEventListener("error", handleError);

  if (sources.length === 0) {
    markUnavailable();
  } else {
    loadNextSource();
  }

  return function disposePokemonImageLoader() {
    disposed = true;

    clearRetryTimeout();

    image.removeEventListener("load", handleLoad);

    image.removeEventListener("error", handleError);
  };
}