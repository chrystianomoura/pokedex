import {
  getAllPokemonSpecies,
  getPokemon,
  getPokemonSpeciesList,
} from "./api/pokeapi.js";

import { mapPokemonSpeciesList, mapPokemonToCard } from "./services/pokemon.js";

import {
  normalizePokemonSearchQuery,
  searchPokemonSpecies,
} from "./services/pokemon-search.js";

import {
  createPokemonCard,
  createPokemonCardSkeleton,
} from "./components/pokemon-card.js";

import { createPokemonSearch } from "./components/pokemon-search.js";

/* =========================================================
   POKÉDEX — APP
   ========================================================= */

const app = document.querySelector("#app");

if (!app) {
  throw new Error('Elemento "#app" não encontrado.');
}

/* =========================================================
   CONFIG
   ========================================================= */

const PAGE_SIZE = 24;

const SEARCH_BATCH_SIZE = 12;

const SEARCH_DEBOUNCE_TIME = 250;

/* =========================================================
   STATE — NATIONAL DEX
   ========================================================= */

let currentOffset = 0;

let isLoading = false;

let hasMorePokemon = true;

let infiniteScrollObserver = null;

/* =========================================================
   STATE — SEARCH INDEX
   ========================================================= */

let pokemonSpeciesIndex = [];

let pokemonSpeciesIndexPromise = null;

/* =========================================================
   STATE — SEARCH
   ========================================================= */

let isSearchMode = false;

let searchTimeout = null;

let searchController = null;

let searchObserver = null;

let searchRequestId = 0;

let searchMatches = [];

let searchRenderedCount = 0;

let isSearchLoading = false;

/* =========================================================
   PAGE
   ========================================================= */

function createPage() {
  const page = document.createElement("main");

  page.className = "pokedex-page";

  /* =======================================================
     HEADER
     ======================================================= */

  const header = document.createElement("header");

  header.className = "pokedex-page__header";

  const title = document.createElement("h1");

  title.className = "pokedex-page__title";

  title.textContent = "Pokédex";

  /* =======================================================
     SEARCH
     ======================================================= */

  const search = createPokemonSearch();

  header.append(title, search.element);

  /* =======================================================
     NATIONAL DEX GRID
     ======================================================= */

  const grid = document.createElement("section");

  grid.className = "pokemon-grid pokemon-grid--national";

  grid.setAttribute("aria-label", "Lista de Pokémon");

  /* =======================================================
     SEARCH GRID
     ======================================================= */

  const searchGrid = document.createElement("section");

  searchGrid.className = "pokemon-grid pokemon-grid--search";

  searchGrid.setAttribute("aria-label", "Resultados da pesquisa");

  searchGrid.hidden = true;

  /* =======================================================
     NATIONAL DEX SENTINEL
     ======================================================= */

  const sentinel = document.createElement("div");

  sentinel.className = "pokedex-page__sentinel";

  sentinel.setAttribute("aria-hidden", "true");

  /* =======================================================
     SEARCH SENTINEL
     ======================================================= */

  const searchSentinel = document.createElement("div");

  searchSentinel.className =
    "pokedex-page__sentinel pokedex-page__search-sentinel";

  searchSentinel.setAttribute("aria-hidden", "true");

  searchSentinel.hidden = true;

  /* =======================================================
     FALLBACK BUTTON
     ======================================================= */

  const loadMoreButton = document.createElement("button");

  loadMoreButton.className = "pokedex-page__load-more";

  loadMoreButton.type = "button";

  loadMoreButton.textContent = "Carregar mais";

  /* =======================================================
     ASSEMBLY
     ======================================================= */

  page.append(
    header,
    grid,
    searchGrid,
    sentinel,
    searchSentinel,
    loadMoreButton,
  );

  return {
    page,
    grid,
    searchGrid,
    sentinel,
    searchSentinel,
    loadMoreButton,
    search,
  };
}

/* =========================================================
   DATA — NATIONAL DEX
   ========================================================= */

async function loadPokemonBatch() {
  if (isLoading || !hasMorePokemon) {
    return [];
  }

  isLoading = true;

  try {
    const speciesResponse = await getPokemonSpeciesList({
      limit: PAGE_SIZE,
      offset: currentOffset,
    });

    const speciesReferences = mapPokemonSpeciesList(speciesResponse.results);

    const requests = speciesReferences.map(({ id }) => {
      return getPokemon(id);
    });

    const rawPokemonList = await Promise.all(requests);

    const pokemonList = rawPokemonList.map(mapPokemonToCard);

    currentOffset += speciesReferences.length;

    hasMorePokemon = Boolean(speciesResponse.next);

    return pokemonList;
  } finally {
    isLoading = false;
  }
}

