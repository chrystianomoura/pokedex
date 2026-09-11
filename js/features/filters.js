import {
  getGeneration,
  getPokemon,
  getPokemonSpeciesList,
  getType,
} from "../api/pokeapi.js";

import { mapPokemonToCard } from "../services/pokemon.js";

import {
  createPokemonCard,
  createPokemonCardSkeleton,
} from "../components/pokemon-card.js";

/* =========================================================
   POKÉDEX — FILTERS FEATURE
   ========================================================= */

const NATIONAL_DEX_MAX_ID = 1025;

const DEFAULT_BATCH_SIZE = 24;

const DEFAULT_ROOT_MARGIN = "0px 0px 600px 0px";

const DEFAULT_FILTERS = Object.freeze({
  type: "all",

  generation: 0,

  sort: "number-asc",
});

const VALID_SORTS = new Set([
  "number-asc",
  "number-desc",
  "name-asc",
  "name-desc",
]);

/* =========================================================
   FACTORY
   ========================================================= */

export function createPokemonFiltersFeature({
  grid,

  sentinel,

  loadMoreButton,

  emptyState = null,

  batchSize = DEFAULT_BATCH_SIZE,

  onModeChange = null,
} = {}) {
  validateElements({
    grid,

    sentinel,

    loadMoreButton,

    emptyState,
  });

  validateBatchSize(batchSize);

  validateCallback(onModeChange);

  /* =======================================================
     STATE
     ======================================================= */

  let catalog = null;

  let filters = {
    ...DEFAULT_FILTERS,
  };

  let query = "";

  let matches = [];

  let renderedCount = 0;

  let isLoading = false;

  let active = false;

  let controller = null;

  let observer = null;

  let requestId = 0;

  /* =======================================================
     CATALOG
     ======================================================= */

  async function loadCatalog(signal) {
    if (catalog) {
      return catalog;
    }

    const response = await getPokemonSpeciesList(
      {
        limit: NATIONAL_DEX_MAX_ID,

        offset: 0,
      },

      {
        signal,
      },
    );

    if (signal?.aborted) {
      throw createAbortError();
    }

    const results = Array.isArray(response?.results) ? response.results : [];

    catalog = results
      .map(mapCatalogResource)
      .filter(isValidCatalogPokemon)
      .filter((pokemon) => {
        return pokemon.id <= NATIONAL_DEX_MAX_ID;
      });

    return catalog;
  }

  /* =======================================================
     REQUEST CONTROL
     ======================================================= */

  function createController() {
    abortRequest();

    controller = new AbortController();

    return controller;
  }

  function abortRequest() {
    if (!controller) {
      return;
    }

    controller.abort();

    controller = null;
  }

  /* =======================================================
     RESET RESULTS
     ======================================================= */

  function resetResults() {
    matches = [];

    renderedCount = 0;

    isLoading = false;

    grid.replaceChildren();

    hideEmptyState();

    updateSentinel();

    updateLoadMoreButton();
  }

  /* =======================================================
     MODE
     ======================================================= */

  function setActive(nextActive) {
    const normalized = Boolean(nextActive);

    if (active === normalized) {
      return;
    }

    active = normalized;

    notifyModeChange();
  }

  function notifyModeChange() {
    if (typeof onModeChange !== "function") {
      return;
    }

    onModeChange(active);
  }

  /* =======================================================
     APPLY
     ======================================================= */

  async function apply(
    nextFilters,

    { searchQuery = query } = {},
  ) {
    filters = normalizeFilters(nextFilters);

    query = normalizeQuery(searchQuery);

    requestId += 1;

    const currentRequestId = requestId;

    abortRequest();

    resetResults();

    const shouldActivate = hasActiveFilters(filters) || query !== "";

    setActive(shouldActivate);

    if (!shouldActivate) {
      return;
    }

    const requestController = createController();

    try {
      const nextMatches = await resolveMatches({
        filters,

        query,

        signal: requestController.signal,
      });

      if (requestController.signal.aborted || currentRequestId !== requestId) {
        return;
      }

      matches = nextMatches;

      renderedCount = 0;

      grid.replaceChildren();

      updateEmptyState();

      updateSentinel();

      updateLoadMoreButton();

      if (matches.length === 0) {
        return;
      }

      await loadNextBatch({
        requestId: currentRequestId,

        controller: requestController,
      });
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.error("Erro ao aplicar filtros:", error);

      if (currentRequestId !== requestId) {
        return;
      }

      renderErrorState();

      updateSentinel();

      updateLoadMoreButton();
    }
  }

  /* =======================================================
     RESOLVE MATCHES
     ======================================================= */

  async function resolveMatches({
    filters: currentFilters,

    query: currentQuery,

    signal,
  }) {
    const baseCatalog = await loadCatalog(signal);

    let result = [...baseCatalog];

    /* =====================================================
       TYPE
       ===================================================== */

    if (currentFilters.type !== DEFAULT_FILTERS.type) {
      const typeIds = await loadTypeIds(
        currentFilters.type,

        signal,
      );

      result = result.filter((pokemon) => {
        return typeIds.has(pokemon.id);
      });
    }

    /* =====================================================
       GENERATION
       ===================================================== */

    if (currentFilters.generation !== DEFAULT_FILTERS.generation) {
      const generationIds = await loadGenerationIds(
        currentFilters.generation,

        signal,
      );

      result = result.filter((pokemon) => {
        return generationIds.has(pokemon.id);
      });
    }

    /* =====================================================
       QUERY
       ===================================================== */

    if (currentQuery !== "") {
      result = result.filter((pokemon) => {
        return matchesQuery(
          pokemon,

          currentQuery,
        );
      });
    }

    /* =====================================================
       SORT
       ===================================================== */

    return sortMatches(
      result,

      currentFilters.sort,
    );
  }

  /* =======================================================
     TYPE IDS
     ======================================================= */

  async function loadTypeIds(
    type,

    signal,
  ) {
    const rawType = await getType(
      type,

      {
        signal,
      },
    );

    if (signal?.aborted) {
      throw createAbortError();
    }

    const entries = Array.isArray(rawType?.pokemon) ? rawType.pokemon : [];

    const ids = new Set();

    entries.forEach((entry) => {
      const id = getResourceId(entry?.pokemon?.url);

      if (!isNationalDexId(id)) {
        return;
      }

      ids.add(id);
    });

    return ids;
  }

  /* =======================================================
     GENERATION IDS
     ======================================================= */

  async function loadGenerationIds(
    generation,

    signal,
  ) {
    const rawGeneration = await getGeneration(
      generation,

      {
        signal,
      },
    );

    if (signal?.aborted) {
      throw createAbortError();
    }

    const species = Array.isArray(rawGeneration?.pokemon_species)
      ? rawGeneration.pokemon_species
      : [];

    const ids = new Set();

    species.forEach((pokemon) => {
      const id = getResourceId(pokemon?.url);

      if (!isNationalDexId(id)) {
        return;
      }

      ids.add(id);
    });

    return ids;
  }

  /* =======================================================
     LOAD NEXT BATCH
     ======================================================= */

  async function loadNextBatch({
    requestId: expectedRequestId = requestId,

    controller: requestController = controller,
  } = {}) {
    if (
      !active ||
      !requestController ||
      requestController.signal.aborted ||
      isLoading ||
      renderedCount >= matches.length
    ) {
      return;
    }

    isLoading = true;

    updateLoadMoreButton();

    const batch = matches.slice(
      renderedCount,

      renderedCount + batchSize,
    );

    const skeletons = renderSkeletons(batch.length);

    try {
      const requests = batch.map((pokemon) => {
        return getPokemon(
          pokemon.id,

          {
            signal: requestController.signal,
          },
        );
      });

      const rawPokemonList = await Promise.all(requests);

      if (requestController.signal.aborted || expectedRequestId !== requestId) {
        removeSkeletons(skeletons);

        return;
      }

      const pokemonList = rawPokemonList.map(mapPokemonToCard);

      removeSkeletons(skeletons);

      renderPokemonList(pokemonList);

      renderedCount += pokemonList.length;

      updateSentinel();

      updateEmptyState();
    } catch (error) {
      removeSkeletons(skeletons);

      if (error.name === "AbortError") {
        return;
      }

      console.error("Erro ao carregar Pokémon filtrados:", error);

      renderErrorState();
    } finally {
      if (expectedRequestId === requestId) {
        isLoading = false;

        updateLoadMoreButton();

        updateSentinel();
      }
    }
  }

  /* =======================================================
     RENDER — POKÉMON
     ======================================================= */

  function renderPokemonList(pokemonList) {
    const fragment = document.createDocumentFragment();

    pokemonList.forEach((pokemon) => {
      fragment.append(createPokemonCard(pokemon));
    });

    grid.append(fragment);
  }

  /* =======================================================
     RENDER — SKELETONS
     ======================================================= */

  function renderSkeletons(amount) {
    const fragment = document.createDocumentFragment();

    const skeletons = [];

    for (let index = 0; index < amount; index += 1) {
      const skeleton = createPokemonCardSkeleton();

      skeletons.push(skeleton);

      fragment.append(skeleton);
    }

    grid.append(fragment);

    return skeletons;
  }

  function removeSkeletons(skeletons) {
    skeletons.forEach((skeleton) => {
      skeleton.remove();
    });
  }

  /* =======================================================
     EMPTY STATE
     ======================================================= */

  function updateEmptyState() {
    if (!emptyState) {
      return;
    }

    if (!active || matches.length > 0) {
      hideEmptyState();

      return;
    }

    renderStateMessage({
      state: "empty",

      title: "Nenhum Pokémon encontrado.",

      description: "Tente ajustar a busca ou os filtros.",
    });
  }

  function hideEmptyState() {
    if (!emptyState) {
      return;
    }

    emptyState.hidden = true;

    emptyState.replaceChildren();

    delete emptyState.dataset.state;
  }

  function renderErrorState() {
    if (!emptyState) {
      return;
    }

    renderStateMessage({
      state: "error",

      title: "Não foi possível carregar os resultados.",

      description: "Tente novamente em instantes.",
    });
  }

  function renderStateMessage({
    state,

    title,

    description,
  }) {
    if (!emptyState) {
      return;
    }

    const titleElement = document.createElement("span");

    titleElement.className = "pokedex-page__filters-empty-title";

    titleElement.textContent = title;

    const descriptionElement = document.createElement("span");

    descriptionElement.className = "pokedex-page__filters-empty-description";

    descriptionElement.textContent = description;

    emptyState.dataset.state = state;

    emptyState.replaceChildren(titleElement, descriptionElement);

    emptyState.hidden = false;
  }

  /* =======================================================
     LOAD MORE BUTTON
     ======================================================= */

  function updateLoadMoreButton() {
    if (!active) {
      return;
    }

    /*
     * Sem resultados não existe ação possível.
     * O estado vazio passa a ser a única mensagem da tela.
     */

    if (matches.length === 0) {
      loadMoreButton.hidden = true;

      loadMoreButton.disabled = true;

      loadMoreButton.textContent = "Carregar mais";

      return;
    }

    loadMoreButton.hidden = false;

    const hasMore = renderedCount < matches.length;

    loadMoreButton.disabled = isLoading || !hasMore;

    if (isLoading) {
      loadMoreButton.textContent = "Carregando...";

      return;
    }

    if (!hasMore) {
      loadMoreButton.textContent = "Todos os resultados carregados";

      return;
    }

    loadMoreButton.textContent = "Carregar mais";
  }

  /* =======================================================
     SENTINEL
     ======================================================= */

  function updateSentinel() {
    sentinel.hidden =
      !active || renderedCount >= matches.length || matches.length === 0;
  }

  /* =======================================================
     INFINITE SCROLL
     ======================================================= */

  function setupInfiniteScroll() {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    stopInfiniteScroll();

    observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting || !active) {
          return;
        }

        void loadNextBatch();
      },

      {
        root: null,

        rootMargin: DEFAULT_ROOT_MARGIN,

        threshold: 0,
      },
    );

    observer.observe(sentinel);
  }

  function stopInfiniteScroll() {
    if (!observer) {
      return;
    }

    observer.disconnect();

    observer = null;
  }

  /* =======================================================
     QUERY
     ======================================================= */

  async function setQuery(
    nextQuery,

    { reapply = true } = {},
  ) {
    query = normalizeQuery(nextQuery);

    if (!reapply) {
      return;
    }

    await apply(
      filters,

      {
        searchQuery: query,
      },
    );
  }

  /* =======================================================
     CLEAR
     ======================================================= */

  function clear() {
    requestId += 1;

    abortRequest();

    filters = {
      ...DEFAULT_FILTERS,
    };

    query = "";

    matches = [];

    renderedCount = 0;

    isLoading = false;

    grid.replaceChildren();

    hideEmptyState();

    setActive(false);

    updateSentinel();
  }

  /* =======================================================
     INIT
     ======================================================= */

  function init() {
    setupInfiniteScroll();

    updateSentinel();
  }

  /* =======================================================
     DESTROY
     ======================================================= */

  function destroy() {
    requestId += 1;

    abortRequest();

    stopInfiniteScroll();

    isLoading = false;
  }

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    init,

    destroy,

    apply,

    clear,

    setQuery,

    loadNextBatch,

    updateLoadMoreButton,

    updateSentinel,

    get filters() {
      return {
        ...filters,
      };
    },

    get query() {
      return query;
    },

    get isActive() {
      return active;
    },

    get isLoading() {
      return isLoading;
    },

    get totalPokemon() {
      return matches.length;
    },

    get renderedPokemon() {
      return renderedCount;
    },
  };
}

