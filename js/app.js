import { createPokemonSearch } from "./components/pokemon-search.js";

import { createPokemonFilters } from "./components/pokemon-filters.js";

import { createFavoritesLink } from "./components/favorites-link.js";

import { createNationalDexFeature } from "./features/national-dex.js";

import { createPokemonSearchFeature } from "./features/search.js";

import { createPokemonGenerationsFeature } from "./features/generations.js";

import { createPokemonFiltersFeature } from "./features/filters.js";

import { createPokemonDetailFeature } from "./features/pokemon-detail.js";

import { createFavoritesFeature } from "./features/favorites.js";

import { createRouter } from "./router/router.js";

import { formatPokemonName } from "./utils/pokemon-name.js";

/* =========================================================
   POKÉDEX — APP
   ========================================================= */

const app = document.querySelector("#app");

if (!app) {
  throw new Error('Elemento "#app" não encontrado.');
}

/* =========================================================
   ROUTES
   ========================================================= */

const routes = [
  {
    name: "home",

    path: "/",
  },

  {
    name: "favorites",

    path: "/favorites",
  },

  {
    name: "pokemon",

    path: "/pokemon/:pokemon",
  },
];

/* =========================================================
   ROUTER
   ========================================================= */

const router = createRouter({
  routes,

  onRouteChange: handleRouteChange,
});

/* =========================================================
   FEATURES
   ========================================================= */

let nationalDex = null;

let pokemonSearch = null;

let pokemonGenerations = null;

let pokemonFilters = null;

let pokemonDetail = null;

let pokemonFavorites = null;

/* =========================================================
   HOME STATE
   ========================================================= */

let homeView = null;

let homeInitializationPromise = null;

let filterInteractionId = 0;

const homeNavigationState = {
  scrollY: 0,

  generationScrollLeft: 0,
};

/* =========================================================
   POKÉMON DETAIL — BACK TARGET
   ========================================================= */

const POKEMON_DETAIL_BACK_TARGETS = Object.freeze({
  home: Object.freeze({
    href: "/",

    label: "Pokédex",

    ariaLabel: "Voltar para a Pokédex",
  }),

  favorites: Object.freeze({
    href: "/favorites",

    label: "Favoritos",

    ariaLabel: "Voltar para os favoritos",
  }),
});

let pokemonDetailBackTarget = POKEMON_DETAIL_BACK_TARGETS.home;

/* =========================================================
   HOME PAGE
   ========================================================= */