/* =========================================================
   DATA — SEARCH INDEX
   ========================================================= */

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

/* =========================================================
   SEARCH REQUEST CONTROL
   ========================================================= */

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

/* =========================================================
   SEARCH STATE
   ========================================================= */

function resetSearchState() {
  searchMatches = [];

  searchRenderedCount = 0;

  isSearchLoading = false;
}

/* =========================================================
   SEARCH MODE
   ========================================================= */

function setSearchMode({
  active,
  grid,
  searchGrid,
  sentinel,
  searchSentinel,
  loadMoreButton,
}) {
  isSearchMode = active;

  grid.hidden = active;

  searchGrid.hidden = !active;

  sentinel.hidden = active;

  searchSentinel.hidden =
    !active || searchRenderedCount >= searchMatches.length;

  loadMoreButton.hidden = active;
}

/* =========================================================
   RENDER — POKÉMON
   ========================================================= */

function createPokemonListFragment(pokemonList) {
  const fragment = document.createDocumentFragment();

  pokemonList.forEach((pokemon) => {
    fragment.append(createPokemonCard(pokemon));
  });

  return fragment;
}

function renderPokemonList(grid, pokemonList) {
  grid.append(createPokemonListFragment(pokemonList));
}

/* =========================================================
   RENDER — SKELETONS
   ========================================================= */

