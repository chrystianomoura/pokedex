import { getPokemon } from "../api/pokeapi.js";

import {
  createPokemonCard,
  createPokemonCardSkeleton,
} from "../components/pokemon-card.js";

import {
  FAVORITES_CHANGE_EVENT,
  getFavoritePokemonIds,
} from "../services/favorites.js";

import { mapPokemonToCard } from "../services/pokemon.js";

/* =========================================================
   POKÉDEX — FAVORITES FEATURE
   ========================================================= */

/* =========================================================
   FACTORY
   ========================================================= */

export function createFavoritesFeature({ grid, emptyState }) {
  validateElement(grid, "Grid de favoritos");

  validateElement(emptyState, "Estado vazio de favoritos");

  let controller = null;

  let requestId = 0;

  let initialized = false;

  let destroyed = false;

  /* =======================================================
     INIT
     ======================================================= */

  async function init() {
    if (initialized) {
      return;
    }

    initialized = true;

    window.addEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange);

    await refresh();
  }

  /* =======================================================
     REFRESH
     ======================================================= */

  async function refresh() {
    if (destroyed) {
      return;
    }

    cancelCurrentRequest();

    const currentRequestId = ++requestId;

    controller = new AbortController();

    const favoriteIds = getFavoritePokemonIds();

    if (favoriteIds.length === 0) {
      renderEmpty();

      return;
    }

    renderLoading(favoriteIds.length);

    try {
      const pokemonList = await loadFavoritePokemon(
        favoriteIds,
        controller.signal,
      );

      if (!isCurrentRequest(currentRequestId)) {
        return;
      }

      renderPokemonList(pokemonList);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      if (!isCurrentRequest(currentRequestId)) {
        return;
      }

      console.error("Não foi possível carregar os Pokémon favoritos.", error);

      renderError();
    }
  }

  /* =======================================================
     FAVORITES CHANGE
     ======================================================= */

  function handleFavoritesChange() {
    refresh();
  }

  /* =======================================================
     LOAD FAVORITES
     ======================================================= */

  async function loadFavoritePokemon(favoriteIds, signal) {
    const pokemonList = await Promise.all(
      favoriteIds.map(async (pokemonId) => {
        const pokemon = await getPokemon(pokemonId, {
          signal,
        });

        return mapPokemonToCard(pokemon);
      }),
    );

    return pokemonList;
  }

  /* =======================================================
     RENDER LIST
     ======================================================= */

  function renderPokemonList(pokemonList) {
    grid.replaceChildren();

    emptyState.hidden = true;

    const fragment = document.createDocumentFragment();

    pokemonList.forEach((pokemon) => {
      fragment.append(createPokemonCard(pokemon));
    });

    grid.append(fragment);
  }

  /* =======================================================
     LOADING
     ======================================================= */

  function renderLoading(favoritesCount) {
    grid.replaceChildren();

    emptyState.hidden = true;

    const fragment = document.createDocumentFragment();

    const skeletonCount = Math.min(favoritesCount, 12);

    for (let index = 0; index < skeletonCount; index += 1) {
      fragment.append(createPokemonCardSkeleton());
    }

    grid.append(fragment);
  }

  /* =======================================================
     EMPTY
     ======================================================= */

  function renderEmpty() {
    grid.replaceChildren();

    emptyState.hidden = false;

    emptyState.dataset.state = "empty";

    emptyState.textContent =
      "Você ainda não adicionou nenhum Pokémon aos favoritos.";
  }

  /* =======================================================
     ERROR
     ======================================================= */

  function renderError() {
    grid.replaceChildren();

    emptyState.hidden = false;

    emptyState.dataset.state = "error";

    emptyState.textContent = "Não foi possível carregar seus favoritos agora.";
  }

  /* =======================================================
     REQUEST
     ======================================================= */

  function isCurrentRequest(currentRequestId) {
    return !destroyed && currentRequestId === requestId;
  }

  function cancelCurrentRequest() {
    if (!controller) {
      return;
    }

    controller.abort();

    controller = null;
  }

  /* =======================================================
     DESTROY
     ======================================================= */

  function destroy() {
    if (destroyed) {
      return;
    }

    destroyed = true;

    requestId += 1;

    cancelCurrentRequest();

    window.removeEventListener(FAVORITES_CHANGE_EVENT, handleFavoritesChange);
  }

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    init,

    refresh,

    destroy,

    get isInitialized() {
      return initialized;
    },
  };
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateElement(element, name) {
  if (!(element instanceof HTMLElement)) {
    throw new Error(`${name} não informado.`);
  }
}