function createHomePage() {
  const page = document.createElement("main");

  page.className = "pokedex-page";

  /* =======================================================
     HEADER
     ======================================================= */

  const header = document.createElement("header");

  header.className = "pokedex-page__header";

  /* =======================================================
     TITLE ROW
     ======================================================= */

  const titleRow = document.createElement("div");

  titleRow.className = "pokedex-page__title-row";

  const title = document.createElement("h1");

  title.className = "pokedex-page__title";

  title.textContent = "Pokédex";

  const favoritesLink = createFavoritesLink();

  titleRow.append(title, favoritesLink);

  /* =======================================================
     SEARCH
     ======================================================= */

  const search = createPokemonSearch();

  /* =======================================================
     FILTERS
     ======================================================= */

  const filters = createPokemonFilters({
    onApply: handleApplyPokemonFilters,

    onClear: handleClearPokemonFilters,
  });

  /* =======================================================
     GENERATIONS
     ======================================================= */

  const generationHost = document.createElement("div");

  generationHost.className = "pokedex-page__generations";

  header.append(titleRow, search.element, filters.element, generationHost);

  /* =======================================================
     NATIONAL DEX GRID
     ======================================================= */

  const grid = document.createElement("section");

  grid.className = "pokemon-grid pokemon-grid--national";

  grid.setAttribute("aria-label", "National Dex");

  /* =======================================================
     GENERATION GRID
     ======================================================= */

  const generationGrid = document.createElement("section");

  generationGrid.className = "pokemon-grid pokemon-grid--generation";

  generationGrid.setAttribute("aria-label", "Pokémon da geração selecionada");

  generationGrid.hidden = true;

  /* =======================================================
     SEARCH GRID
     ======================================================= */

  const searchGrid = document.createElement("section");

  searchGrid.className = "pokemon-grid pokemon-grid--search";

  searchGrid.setAttribute("aria-label", "Resultados da pesquisa");

  searchGrid.hidden = true;

  /* =======================================================
     FILTER GRID
     ======================================================= */

  const filterGrid = document.createElement("section");

  filterGrid.className = "pokemon-grid pokemon-grid--filters";

  filterGrid.setAttribute("aria-label", "Pokémon filtrados");

  filterGrid.hidden = true;

  /* =======================================================
     FILTER EMPTY / ERROR STATE
     ======================================================= */

  const filterEmptyState = document.createElement("p");

  filterEmptyState.className = "pokedex-page__filters-empty";

  filterEmptyState.setAttribute("aria-live", "polite");

  filterEmptyState.hidden = true;

  /* =======================================================
     NATIONAL DEX SENTINEL
     ======================================================= */

  const sentinel = document.createElement("div");

  sentinel.className = "pokedex-page__sentinel";

  sentinel.setAttribute("aria-hidden", "true");

  /* =======================================================
     GENERATION SENTINEL
     ======================================================= */

  const generationSentinel = document.createElement("div");

  generationSentinel.className =
    "pokedex-page__sentinel pokedex-page__generation-sentinel";

  generationSentinel.setAttribute("aria-hidden", "true");

  generationSentinel.hidden = true;

  /* =======================================================
     SEARCH SENTINEL
     ======================================================= */

  const searchSentinel = document.createElement("div");

  searchSentinel.className =
    "pokedex-page__sentinel pokedex-page__search-sentinel";

  searchSentinel.setAttribute("aria-hidden", "true");

  searchSentinel.hidden = true;

  /* =======================================================
     FILTER SENTINEL
     ======================================================= */

  const filterSentinel = document.createElement("div");

  filterSentinel.className =
    "pokedex-page__sentinel pokedex-page__filter-sentinel";

  filterSentinel.setAttribute("aria-hidden", "true");

  filterSentinel.hidden = true;

  /* =======================================================
     LOAD MORE
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
    generationGrid,
    searchGrid,
    filterGrid,
    filterEmptyState,
    sentinel,
    generationSentinel,
    searchSentinel,
    filterSentinel,
    loadMoreButton,
  );

  return {
    page,

    grid,

    generationGrid,

    searchGrid,

    filterGrid,

    filterEmptyState,

    sentinel,

    generationSentinel,

    searchSentinel,

    filterSentinel,

    loadMoreButton,

    generationHost,

    search,

    filters,
  };
}

/* =========================================================
   FAVORITES PAGE
   ========================================================= */

function createFavoritesPage() {
  const page = document.createElement("main");

  page.className = "pokedex-page pokedex-page--favorites";

  /* =======================================================
     HEADER
     ======================================================= */

  const header = document.createElement("header");

  header.className = "pokedex-page__header pokedex-page__favorites-header";

  /* =======================================================
     TITLE ROW
     ======================================================= */

  const titleRow = document.createElement("div");

  titleRow.className = "pokedex-page__favorites-title-row";

  const backLink = createFavoritesBackLink();

  const title = document.createElement("h1");

  title.className = "pokedex-page__title";

  title.textContent = "Favoritos";

  const balance = document.createElement("span");

  balance.className = "pokedex-page__favorites-title-balance";

  balance.setAttribute("aria-hidden", "true");

  titleRow.append(backLink, title, balance);

  header.append(titleRow);

  /* =======================================================
     EMPTY / ERROR STATE
     ======================================================= */

  const emptyState = document.createElement("p");

  emptyState.className = "pokedex-page__favorites-empty";

  emptyState.setAttribute("aria-live", "polite");

  emptyState.hidden = true;

  /* =======================================================
     GRID
     ======================================================= */

  const grid = document.createElement("section");

  grid.className = "pokemon-grid pokemon-grid--favorites";

  grid.setAttribute("aria-label", "Pokémon favoritos");

  /* =======================================================
     ASSEMBLY
     ======================================================= */

  page.append(header, emptyState, grid);

  return {
    page,

    grid,

    emptyState,
  };
}

/* =========================================================
   FAVORITES — BACK LINK
   ========================================================= */

function createFavoritesBackLink() {
  const link = document.createElement("a");

  link.className = "pokedex-page__favorites-back";

  link.href = "/";

  link.setAttribute("aria-label", "Voltar para a Pokédex");

  link.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  return link;
}

/* =========================================================
   FILTERS — APPLY
   ========================================================= */

async function handleApplyPokemonFilters(nextFilters) {
  if (!homeView || !pokemonFilters || !pokemonSearch) {
    return;
  }

  filterInteractionId += 1;

  const interactionId = filterInteractionId;

  /* =======================================================
     DEFAULT FILTERS
     ======================================================= */

  if (!homeView.filters.isActive) {
    pokemonFilters.clear();

    homeView.search.setStatus("");

    pokemonSearch.resume();

    updateCurrentHomeView();

    return;
  }

  /* =======================================================
     ADVANCED FILTER MODE
     ======================================================= */

  pokemonSearch.suspend();

  homeView.search.setStatus("Aplicando filtros...");

  await pokemonFilters.apply(
    nextFilters,

    {
      searchQuery: homeView.search.input.value,
    },
  );

  if (interactionId !== filterInteractionId) {
    return;
  }

  updateFilteredSearchStatus();

  updateCurrentHomeView();
}

/* =========================================================
   FILTERS — CLEAR
   ========================================================= */

function handleClearPokemonFilters() {
  if (!homeView || !pokemonFilters || !pokemonSearch) {
    return;
  }

  filterInteractionId += 1;

  pokemonFilters.clear();

  homeView.search.setStatus("");

  pokemonSearch.resume();

  updateCurrentHomeView();
}

/* =========================================================
   FILTERS — DELEGATED SEARCH
   ========================================================= */

async function handleDelegatedPokemonSearch(query) {
  if (!homeView || !pokemonFilters || !homeView.filters.isActive) {
    return;
  }

  filterInteractionId += 1;

  const interactionId = filterInteractionId;

  homeView.search.setStatus("Buscando Pokémon...");

  await pokemonFilters.apply(
    homeView.filters.getFilters(),

    {
      searchQuery: query,
    },
  );

  if (interactionId !== filterInteractionId) {
    return;
  }

  updateFilteredSearchStatus();

  updateCurrentHomeView();
}

/* =========================================================
   FILTERS — RESULT STATUS
   ========================================================= */

function updateFilteredSearchStatus() {
  if (!homeView || !pokemonFilters || !homeView.filters.isActive) {
    return;
  }

  const total = pokemonFilters.totalPokemon;

  /*
   * O estado de zero resultados pertence à Filters Feature.
   * Assim evitamos repetir a mesma mensagem abaixo da busca.
   */

  if (total === 0) {
    homeView.search.setStatus("");

    return;
  }

  if (total === 1) {
    homeView.search.setStatus("1 Pokémon encontrado.");

    return;
  }

  homeView.search.setStatus(`${total} Pokémon encontrados.`);
}

/* =========================================================
   HOME VIEW
   ========================================================= */

function updateHomeView({
  grid,

  generationGrid,

  searchGrid,

  filterGrid,

  filterEmptyState,

  sentinel,

  generationSentinel,

  searchSentinel,

  filterSentinel,

  loadMoreButton,

  generationHost,
}) {
  /* =======================================================
     FILTERS
     ======================================================= */

  if (pokemonFilters?.isActive) {
    grid.hidden = true;

    generationGrid.hidden = true;

    searchGrid.hidden = true;

    filterGrid.hidden = false;

    sentinel.hidden = true;

    generationSentinel.hidden = true;

    searchSentinel.hidden = true;

    generationHost.hidden = true;

    /*
     * A própria Filters Feature decide se o botão deve
     * aparecer. Em zero resultados ele permanece oculto.
     */

    pokemonFilters.updateSentinel();

    pokemonFilters.updateLoadMoreButton();

    return;
  }

  /* =======================================================
     FILTER MODE CLEANUP
     ======================================================= */

  filterGrid.hidden = true;

  filterSentinel.hidden = true;

  filterEmptyState.hidden = true;

  generationHost.hidden = false;

  /* =======================================================
     SEARCH
     ======================================================= */

  if (pokemonSearch?.isActive) {
    grid.hidden = true;

    generationGrid.hidden = true;

    searchGrid.hidden = false;

    sentinel.hidden = true;

    generationSentinel.hidden = true;

    searchSentinel.hidden = false;

    loadMoreButton.hidden = true;

    return;
  }

  /* =======================================================
     GENERATION
     ======================================================= */

  if (pokemonGenerations?.isActive) {
    grid.hidden = true;

    generationGrid.hidden = false;

    searchGrid.hidden = true;

    sentinel.hidden = true;

    searchSentinel.hidden = true;

    generationSentinel.hidden =
      pokemonGenerations.renderedPokemon >= pokemonGenerations.totalPokemon;

    loadMoreButton.hidden = false;

    pokemonGenerations.updateLoadMoreButton();

    return;
  }

  /* =======================================================
     NATIONAL DEX
     ======================================================= */

  grid.hidden = false;

  generationGrid.hidden = true;

  searchGrid.hidden = true;

  generationSentinel.hidden = true;

  searchSentinel.hidden = true;

  loadMoreButton.hidden = false;

  nationalDex?.updateSentinel();

  nationalDex?.updateLoadMoreButton();
}

/* =========================================================
   CURRENT HOME VIEW
   ========================================================= */

function updateCurrentHomeView() {
  if (!homeView) {
    return;
  }

  updateHomeView({
    grid: homeView.grid,

    generationGrid: homeView.generationGrid,

    searchGrid: homeView.searchGrid,

    filterGrid: homeView.filterGrid,

    filterEmptyState: homeView.filterEmptyState,

    sentinel: homeView.sentinel,

    generationSentinel: homeView.generationSentinel,

    searchSentinel: homeView.searchSentinel,

    filterSentinel: homeView.filterSentinel,

    loadMoreButton: homeView.loadMoreButton,

    generationHost: homeView.generationHost,
  });
}

/* =========================================================
   HOME INITIALIZATION
   ========================================================= */

function initializeHome() {
  if (!homeInitializationPromise) {
    homeInitializationPromise = initializeHomeFeatures();
  }

  return homeInitializationPromise;
}

async function initializeHomeFeatures() {
  homeView = createHomePage();

  const {
    grid,

    generationGrid,

    searchGrid,

    filterGrid,

    filterEmptyState,

    sentinel,

    generationSentinel,

    searchSentinel,

    filterSentinel,

    loadMoreButton,

    generationHost,

    search,

    filters,
  } = homeView;

  /* =======================================================
     VIEW CALLBACK
     ======================================================= */

  function handleModeChange() {
    updateCurrentHomeView();
  }

  /* =======================================================
     FILTERS FEATURE
     ======================================================= */

  pokemonFilters = createPokemonFiltersFeature({
    grid: filterGrid,

    sentinel: filterSentinel,

    loadMoreButton,

    emptyState: filterEmptyState,

    onModeChange: handleModeChange,
  });

  /* =======================================================
     SEARCH FEATURE
     ======================================================= */

  pokemonSearch = createPokemonSearchFeature({
    search,

    grid,

    searchGrid,

    searchSentinel,

    onModeChange: handleModeChange,

    shouldDelegateSearch: () => {
      return filters.isActive;
    },

    onDelegatedSearch: (query) => {
      void handleDelegatedPokemonSearch(query);
    },
  });

  /* =======================================================
     GENERATIONS FEATURE
     ======================================================= */

  pokemonGenerations = createPokemonGenerationsFeature({
    generationHost,

    generationGrid,

    generationSentinel,

    loadMoreButton,

    search,

    searchFeature: pokemonSearch,

    onModeChange: () => {
      /*
       * Se o usuário escolher uma geração pelos chips
       * enquanto filtros avançados estiverem ativos,
       * saímos do modo avançado.
       */

      if (filters.isActive) {
        filterInteractionId += 1;

        filters.reset({
          notify: false,
        });

        pokemonFilters.clear();

        search.setStatus("");
      }

      handleModeChange();
    },
  });

  /* =======================================================
     NATIONAL DEX FEATURE
     ======================================================= */

  nationalDex = createNationalDexFeature({
    grid,

    sentinel,

    loadMoreButton,

    canLoad: () => {
      return (
        !pokemonFilters.isActive &&
        !pokemonSearch.isActive &&
        !pokemonGenerations.isActive
      );
    },
  });

  /* =======================================================
     LOAD MORE
     ======================================================= */

  loadMoreButton.addEventListener("click", () => {
    /* ===================================================
         FILTERS
         =================================================== */

    if (pokemonFilters.isActive) {
      void pokemonFilters.loadNextBatch();

      return;
    }

    /* ===================================================
         SEARCH
         =================================================== */

    if (pokemonSearch.isActive) {
      return;
    }

    /* ===================================================
         GENERATION
         =================================================== */

    if (pokemonGenerations.isActive) {
      void pokemonGenerations.loadNextBatch();

      return;
    }

    /* ===================================================
         NATIONAL DEX
         =================================================== */

    void nationalDex.loadMore();
  });

  /* =======================================================
     FEATURE INIT
     ======================================================= */

  pokemonFilters.init();

  pokemonSearch.init();

  await nationalDex.init();

  await pokemonGenerations.init();

  /* =======================================================
     INITIAL VIEW
     ======================================================= */

  handleModeChange();
}

/* =========================================================
   HOME NAVIGATION STATE
   ========================================================= */

function saveHomeNavigationState() {
  if (!homeView) {
    return;
  }

  homeView.filters?.close();

  homeNavigationState.scrollY = window.scrollY;

  const generationList = homeView.generationHost.querySelector(
    ".pokemon-generation__list",
  );

  homeNavigationState.generationScrollLeft = generationList?.scrollLeft ?? 0;
}

function restoreHomeNavigationState() {
  if (!homeView) {
    return;
  }

  requestAnimationFrame(() => {
    if (router.currentRoute?.name !== "home") {
      return;
    }

    const generationList = homeView.generationHost.querySelector(
      ".pokemon-generation__list",
    );

    if (generationList) {
      generationList.scrollLeft = homeNavigationState.generationScrollLeft;
    }

    window.scrollTo({
      top: homeNavigationState.scrollY,

      left: 0,

      behavior: "instant",
    });
  });
}

/* =========================================================
   HOME MOUNT
   ========================================================= */

async function mountHome() {
  pokemonDetailBackTarget = POKEMON_DETAIL_BACK_TARGETS.home;

  pokemonDetail?.destroy();

  pokemonDetail = null;

  pokemonFavorites?.destroy();

  pokemonFavorites = null;

  await initializeHome();

  /*
   * A inicialização da Home é assíncrona.
   *
   * Durante os awaits acima, a rota pode ter mudado.
   * Nesse caso, esta renderização ficou obsoleta e não deve
   * substituir a página correspondente à rota atual.
   */

  if (router.currentRoute?.name !== "home") {
    return;
  }

  app.replaceChildren(homeView.page);

  updateCurrentHomeView();

  document.title = "Pokédex";

  restoreHomeNavigationState();
}

/* =========================================================
   FAVORITES ROUTE
   ========================================================= */

async function mountFavorites() {
  pokemonDetailBackTarget = POKEMON_DETAIL_BACK_TARGETS.favorites;

  saveHomeNavigationState();

  pokemonDetail?.destroy();

  pokemonDetail = null;

  pokemonFavorites?.destroy();

  pokemonFavorites = null;

  /* =======================================================
     PAGE
     ======================================================= */

  const favoritesView = createFavoritesPage();

  app.replaceChildren(favoritesView.page);

  window.scrollTo({
    top: 0,

    left: 0,

    behavior: "instant",
  });

  document.title = "Favoritos | Pokédex";

  /* =======================================================
     FEATURE
     ======================================================= */

  const favoritesFeature = createFavoritesFeature({
    grid: favoritesView.grid,

    emptyState: favoritesView.emptyState,
  });

  pokemonFavorites = favoritesFeature;

  await favoritesFeature.init();

  /*
   * O carregamento dos favoritos é assíncrono.
   *
   * Se a rota mudar durante a requisição, a feature anterior
   * já terá sido destruída e não deve continuar ativa.
   */

  if (
    router.currentRoute?.name !== "favorites" ||
    pokemonFavorites !== favoritesFeature
  ) {
    return;
  }
}

/* =========================================================
   POKÉMON ROUTE
   ========================================================= */

async function mountPokemonRoute(route) {
  saveHomeNavigationState();

  pokemonFavorites?.destroy();

  pokemonFavorites = null;

  pokemonDetail?.destroy();

  pokemonDetail = null;

  const pokemon = route.params.pokemon;

  /* =======================================================
     PAGE
     ======================================================= */

  const page = document.createElement("main");

  page.className = "pokedex-page";

  /* =======================================================
     DETAIL HOST
     ======================================================= */

  const detailHost = document.createElement("div");

  detailHost.className = "pokedex-page__pokemon-detail";

  page.append(detailHost);

  app.replaceChildren(page);

  window.scrollTo({
    top: 0,

    left: 0,

    behavior: "instant",
  });

  /* =======================================================
     FEATURE
     ======================================================= */

  const detailFeature = createPokemonDetailFeature({
    host: detailHost,

    backTarget: pokemonDetailBackTarget,
  });

  pokemonDetail = detailFeature;

  /* =======================================================
     INITIAL TITLE
     ======================================================= */

  const routeName = formatPokemonRouteName(pokemon);

  document.title = `${routeName} | Pokédex`;

  /* =======================================================
     LOAD
     ======================================================= */

  const loadedPokemon = await detailFeature.load(pokemon);

  /*
   * O carregamento da PokéAPI é assíncrono.
   *
   * A rota pode mudar antes da resposta chegar.
   * Nesse caso, não atualizamos o título nem qualquer
   * estado pertencente à rota antiga.
   */

  if (
    router.currentRoute?.name !== "pokemon" ||
    router.currentRoute?.params?.pokemon !== pokemon ||
    pokemonDetail !== detailFeature
  ) {
    return;
  }

  if (!loadedPokemon) {
    return;
  }

  document.title = `${loadedPokemon.name} | Pokédex`;
}

/* =========================================================
   NOT FOUND
   ========================================================= */

function mountNotFound() {
  saveHomeNavigationState();

  pokemonDetail?.destroy();

  pokemonDetail = null;

  pokemonFavorites?.destroy();

  pokemonFavorites = null;

  const page = document.createElement("main");

  page.className = "pokedex-page";

  const title = document.createElement("h1");

  title.className = "pokedex-page__title";

  title.textContent = "Página não encontrada";

  const backLink = document.createElement("a");

  backLink.href = "/";

  backLink.textContent = "Voltar para a Pokédex";

  page.append(title, backLink);

  app.replaceChildren(page);

  window.scrollTo({
    top: 0,

    left: 0,

    behavior: "instant",
  });

  document.title = "Página não encontrada | Pokédex";
}

/* =========================================================
   ROUTE CHANGE
   ========================================================= */

function handleRouteChange(route) {
  switch (route.name) {
    case "home":
      void mountHome();

      break;

    case "favorites":
      void mountFavorites();

      break;

    case "pokemon":
      void mountPokemonRoute(route);

      break;

    default:
      mountNotFound();
  }
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatPokemonRouteName(pokemon) {
  if (!pokemon) {
    return "Pokémon";
  }

  if (/^\d+$/.test(pokemon)) {
    return `#${Number(pokemon)}`;
  }

  return formatPokemonName(pokemon);
}

/* =========================================================
   START
   ========================================================= */

router.start();