import { getPokemon, getPokemonSpeciesList } from "../api/pokeapi.js";

import {
  mapPokemonSpeciesList,
  mapPokemonToCard,
} from "../services/pokemon.js";

import {
  createPokemonCard,
  createPokemonCardSkeleton,
} from "../components/pokemon-card.js";

/* =========================================================
   POKÉDEX — NATIONAL DEX FEATURE
   ========================================================= */

const DEFAULT_PAGE_SIZE = 24;

const DEFAULT_ROOT_MARGIN = "0px 0px 600px 0px";

/* =========================================================
   FACTORY
   ========================================================= */

export function createNationalDexFeature({
  grid,
  sentinel,
  loadMoreButton,
  pageSize = DEFAULT_PAGE_SIZE,
  canLoad = () => true,
} = {}) {
  validateElements({
    grid,
    sentinel,
    loadMoreButton,
  });

  /* =======================================================
     STATE
     ======================================================= */

  let currentOffset = 0;

  let isLoading = false;

  let hasMorePokemon = true;

  let observer = null;

  /* =======================================================
     DATA
     ======================================================= */

  async function fetchNextBatch() {
    if (isLoading || !hasMorePokemon || !canLoad()) {
      return [];
    }

    isLoading = true;

    try {
      const speciesResponse = await getPokemonSpeciesList({
        limit: pageSize,
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

  /* =======================================================
     RENDER
     ======================================================= */

  function renderPokemonList(pokemonList) {
    const fragment = document.createDocumentFragment();

    pokemonList.forEach((pokemon) => {
      fragment.append(createPokemonCard(pokemon));
    });

    grid.append(fragment);
  }

  function renderSkeletons(amount = pageSize) {
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
     LOAD MORE
     ======================================================= */

  async function loadMore() {
    if (isLoading || !hasMorePokemon || !canLoad()) {
      return;
    }

    const skeletons = renderSkeletons(pageSize);

    updateLoadMoreButton();

    try {
      const pokemonList = await fetchNextBatch();

      removeSkeletons(skeletons);

      renderPokemonList(pokemonList);
    } catch (error) {
      removeSkeletons(skeletons);

      console.error("Erro ao carregar a Pokédex:", error);
    } finally {
      updateLoadMoreButton();

      updateSentinel();

      if (!hasMorePokemon) {
        stopInfiniteScroll();
      }
    }
  }

  /* =======================================================
     LOAD MORE BUTTON
     ======================================================= */

  function updateLoadMoreButton() {
    loadMoreButton.disabled = isLoading || !hasMorePokemon;

    if (isLoading) {
      loadMoreButton.textContent = "Carregando...";

      return;
    }

    if (!hasMorePokemon) {
      loadMoreButton.textContent = "Todos os Pokémon carregados";

      return;
    }

    loadMoreButton.textContent = "Carregar mais";
  }

  /* =======================================================
     SENTINEL
     ======================================================= */

  function updateSentinel() {
    sentinel.hidden = !hasMorePokemon;
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

        if (
          !entry.isIntersecting ||
          isLoading ||
          !hasMorePokemon ||
          !canLoad()
        ) {
          return;
        }

        loadMore();
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
     INIT
     ======================================================= */

  async function init() {
    updateLoadMoreButton();

    await loadMore();

    setupInfiniteScroll();
  }

  /* =======================================================
     DESTROY
     ======================================================= */

  function destroy() {
    stopInfiniteScroll();
  }

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    init,
    loadMore,
    destroy,
    updateLoadMoreButton,
    updateSentinel,

    get isLoading() {
      return isLoading;
    },

    get hasMorePokemon() {
      return hasMorePokemon;
    },

    get loadedCount() {
      return currentOffset;
    },
  };
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateElements({ grid, sentinel, loadMoreButton }) {
  if (!(grid instanceof Element)) {
    throw new Error("National Dex: grid não informado.");
  }

  if (!(sentinel instanceof Element)) {
    throw new Error("National Dex: sentinel não informado.");
  }

  if (!(loadMoreButton instanceof HTMLButtonElement)) {
    throw new Error("National Dex: botão de carregamento não informado.");
  }
}