function renderSkeletons(grid, amount = PAGE_SIZE) {
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

/* =========================================================
   SEARCH STATUS
   ========================================================= */

function updateSearchStatus(search) {
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

/* =========================================================
   SEARCH — LOAD NEXT BATCH
   ========================================================= */

async function loadSearchBatch({
  search,
  searchGrid,
  searchSentinel,
  requestId,
  controller,
}) {
  if (isSearchLoading || searchRenderedCount >= searchMatches.length) {
    return;
  }

  isSearchLoading = true;

  const batch = searchMatches.slice(
    searchRenderedCount,
    searchRenderedCount + SEARCH_BATCH_SIZE,
  );

  const skeletons = renderSkeletons(searchGrid, batch.length);

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

    renderPokemonList(searchGrid, pokemonList);

    searchRenderedCount += pokemonList.length;

    updateSearchStatus(search);

    searchSentinel.hidden = searchRenderedCount >= searchMatches.length;
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

/* =========================================================
   SEARCH
   ========================================================= */

async function executeSearch({
  query,
  search,
  grid,
  searchGrid,
  sentinel,
  searchSentinel,
  loadMoreButton,
}) {
  const normalizedQuery = normalizePokemonSearchQuery(query);

  /* =======================================================
     EMPTY QUERY
     ======================================================= */

  if (!normalizedQuery) {
    searchRequestId += 1;

    abortSearchRequest();

    resetSearchState();

    searchGrid.replaceChildren();

    search.setStatus("");

    setSearchMode({
      active: false,
      grid,
      searchGrid,
      sentinel,
      searchSentinel,
      loadMoreButton,
    });

    return;
  }

  /* =======================================================
     NEW SEARCH
     ======================================================= */

  searchRequestId += 1;

  const requestId = searchRequestId;

  const controller = createSearchController();

  resetSearchState();

  searchGrid.replaceChildren();

  search.setStatus("Buscando Pokémon...");

  setSearchMode({
    active: true,
    grid,
    searchGrid,
    sentinel,
    searchSentinel,
    loadMoreButton,
  });

  try {
    const speciesIndex = await loadPokemonSpeciesIndex();

    if (controller.signal.aborted || requestId !== searchRequestId) {
      return;
    }

    searchMatches = searchPokemonSpecies(speciesIndex, normalizedQuery);

    /* =====================================================
       NO RESULTS
       ===================================================== */

    if (searchMatches.length === 0) {
      searchGrid.replaceChildren();

      searchSentinel.hidden = true;

      updateSearchStatus(search);

      return;
    }

    /* =====================================================
       FIRST SEARCH BATCH
       ===================================================== */

    await loadSearchBatch({
      search,
      searchGrid,
      searchSentinel,
      requestId,
      controller,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    searchGrid.replaceChildren();

    searchSentinel.hidden = true;

    search.setStatus("Não foi possível realizar a pesquisa.");

    console.error("Erro ao pesquisar Pokémon:", error);
  }
}

/* =========================================================
   SEARCH — DEBOUNCE
   ========================================================= */

function scheduleSearch(options) {
  if (searchTimeout) {
    clearTimeout(searchTimeout);

    searchTimeout = null;
  }

  const normalizedQuery = normalizePokemonSearchQuery(options.query);

  if (!normalizedQuery) {
    executeSearch(options);

    return;
  }

  searchTimeout = setTimeout(() => {
    searchTimeout = null;

    executeSearch(options);
  }, SEARCH_DEBOUNCE_TIME);
}

/* =========================================================
   LOAD MORE BUTTON
   ========================================================= */

function updateLoadMoreButton(button) {
  button.disabled = isLoading || !hasMorePokemon;

  if (isLoading) {
    button.textContent = "Carregando...";

    return;
  }

  if (!hasMorePokemon) {
    button.textContent = "Todos os Pokémon carregados";

    return;
  }

  button.textContent = "Carregar mais";
}

/* =========================================================
   NATIONAL DEX — INFINITE SCROLL
   ========================================================= */

function setupInfiniteScroll(sentinel, onLoadMore) {
  if (!("IntersectionObserver" in window)) {
    return;
  }

  infiniteScrollObserver = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;

      if (
        !entry.isIntersecting ||
        isLoading ||
        !hasMorePokemon ||
        isSearchMode
      ) {
        return;
      }

      onLoadMore();
    },
    {
      root: null,

      rootMargin: "0px 0px 600px 0px",

      threshold: 0,
    },
  );

  infiniteScrollObserver.observe(sentinel);
}

function stopInfiniteScroll() {
  if (!infiniteScrollObserver) {
    return;
  }

  infiniteScrollObserver.disconnect();

  infiniteScrollObserver = null;
}

/* =========================================================
   SEARCH — INFINITE SCROLL
   ========================================================= */

function setupSearchInfiniteScroll(searchSentinel, onLoadMore) {
  if (!("IntersectionObserver" in window)) {
    return;
  }

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

      onLoadMore();
    },
    {
      root: null,

      rootMargin: "0px 0px 400px 0px",

      threshold: 0,
    },
  );

  searchObserver.observe(searchSentinel);
}

/* =========================================================
   INIT
   ========================================================= */

async function init() {
  const {
    page,
    grid,
    searchGrid,
    sentinel,
    searchSentinel,
    loadMoreButton,
    search,
  } = createPage();

  app.replaceChildren(page);

  /* =======================================================
     NATIONAL DEX LOADING
     ======================================================= */

  async function handleLoadMore() {
    if (isLoading || !hasMorePokemon || isSearchMode) {
      return;
    }

    const skeletons = renderSkeletons(grid, PAGE_SIZE);

    updateLoadMoreButton(loadMoreButton);

    try {
      const pokemonList = await loadPokemonBatch();

      removeSkeletons(skeletons);

      renderPokemonList(grid, pokemonList);
    } catch (error) {
      removeSkeletons(skeletons);

      console.error("Erro ao carregar a Pokédex:", error);
    } finally {
      updateLoadMoreButton(loadMoreButton);

      if (!hasMorePokemon) {
        stopInfiniteScroll();
      }
    }
  }

  /* =======================================================
     SEARCH OPTIONS
     ======================================================= */

  function getSearchOptions() {
    return {
      query: search.input.value,

      search,

      grid,

      searchGrid,

      sentinel,

      searchSentinel,

      loadMoreButton,
    };
  }

  /* =======================================================
     SEARCH INPUT
     ======================================================= */

  search.input.addEventListener("input", () => {
    scheduleSearch(getSearchOptions());
  });

  /* =======================================================
     NATIVE SEARCH CLEAR
     ======================================================= */

  search.input.addEventListener("search", () => {
    if (search.input.value !== "") {
      return;
    }

    scheduleSearch(getSearchOptions());
  });

  /* =======================================================
     SEARCH INFINITE SCROLL
     ======================================================= */

  setupSearchInfiniteScroll(searchSentinel, () => {
    if (!searchController) {
      return;
    }

    loadSearchBatch({
      search,

      searchGrid,

      searchSentinel,

      requestId: searchRequestId,

      controller: searchController,
    });
  });

  /* =======================================================
     FALLBACK BUTTON
     ======================================================= */

  loadMoreButton.addEventListener("click", handleLoadMore);

  /* =======================================================
     FIRST NATIONAL DEX BATCH
     ======================================================= */

  await handleLoadMore();

  /* =======================================================
     NATIONAL DEX INFINITE SCROLL
     ======================================================= */

  setupInfiniteScroll(sentinel, handleLoadMore);

  /* =======================================================
     SEARCH INDEX — BACKGROUND PRELOAD
     ======================================================= */

  loadPokemonSpeciesIndex().catch((error) => {
    console.error("Erro ao preparar o índice de busca:", error);
  });
}

init();