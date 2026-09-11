/* =========================================================
   POKÉDEX — FAVORITES SERVICE
   ========================================================= */

const FAVORITES_STORAGE_KEY = "pokedex:favorites:v1";

export const FAVORITES_CHANGE_EVENT = "pokedex:favoriteschange";

/* =========================================================
   GET FAVORITES
   ========================================================= */

export function getFavoritePokemonIds() {
  return readFavorites();
}

/* =========================================================
   CHECK FAVORITE
   ========================================================= */

export function isPokemonFavorite(pokemonId) {
  const id = normalizePokemonId(pokemonId);

  if (!id) {
    return false;
  }

  return readFavorites().includes(id);
}

/* =========================================================
   ADD FAVORITE
   ========================================================= */

export function addFavoritePokemon(pokemonId) {
  const id = requirePokemonId(pokemonId);

  const favorites = readFavorites();

  if (favorites.includes(id)) {
    return false;
  }

  const nextFavorites = [...favorites, id];

  writeFavorites(nextFavorites);

  notifyFavoritesChange({
    action: "add",

    pokemonId: id,

    favorites: nextFavorites,
  });

  return true;
}

/* =========================================================
   REMOVE FAVORITE
   ========================================================= */

export function removeFavoritePokemon(pokemonId) {
  const id = requirePokemonId(pokemonId);

  const favorites = readFavorites();

  if (!favorites.includes(id)) {
    return false;
  }

  const nextFavorites = favorites.filter((favoriteId) => {
    return favoriteId !== id;
  });

  writeFavorites(nextFavorites);

  notifyFavoritesChange({
    action: "remove",

    pokemonId: id,

    favorites: nextFavorites,
  });

  return true;
}

/* =========================================================
   TOGGLE FAVORITE
   ========================================================= */

export function toggleFavoritePokemon(pokemonId) {
  const id = requirePokemonId(pokemonId);

  if (isPokemonFavorite(id)) {
    removeFavoritePokemon(id);

    return false;
  }

  addFavoritePokemon(id);

  return true;
}

/* =========================================================
   READ
   ========================================================= */

function readFavorites() {
  try {
    const rawFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!rawFavorites) {
      return [];
    }

    const parsedFavorites = JSON.parse(rawFavorites);

    if (!Array.isArray(parsedFavorites)) {
      return [];
    }

    return normalizeFavoriteList(parsedFavorites);
  } catch (error) {
    console.warn("Não foi possível ler os favoritos salvos.", error);

    return [];
  }
}

/* =========================================================
   WRITE
   ========================================================= */

function writeFavorites(favorites) {
  const normalizedFavorites = normalizeFavoriteList(favorites);

  try {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,

      JSON.stringify(normalizedFavorites),
    );
  } catch (error) {
    throw new Error("Não foi possível salvar os favoritos no dispositivo.", {
      cause: error,
    });
  }
}

/* =========================================================
   NORMALIZE LIST
   ========================================================= */

function normalizeFavoriteList(favorites) {
  const normalizedFavorites = [];

  const knownIds = new Set();

  favorites.forEach((pokemonId) => {
    const id = normalizePokemonId(pokemonId);

    if (!id || knownIds.has(id)) {
      return;
    }

    knownIds.add(id);

    normalizedFavorites.push(id);
  });

  return normalizedFavorites;
}

/* =========================================================
   NORMALIZE ID
   ========================================================= */

function normalizePokemonId(pokemonId) {
  const id = Number(pokemonId);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/* =========================================================
   REQUIRE ID
   ========================================================= */

function requirePokemonId(pokemonId) {
  const id = normalizePokemonId(pokemonId);

  if (!id) {
    throw new Error("ID do Pokémon inválido para favoritos.");
  }

  return id;
}

/* =========================================================
   EVENT
   ========================================================= */

function notifyFavoritesChange({ action, pokemonId, favorites }) {
  window.dispatchEvent(
    new CustomEvent(FAVORITES_CHANGE_EVENT, {
      detail: {
        action,

        pokemonId,

        favorites: [...favorites],
      },
    }),
  );
}