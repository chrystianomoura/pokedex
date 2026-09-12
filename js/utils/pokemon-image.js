/* =========================================================
   POKÉDEX — POKÉMON IMAGE
   ========================================================= */

/* =========================================================
   CONFIG
   ========================================================= */

const SOURCE_RETRY_DELAY = 350;

const MAX_SESSION_SOURCE_FAILURES = 3;

const RAW_GITHUB_HOST = "raw.githubusercontent.com";

const JSDELIVR_HOST = "cdn.jsdelivr.net";

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
  return getSourceFailureCount(source) >= MAX_SESSION_SOURCE_FAILURES;
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeSource(source) {
  return typeof source === "string" ? source.trim() : "";
}

function normalizePokemonId(id) {
  const pokemonId = Number(id);

  return Number.isInteger(pokemonId) && pokemonId > 0 ? pokemonId : null;
}

/* =========================================================
   SOURCE INFORMATION
   ========================================================= */

function getSourceHostname(source) {
  try {
    return new URL(source, window.location.href).hostname;
  } catch {
    return "";
  }
}

function isRawGitHubSource(source) {
  return getSourceHostname(source) === RAW_GITHUB_HOST;
}

function isJsDelivrSource(source) {
  return getSourceHostname(source) === JSDELIVR_HOST;
}

/* =========================================================
   JSDELIVR SOURCES
   ========================================================= */

function getOfficialArtworkSource(
  id,

  { shiny = false } = {},
) {
  const pokemonId = normalizePokemonId(id);

  if (!pokemonId) {
    return "";
  }

  const variantPath = shiny ? "shiny/" : "";

  return (
    "https://cdn.jsdelivr.net/gh/" +
    "PokeAPI/sprites@master/" +
    "sprites/pokemon/other/official-artwork/" +
    `${variantPath}${pokemonId}.png`
  );
}

function getStandardSpriteSource(
  id,

  { shiny = false } = {},
) {
  const pokemonId = normalizePokemonId(id);

  if (!pokemonId) {
    return "";
  }

  const variantPath = shiny ? "shiny/" : "";

  return (
    "https://cdn.jsdelivr.net/gh/" +
    "PokeAPI/sprites@master/" +
    "sprites/pokemon/" +
    `${variantPath}${pokemonId}.png`
  );
}

/* =========================================================
   SOURCE CREATION
   ========================================================= */

function createSourceEntry(
  source,

  {
    retry = false,

    priority = 0,
  } = {},
) {
  const normalizedSource = normalizeSource(source);

  if (!normalizedSource) {
    return null;
  }

  return {
    source: normalizedSource,

    retry,

    priority,
  };
}

/* =========================================================
   SOURCE LIST
   ========================================================= */

