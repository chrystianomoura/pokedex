import { getPokemon, getPokemonSpeciesList } from "./api/pokeapi.js";

import { mapPokemonSpeciesList, mapPokemonToCard } from "./services/pokemon.js";

import {
  createPokemonCard,
  createPokemonCardSkeleton,
} from "./components/pokemon-card.js";

/* =========================================================
   POKÉDEX — APP
   ========================================================= */

const app = document.querySelector("#app");

if (!app) {
  throw new Error('Elemento "#app" não encontrado.');
}

const PAGE_SIZE = 24;

let currentOffset = 0;
let isLoading = false;
let hasMorePokemon = true;
let infiniteScrollObserver = null;

/* =========================================================
   PAGE
   ========================================================= */

function createPage() {
  const page = document.createElement("main");

  page.className = "pokedex-page";

  const header = document.createElement("header");

  header.className = "pokedex-page__header";

  const title = document.createElement("h1");

  title.className = "pokedex-page__title";

  title.textContent = "Pokédex";

  const grid = document.createElement("section");

  grid.className = "pokemon-grid";

  grid.setAttribute("aria-label", "Lista de Pokémon");

  /* =======================================================
     INFINITE SCROLL SENTINEL
     ======================================================= */

  const sentinel = document.createElement("div");

  sentinel.className = "pokedex-page__sentinel";

  sentinel.setAttribute("aria-hidden", "true");

  /* =======================================================
     FALLBACK BUTTON
     ======================================================= */

  const loadMoreButton = document.createElement("button");

  loadMoreButton.className = "pokedex-page__load-more";

  loadMoreButton.type = "button";

  loadMoreButton.textContent = "Carregar mais";

  header.append(title);

  page.append(header, grid, sentinel, loadMoreButton);

  return {
    page,
    grid,
    sentinel,
    loadMoreButton,
  };
}

/* =========================================================
   DATA
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
   RENDER — POKÉMON
   ========================================================= */

function renderPokemonList(grid, pokemonList) {
  const fragment = document.createDocumentFragment();

  pokemonList.forEach((pokemon) => {
    fragment.append(createPokemonCard(pokemon));
  });

  grid.append(fragment);
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
   INFINITE SCROLL
   ========================================================= */

function setupInfiniteScroll(sentinel, onLoadMore) {
  if (!("IntersectionObserver" in window)) {
    return;
  }

  infiniteScrollObserver = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;

      if (!entry.isIntersecting || isLoading || !hasMorePokemon) {
        return;
      }

      onLoadMore();
    },
    {
      root: null,

      /*
       * Começa a carregar antes de o usuário
       * chegar realmente ao final da lista.
       */
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
   INIT
   ========================================================= */

async function init() {
  const { page, grid, sentinel, loadMoreButton } = createPage();

  app.replaceChildren(page);

  async function handleLoadMore() {
    if (isLoading || !hasMorePokemon) {
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
     FALLBACK
     ======================================================= */

  loadMoreButton.addEventListener("click", handleLoadMore);

  /* =======================================================
     FIRST BATCH
     ======================================================= */

  await handleLoadMore();

  /* =======================================================
     AUTOMATIC LOADING
     ======================================================= */

  setupInfiniteScroll(sentinel, handleLoadMore);
}

init();