/* =========================================================
   CATALOG RESOURCE
   ========================================================= */

function mapCatalogResource(resource) {
  return {
    id: getResourceId(resource?.url),

    name: normalizePokemonName(resource?.name),
  };
}

/* =========================================================
   CATALOG VALIDATION
   ========================================================= */

function isValidCatalogPokemon(pokemon) {
  return (
    isNationalDexId(pokemon?.id) &&
    typeof pokemon?.name === "string" &&
    pokemon.name !== ""
  );
}

/* =========================================================
   RESOURCE ID
   ========================================================= */

function getResourceId(url) {
  if (typeof url !== "string") {
    return null;
  }

  const match = url.match(/\/(\d+)\/?$/);

  if (!match) {
    return null;
  }

  const id = Number(match[1]);

  return Number.isInteger(id) ? id : null;
}

/* =========================================================
   NATIONAL DEX ID
   ========================================================= */

function isNationalDexId(id) {
  return Number.isInteger(id) && id >= 1 && id <= NATIONAL_DEX_MAX_ID;
}

/* =========================================================
   QUERY MATCH
   ========================================================= */

function matchesQuery(
  pokemon,

  query,
) {
  if (!query) {
    return true;
  }

  const numericQuery = getNumericQuery(query);

  if (numericQuery !== null) {
    return pokemon.id === numericQuery;
  }

  const pokemonName = normalizeSearchText(pokemon.name);

  const searchText = normalizeSearchText(query);

  return pokemonName.includes(searchText);
}