function createSourceList({
  id,

  source,

  shiny = false,
}) {
  const sources = [];

  const primarySource = normalizeSource(source);

  const officialArtworkSource = getOfficialArtworkSource(
    id,

    { shiny },
  );

  const standardSpriteSource = getStandardSpriteSource(
    id,

    { shiny },
  );

  /*
   * A origem retornada pela PokéAPI normalmente aponta para
   * raw.githubusercontent.com.
   *
   * Como esse host apresentou respostas 503 intermitentes,
   * o espelho do jsDelivr passa a ser nossa primeira opção.
   */

  const officialArtworkEntry = createSourceEntry(
    officialArtworkSource,

    {
      retry: true,

      priority: 100,
    },
  );

  if (officialArtworkEntry) {
    sources.push(officialArtworkEntry);
  }

  /*
   * Mantemos a origem original como fallback.
   *
   * Se ela já for exatamente a mesma URL utilizada acima,
   * não será adicionada novamente.
   */

  const primaryEntry = createSourceEntry(primarySource, {
    retry: Boolean(primarySource) && !isRawGitHubSource(primarySource),

    priority: isRawGitHubSource(primarySource) ? 50 : 90,
  });

  if (
    primaryEntry &&
    !sources.some((item) => item.source === primaryEntry.source)
  ) {
    sources.push(primaryEntry);
  }

  /*
   * Último fallback visual:
   * sprite padrão do repositório da PokéAPI.
   */

  const standardSpriteEntry = createSourceEntry(
    standardSpriteSource,

    {
      retry: true,

      priority: 10,
    },
  );

  if (
    standardSpriteEntry &&
    !sources.some((item) => item.source === standardSpriteEntry.source)
  ) {
    sources.push(standardSpriteEntry);
  }

  return sources.sort(
    (firstSource, secondSource) => secondSource.priority - firstSource.priority,
  );
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

  let currentSource = null;

  let currentAttempt = 0;

  let retryTimeoutId = null;

  let disposed = false;

  let requestToken = 0;

  /* =======================================================
     TIMEOUT
     ======================================================= */

  function clearRetryTimeout() {
    if (retryTimeoutId === null) {
      return;
    }

    window.clearTimeout(retryTimeoutId);

    retryTimeoutId = null;
  }

  /* =======================================================
     SOURCE SELECTION
     ======================================================= */

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

  /* =======================================================
     SOURCE REQUEST
     ======================================================= */

  function requestSource(sourceToLoad) {
    if (disposed) {
      return;
    }

    requestToken += 1;

    image.hidden = false;

    image.src = sourceToLoad;
  }

  /* =======================================================
     UNAVAILABLE
     ======================================================= */

  function markUnavailable() {
    clearRetryTimeout();

    currentSource = null;

    currentAttempt = 0;

    image.removeAttribute("src");

    image.hidden = true;

    if (typeof onUnavailable === "function") {
      onUnavailable(image);
    }
  }

  /* =======================================================
     NEXT SOURCE
     ======================================================= */

  function loadNextSource() {
    clearRetryTimeout();

    currentAttempt = 0;

    currentSource = getNextAvailableSource();

    if (!currentSource) {
      markUnavailable();

      return;
    }

    requestSource(currentSource.source);
  }

  /* =======================================================
     RETRY
     ======================================================= */

  function scheduleRetry() {
    if (!currentSource?.retry) {
      loadNextSource();

      return;
    }

    /*
     * Cada fonte recebe no máximo uma nova tentativa.
     *
     * A tentativa é independente da memória de falhas da
     * sessão. Isso evita o bug anterior em que o limite
     * global impedia o retry planejado.
     */

    if (currentAttempt >= 1) {
      loadNextSource();

      return;
    }

    currentAttempt += 1;

    const token = requestToken;

    retryTimeoutId = window.setTimeout(() => {
      retryTimeoutId = null;

      if (disposed || token !== requestToken || !currentSource) {
        return;
      }

      requestSource(currentSource.source);
    }, SOURCE_RETRY_DELAY);
  }

  /* =======================================================
     LOAD
     ======================================================= */

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

        host: getSourceHostname(currentSource.source),

        fallback: sourceIndex > 1 || isJsDelivrSource(currentSource.source),
      });
    }
  }

  /* =======================================================
     ERROR
     ======================================================= */

  function handleError() {
    if (disposed || !currentSource) {
      return;
    }

    clearRetryTimeout();

    registerSourceFailure(currentSource.source);

    /*
     * raw.githubusercontent.com foi a origem que observamos
     * devolvendo HTTP 503.
     *
     * Não insistimos nela: falhou uma vez, seguimos para a
     * próxima origem imediatamente.
     */

    if (isRawGitHubSource(currentSource.source)) {
      loadNextSource();

      return;
    }

    /*
     * Se essa fonte já apresentou muitas falhas durante a
     * sessão, também não insistimos.
     */

    if (isSourceUnavailable(currentSource.source)) {
      loadNextSource();

      return;
    }

    scheduleRetry();
  }

  /* =======================================================
     EVENTS
     ======================================================= */

  image.addEventListener("load", handleLoad);

  image.addEventListener("error", handleError);

  /* =======================================================
     START
     ======================================================= */

  if (sources.length === 0) {
    markUnavailable();
  } else {
    loadNextSource();
  }

  /* =======================================================
     DISPOSE
     ======================================================= */

  return function disposePokemonImageLoader() {
    disposed = true;

    clearRetryTimeout();

    image.removeEventListener("load", handleLoad);

    image.removeEventListener("error", handleError);
  };
}