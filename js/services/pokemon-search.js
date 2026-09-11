/* =========================================================
   POKÉDEX — POKÉMON SEARCH SERVICE
   ========================================================= */

const MAX_POKEMON_NUMBER_LENGTH = 4;

/* =========================================================
   NORMALIZATION
   ========================================================= */

/**
 * Normaliza o texto digitado pelo usuário.
 *
 * Exemplos válidos:
 *
 * "Pikachu" -> "pikachu"
 * " PIKA "  -> "pika"
 * "25"      -> "25"
 * "025"     -> "025"
 * "#025"    -> "025"
 *
 * O zero à esquerda é preservado nesta etapa para podermos
 * validar o tamanho original da pesquisa numérica.
 */
export function normalizePokemonSearchQuery(query) {
  if (query === null || query === undefined) {
    return "";
  }

  const normalizedQuery = String(query).trim().toLowerCase();

  if (!normalizedQuery) {
    return "";
  }

  if (normalizedQuery.startsWith("#")) {
    return normalizedQuery.slice(1);
  }

  return normalizedQuery;
}

/* =========================================================
   NUMBER SEARCH
   ========================================================= */

export function isPokemonNumberSearch(query) {
  const normalizedQuery = normalizePokemonSearchQuery(query);

  return isNumericSearch(normalizedQuery);
}

/* =========================================================
   SEARCH
   ========================================================= */

/**
 * Procura correspondências dentro de uma lista
 * de referências de espécies.
 *
 * Formato esperado:
 *
 * {
 *   id: 25,
 *   name: "pikachu"
 * }
 */
export function searchPokemonSpecies(speciesList, query) {
  const normalizedQuery = normalizePokemonSearchQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  if (!Array.isArray(speciesList)) {
    return [];
  }

  /* =======================================================
     NUMERIC SEARCH
     ======================================================= */

  if (isNumericSearch(normalizedQuery)) {
    if (normalizedQuery.length > MAX_POKEMON_NUMBER_LENGTH) {
      return [];
    }

    const id = Number.parseInt(normalizedQuery, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return [];
    }

    return speciesList.filter((pokemon) => {
      return pokemon.id === id;
    });
  }

  /* =======================================================
     NAME SEARCH
     ======================================================= */

  return speciesList.filter((pokemon) => {
    return pokemon.name.toLowerCase().includes(normalizedQuery);
  });
}

/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

function isNumericSearch(value) {
  return /^\d+$/.test(value);
}