import { getAllPokemonSpecies, getPokemon } from "../api/pokeapi.js";

import {
  mapPokemonSpeciesList,
  mapPokemonToCard,
} from "../services/pokemon.js";

import {
  normalizePokemonSearchQuery,
  searchPokemonSpecies,
} from "../services/pokemon-search.js";

import {
  createPokemonCard,
  createPokemonCardSkeleton,
} from "../components/pokemon-card.js";

/* =========================================================
   POKÉDEX — SEARCH FEATURE
   ========================================================= */

const DEFAULT_BATCH_SIZE = 12;

const DEFAULT_DEBOUNCE_TIME = 250;

const DEFAULT_ROOT_MARGIN = "0px 0px 400px 0px";

/* =========================================================
   FACTORY
   ========================================================= */

export function createPokemonSearchFeature({
  search,

  grid,

  searchGrid,

  searchSentinel,

  batchSize = DEFAULT_BATCH_SIZE,

  debounceTime = DEFAULT_DEBOUNCE_TIME,

  onModeChange = null,

  shouldDelegateSearch = null,

  onDelegatedSearch = null,
} = {}) {
  validateElements({
    search,

    grid,

    searchGrid,

    searchSentinel,
  });

  validateBatchSize(batchSize);

  validateDebounceTime(debounceTime);

  validateCallback(onModeChange, "onModeChange");

  validateCallback(shouldDelegateSearch, "shouldDelegateSearch");

  validateCallback(onDelegatedSearch, "onDelegatedSearch");

  /* =======================================================
     STATE — INDEX
     ======================================================= */

  let pokemonSpeciesIndex = [];

  let pokemonSpeciesIndexPromise = null;

  /* =======================================================
     STATE — SEARCH
     ======================================================= */

  let isSearchMode = false;

  let searchTimeout = null;

  let searchController = null;

  let searchObserver = null;

  let searchRequestId = 0;

  let searchMatches = [];

  let searchRenderedCount = 0;

  let isSearchLoading = false;

  /* =======================================================
     SEARCH INDEX
     ======================================================= */

  async function loadPokemonSpeciesIndex() {
    if (pokemonSpeciesIndex.length > 0) {
      return pokemonSpeciesIndex;
    }

    if (pokemonSpeciesIndexPromise) {
      return pokemonSpeciesIndexPromise;
    }

    pokemonSpeciesIndexPromise = getAllPokemonSpecies()
      .then((speciesList) => {
        pokemonSpeciesIndex = mapPokemonSpeciesList(speciesList);

        return pokemonSpeciesIndex;
      })
      .catch((error) => {
        pokemonSpeciesIndexPromise = null;

        throw error;
      });

    return pokemonSpeciesIndexPromise;
  }

  /* =======================================================
     REQUEST CONTROL
     ======================================================= */

  function createSearchController() {
    abortSearchRequest();

    searchController = new AbortController();

    return searchController;
  }

  function abortSearchRequest() {
    if (!searchController) {
      return;
    }

    searchController.abort();

    searchController = null;
  }

  /* =======================================================
     TIMEOUT CONTROL
     ======================================================= */

  function clearSearchTimeout() {
    if (!searchTimeout) {
      return;
    }

    clearTimeout(searchTimeout);

    searchTimeout = null;
  }

  /* =======================================================
     STATE
     ======================================================= */

  function resetSearchState() {
    searchMatches = [];

    searchRenderedCount = 0;

    isSearchLoading = false;
  }

  function setSearchMode(active) {
    const nextState = Boolean(active);

    if (isSearchMode === nextState) {
      return;
    }

    isSearchMode = nextState;

    if (typeof onModeChange === "function") {
      onModeChange(isSearchMode);
    }
  }

  /* =======================================================
     INTERNAL SEARCH RESET
     ======================================================= */

  function resetInternalSearch({ clearStatus = true } = {}) {
    clearSearchTimeout();

    searchRequestId += 1;

    abortSearchRequest();

    resetSearchState();

    searchGrid.replaceChildren();

    if (clearStatus) {
      search.setStatus("");
    }

    setSearchMode(false);

    updateSentinel();
  }

  /* =======================================================
     DELEGATION
     ======================================================= */

  function isDelegatedSearchActive() {
    if (typeof shouldDelegateSearch !== "function") {
      return false;
    }

    return Boolean(shouldDelegateSearch());
  }

  function executeDelegatedSearch(query) {
    resetInternalSearch();

    if (typeof onDelegatedSearch !== "function") {
      return;
    }

    onDelegatedSearch(query);
  }

  function scheduleDelegatedSearch(query) {
    clearSearchTimeout();

    /*
     * A Search Feature deixa de controlar os resultados
     * enquanto a pesquisa estiver delegada.
     */

    searchRequestId += 1;

    abortSearchRequest();

    resetSearchState();

    searchGrid.replaceChildren();

    search.setStatus("");

    setSearchMode(false);

    updateSentinel();

    const normalizedQuery = normalizePokemonSearchQuery(query);

    /*
     * Limpar o campo precisa ser imediato.
     */

    if (!normalizedQuery) {
      executeDelegatedSearch(query);

      return;
    }

    searchTimeout = setTimeout(() => {
      searchTimeout = null;

      executeDelegatedSearch(query);
    }, debounceTime);
  }

  /* =======================================================
     RENDER — POKÉMON
     ======================================================= */

  function renderPokemonList(pokemonList) {
    const fragment = document.createDocumentFragment();

    pokemonList.forEach((pokemon) => {
      fragment.append(createPokemonCard(pokemon));
    });

    searchGrid.append(fragment);
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

    searchGrid.append(fragment);

    return skeletons;
  }

  function removeSkeletons(skeletons) {
    skeletons.forEach((skeleton) => {
      skeleton.remove();
    });
  }

  /* =======================================================
     STATUS
     ======================================================= */

  function updateSearchStatus() {
    const total = searchMatches.length;

    const rendered = searchRenderedCount;

    if (total === 0) {
      search.setStatus("Nenhum Pokémon encontrado.");

      return;
    }

    if (rendered < total) {
      search.setStatus(`Mostrando ${rendered} de ${total} resultados.`);

      return;
    }

    if (total === 1) {
      search.setStatus("1 Pokémon encontrado.");

      return;
    }

    search.setStatus(`${total} Pokémon encontrados.`);
  }

  /* =======================================================
     SENTINEL
     ======================================================= */

  function updateSentinel() {
    searchSentinel.hidden =
      !isSearchMode || searchRenderedCount >= searchMatches.length;
  }

  /* =======================================================
     LOAD NEXT BATCH
     ======================================================= */

  async function loadNextBatch({
    requestId = searchRequestId,

    controller = searchController,
  } = {}) {
    if (
      !controller ||
      controller.signal.aborted ||
      isSearchLoading ||
      searchRenderedCount >= searchMatches.length
    ) {
      return;
    }

    isSearchLoading = true;

    const batch = searchMatches.slice(
      searchRenderedCount,

      searchRenderedCount + batchSize,
    );

    const skeletons = renderSkeletons(batch.length);

    try {
      const requests = batch.map(({ id }) => {
        return getPokemon(
          id,

          {
            signal: controller.signal,
          },
        );
      });

      const rawPokemonList = await Promise.all(requests);

      if (controller.signal.aborted || requestId !== searchRequestId) {
        removeSkeletons(skeletons);

        return;
      }

      const pokemonList = rawPokemonList.map(mapPokemonToCard);

      removeSkeletons(skeletons);

      renderPokemonList(pokemonList);

      searchRenderedCount += pokemonList.length;

      updateSearchStatus();

      updateSentinel();
    } catch (error) {
      removeSkeletons(skeletons);

      if (error.name === "AbortError") {
        return;
      }

      search.setStatus("Não foi possível carregar os resultados.");

      console.error("Erro ao carregar resultados da pesquisa:", error);
    } finally {
      if (requestId === searchRequestId) {
        isSearchLoading = false;
      }
    }
  }

  /* =======================================================
     EXECUTE SEARCH
     ======================================================= */

  async function executeSearch(query) {
    /*
     * Se filtros avançados estiverem ativos,
     * a pesquisa deixa de pertencer à Search Feature.
     */

    if (isDelegatedSearchActive()) {
      executeDelegatedSearch(query);

      return;
    }

    const normalizedQuery = normalizePokemonSearchQuery(query);

    /* =====================================================
       EMPTY QUERY
       ===================================================== */

    if (!normalizedQuery) {
      resetInternalSearch();

      return;
    }

    /* =====================================================
       NEW SEARCH
       ===================================================== */

    searchRequestId += 1;

    const requestId = searchRequestId;

    const controller = createSearchController();

    resetSearchState();

    searchGrid.replaceChildren();

    search.setStatus("Buscando Pokémon...");

    setSearchMode(true);

    updateSentinel();

    try {
      const speciesIndex = await loadPokemonSpeciesIndex();

      if (controller.signal.aborted || requestId !== searchRequestId) {
        return;
      }

      searchMatches = searchPokemonSpecies(
        speciesIndex,

        normalizedQuery,
      );

      if (searchMatches.length === 0) {
        searchGrid.replaceChildren();

        updateSearchStatus();

        updateSentinel();

        return;
      }

      await loadNextBatch({
        requestId,

        controller,
      });
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      searchGrid.replaceChildren();

      updateSentinel();

      search.setStatus("Não foi possível realizar a pesquisa.");

      console.error("Erro ao pesquisar Pokémon:", error);
    }
  }

  /* =======================================================
     DEBOUNCE — INTERNAL SEARCH
     ======================================================= */

  function scheduleSearch(query) {
    if (isDelegatedSearchActive()) {
      scheduleDelegatedSearch(query);

      return;
    }

    clearSearchTimeout();

    const normalizedQuery = normalizePokemonSearchQuery(query);

    if (!normalizedQuery) {
      void executeSearch(query);

      return;
    }

    searchTimeout = setTimeout(
      () => {
        searchTimeout = null;

        void executeSearch(query);
      },

      debounceTime,
    );
  }

  /* =======================================================
     INPUT EVENTS
     ======================================================= */

  function handleInput() {
    const query = search.input.value;

    if (isDelegatedSearchActive()) {
      scheduleDelegatedSearch(query);

      return;
    }

    scheduleSearch(query);
  }

  function handleNativeSearchClear() {
    if (search.input.value !== "") {
      return;
    }

    if (isDelegatedSearchActive()) {
      scheduleDelegatedSearch("");

      return;
    }

    scheduleSearch("");
  }

  /* =======================================================
     INFINITE SCROLL
     ======================================================= */

  function setupInfiniteScroll() {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    stopInfiniteScroll();

    searchObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (
          !entry.isIntersecting ||
          !isSearchMode ||
          isDelegatedSearchActive() ||
          isSearchLoading ||
          searchRenderedCount >= searchMatches.length
        ) {
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

    searchObserver.observe(searchSentinel);
  }

  function stopInfiniteScroll() {
    if (!searchObserver) {
      return;
    }

    searchObserver.disconnect();

    searchObserver = null;
  }

  /* =======================================================
     SUSPEND
     ======================================================= */

  function suspend({ clearStatus = true } = {}) {
    resetInternalSearch({
      clearStatus,
    });
  }

  /* =======================================================
     RESUME
     ======================================================= */

  function resume() {
    if (isDelegatedSearchActive()) {
      return;
    }

    const query = search.input.value;

    if (!normalizePokemonSearchQuery(query)) {
      resetInternalSearch();

      return;
    }

    scheduleSearch(query);
  }

  /* =======================================================
     CLEAR
     ======================================================= */

  function clear({ focus = false } = {}) {
    resetInternalSearch();

    search.setValue("");

    if (focus) {
      search.focus();
    }
  }

  /* =======================================================
     INIT
     ======================================================= */

  function init() {
    search.input.addEventListener(
      "input",

      handleInput,
    );

    search.input.addEventListener(
      "search",

      handleNativeSearchClear,
    );

    setupInfiniteScroll();

    loadPokemonSpeciesIndex().catch((error) => {
      console.error("Erro ao preparar o índice de busca:", error);
    });
  }

  /* =======================================================
     DESTROY
     ======================================================= */

  function destroy() {
    clearSearchTimeout();

    searchRequestId += 1;

    abortSearchRequest();

    stopInfiniteScroll();

    search.input.removeEventListener(
      "input",

      handleInput,
    );

    search.input.removeEventListener(
      "search",

      handleNativeSearchClear,
    );
  }

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    init,

    clear,

    suspend,

    resume,

    executeSearch,

    scheduleSearch,

    loadNextBatch,

    destroy,

    get isActive() {
      return isSearchMode;
    },

    get isLoading() {
      return isSearchLoading;
    },

    get totalResults() {
      return searchMatches.length;
    },

    get renderedResults() {
      return searchRenderedCount;
    },
  };
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateElements({
  search,

  grid,

  searchGrid,

  searchSentinel,
}) {
  if (!search || !(search.input instanceof HTMLInputElement)) {
    throw new Error("Search Feature: componente de busca inválido.");
  }

  if (!(grid instanceof Element)) {
    throw new Error("Search Feature: grid principal não informado.");
  }

  if (!(searchGrid instanceof Element)) {
    throw new Error("Search Feature: grid de resultados não informado.");
  }

  if (!(searchSentinel instanceof Element)) {
    throw new Error("Search Feature: sentinel não informado.");
  }
}

/* =========================================================
   BATCH VALIDATION
   ========================================================= */

function validateBatchSize(batchSize) {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error("Search Feature: tamanho de lote inválido.");
  }
}

/* =========================================================
   DEBOUNCE VALIDATION
   ========================================================= */

function validateDebounceTime(debounceTime) {
  if (!Number.isFinite(debounceTime) || debounceTime < 0) {
    throw new Error("Search Feature: tempo de debounce inválido.");
  }
}

/* =========================================================
   CALLBACK VALIDATION
   ========================================================= */

function validateCallback(
  callback,

  name,
) {
  if (callback !== null && typeof callback !== "function") {
    throw new Error(`Search Feature: callback "${name}" inválido.`);
  }
}