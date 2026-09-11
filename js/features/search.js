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
  onModeChange,
} = {}) {
  validateElements({
    search,
    grid,
    searchGrid,
    searchSentinel,
  });

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
    if (searchController) {
      searchController.abort();
    }

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
     STATE
     ======================================================= */

  function resetSearchState() {
    searchMatches = [];

    searchRenderedCount = 0;

    isSearchLoading = false;
  }

  function setSearchMode(active) {
    isSearchMode = active;

    if (typeof onModeChange === "function") {
      onModeChange(isSearchMode);
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
        return getPokemon(id, {
          signal: controller.signal,
        });
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
    const normalizedQuery = normalizePokemonSearchQuery(query);

    /* =====================================================
       EMPTY QUERY
       ===================================================== */

    if (!normalizedQuery) {
      searchRequestId += 1;

      abortSearchRequest();

      resetSearchState();

      searchGrid.replaceChildren();

      search.setStatus("");

      setSearchMode(false);

      updateSentinel();

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

      searchMatches = searchPokemonSpecies(speciesIndex, normalizedQuery);

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
     DEBOUNCE
     ======================================================= */

  function scheduleSearch(query) {
    if (searchTimeout) {
      clearTimeout(searchTimeout);

      searchTimeout = null;
    }

    const normalizedQuery = normalizePokemonSearchQuery(query);

    if (!normalizedQuery) {
      executeSearch(query);

      return;
    }

    searchTimeout = setTimeout(() => {
      searchTimeout = null;

      executeSearch(query);
    }, debounceTime);
  }

  /* =======================================================
     INPUT EVENTS
     ======================================================= */

  function handleInput() {
    scheduleSearch(search.input.value);
  }

  function handleNativeSearchClear() {
    if (search.input.value !== "") {
      return;
    }

    scheduleSearch(search.input.value);
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
          isSearchLoading ||
          searchRenderedCount >= searchMatches.length
        ) {
          return;
        }

        loadNextBatch();
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
     CLEAR
     ======================================================= */

  function clear({ focus = false } = {}) {
    if (searchTimeout) {
      clearTimeout(searchTimeout);

      searchTimeout = null;
    }

    searchRequestId += 1;

    abortSearchRequest();

    resetSearchState();

    search.setValue("");

    search.setStatus("");

    searchGrid.replaceChildren();

    setSearchMode(false);

    updateSentinel();

    if (focus) {
      search.focus();
    }
  }

  /* =======================================================
     INIT
     ======================================================= */

  function init() {
    search.input.addEventListener("input", handleInput);

    search.input.addEventListener("search", handleNativeSearchClear);

    setupInfiniteScroll();

    loadPokemonSpeciesIndex().catch((error) => {
      console.error("Erro ao preparar o índice de busca:", error);
    });
  }

  /* =======================================================
     DESTROY
     ======================================================= */

  function destroy() {
    if (searchTimeout) {
      clearTimeout(searchTimeout);

      searchTimeout = null;
    }

    abortSearchRequest();

    stopInfiniteScroll();

    search.input.removeEventListener("input", handleInput);

    search.input.removeEventListener("search", handleNativeSearchClear);
  }

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    init,
    clear,
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

function validateElements({ search, grid, searchGrid, searchSentinel }) {
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