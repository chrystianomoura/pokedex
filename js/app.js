import { createPokemonSearch } from "./components/pokemon-search.js";

import { createNationalDexFeature } from "./features/national-dex.js";

import { createPokemonSearchFeature } from "./features/search.js";

import { createPokemonGenerationsFeature } from "./features/generations.js";

/* =========================================================
   POKÉDEX — APP
   ========================================================= */

const app = document.querySelector("#app");

if (!app) {
  throw new Error('Elemento "#app" não encontrado.');
}

/* =========================================================
   FEATURES
   ========================================================= */

let nationalDex = null;

let pokemonSearch = null;

let pokemonGenerations = null;

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

  /* =======================================================
     GENERATIONS
     ======================================================= */

  const generationHost = document.createElement("div");

  generationHost.className = "pokedex-page__generations";

  header.append(title, search.element, generationHost);

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
     LOAD MORE BUTTON
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
    sentinel,
    generationSentinel,
    searchSentinel,
    loadMoreButton,
  );

  return {
    page,
    grid,
    generationGrid,
    searchGrid,
    sentinel,
    generationSentinel,
    searchSentinel,
    loadMoreButton,
    generationHost,
    search,
  };
}

/* =========================================================
   VIEW
   ========================================================= */

function updateView({
  grid,
  generationGrid,
  searchGrid,
  sentinel,
  generationSentinel,
  searchSentinel,
  loadMoreButton,
}) {
  /* =======================================================
     SEARCH
     ======================================================= */

  if (pokemonSearch?.isActive) {
    grid.hidden = true;

    generationGrid.hidden = true;

    searchGrid.hidden = false;

    sentinel.hidden = true;

    generationSentinel.hidden = true;

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
   INIT
   ========================================================= */

async function init() {
  const {
    page,
    grid,
    generationGrid,
    searchGrid,
    sentinel,
    generationSentinel,
    searchSentinel,
    loadMoreButton,
    generationHost,
    search,
  } = createPage();

  app.replaceChildren(page);

  /* =======================================================
     VIEW CALLBACK
     ======================================================= */

  function handleModeChange() {
    updateView({
      grid,
      generationGrid,
      searchGrid,
      sentinel,
      generationSentinel,
      searchSentinel,
      loadMoreButton,
    });
  }

  /* =======================================================
     SEARCH FEATURE
     ======================================================= */

  pokemonSearch = createPokemonSearchFeature({
    search,

    grid,

    searchGrid,

    searchSentinel,

    onModeChange: handleModeChange,
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

    onModeChange: handleModeChange,
  });

  /* =======================================================
     NATIONAL DEX FEATURE
     ======================================================= */

  nationalDex = createNationalDexFeature({
    grid,

    sentinel,

    loadMoreButton,

    canLoad: () => {
      return !pokemonSearch.isActive && !pokemonGenerations.isActive;
    },
  });

  /* =======================================================
     LOAD MORE BUTTON
     ======================================================= */

  loadMoreButton.addEventListener("click", () => {
    if (pokemonSearch.isActive) {
      return;
    }

    if (pokemonGenerations.isActive) {
      pokemonGenerations.loadNextBatch();

      return;
    }

    nationalDex.loadMore();
  });

  /* =======================================================
     FEATURES INIT
     ======================================================= */

  pokemonSearch.init();

  await nationalDex.init();

  await pokemonGenerations.init();

  /* =======================================================
     INITIAL VIEW
     ======================================================= */

  handleModeChange();
}

/* =========================================================
   START
   ========================================================= */

init();