/* =========================================================
   NUMERIC QUERY
   ========================================================= */

function getNumericQuery(query) {
  const normalized = String(query ?? "")
    .trim()
    .replace(/^#/, "");

  if (!/^\d{1,4}$/.test(normalized)) {
    return null;
  }

  const id = Number(normalized);

  return isNationalDexId(id) ? id : null;
}

/* =========================================================
   SORT
   ========================================================= */

function sortMatches(
  pokemonList,

  sort,
) {
  const sorted = [...pokemonList];

  switch (sort) {
    case "number-desc":
      return sorted.sort(compareNumberDescending);

    case "name-asc":
      return sorted.sort(compareNameAscending);

    case "name-desc":
      return sorted.sort(compareNameDescending);

    case "number-asc":
    default:
      return sorted.sort(compareNumberAscending);
  }
}

/* =========================================================
   SORT — NUMBER
   ========================================================= */

function compareNumberAscending(
  first,

  second,
) {
  return first.id - second.id;
}

function compareNumberDescending(
  first,

  second,
) {
  return second.id - first.id;
}

/* =========================================================
   SORT — NAME
   ========================================================= */

function compareNameAscending(
  first,

  second,
) {
  return first.name.localeCompare(
    second.name,

    "pt-BR",

    {
      sensitivity: "base",

      numeric: true,
    },
  );
}

function compareNameDescending(
  first,

  second,
) {
  return second.name.localeCompare(
    first.name,

    "pt-BR",

    {
      sensitivity: "base",

      numeric: true,
    },
  );
}

/* =========================================================
   FILTER STATE
   ========================================================= */

function hasActiveFilters(filters) {
  return (
    filters.type !== DEFAULT_FILTERS.type ||
    filters.generation !== DEFAULT_FILTERS.generation ||
    filters.sort !== DEFAULT_FILTERS.sort
  );
}

/* =========================================================
   FILTER NORMALIZATION
   ========================================================= */

function normalizeFilters(filters) {
  const source =
    filters && typeof filters === "object" ? filters : DEFAULT_FILTERS;

  const generation = Number(source.generation);

  const sort = String(source.sort ?? "").trim();

  return {
    type: normalizeType(source.type),

    generation:
      Number.isInteger(generation) && generation >= 0 && generation <= 9
        ? generation
        : DEFAULT_FILTERS.generation,

    sort: VALID_SORTS.has(sort) ? sort : DEFAULT_FILTERS.sort,
  };
}

/* =========================================================
   TYPE NORMALIZATION
   ========================================================= */

function normalizeType(type) {
  const normalized = String(type ?? "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return DEFAULT_FILTERS.type;
  }

  return normalized;
}

/* =========================================================
   QUERY NORMALIZATION
   ========================================================= */

function normalizeQuery(value) {
  return String(value ?? "").trim();
}

/* =========================================================
   POKÉMON NAME NORMALIZATION
   ========================================================= */

function normalizePokemonName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/* =========================================================
   SEARCH TEXT NORMALIZATION
   ========================================================= */

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/* =========================================================
   ABORT ERROR
   ========================================================= */

function createAbortError() {
  return new DOMException(
    "Operação cancelada.",

    "AbortError",
  );
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateElements({
  grid,

  sentinel,

  loadMoreButton,

  emptyState,
}) {
  if (!(grid instanceof Element)) {
    throw new Error("Filters Feature: grid não informado.");
  }

  if (!(sentinel instanceof Element)) {
    throw new Error("Filters Feature: sentinel não informado.");
  }

  if (!(loadMoreButton instanceof HTMLButtonElement)) {
    throw new Error("Filters Feature: botão de carregamento não informado.");
  }

  if (emptyState !== null && !(emptyState instanceof HTMLElement)) {
    throw new Error("Filters Feature: estado vazio inválido.");
  }
}

/* =========================================================
   BATCH VALIDATION
   ========================================================= */

function validateBatchSize(batchSize) {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error("Filters Feature: tamanho de lote inválido.");
  }
}

/* =========================================================
   CALLBACK VALIDATION
   ========================================================= */

function validateCallback(callback) {
  if (callback !== null && typeof callback !== "function") {
    throw new Error("Filters Feature: callback de mudança de modo inválido.");
  }
}