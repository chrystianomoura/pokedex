const MAX_POKEMON_NUMBER_LENGTH = 4;

/* =========================================================
   NORMALIZE QUERY
   ========================================================= */

export function normalizePokemonSearchQuery(query) {
  if (query === null || query === undefined) {
    return "";
  }

  const normalizedQuery = String(query).trim().toLowerCase();

  if (!normalizedQuery) {
    return "";
  }

  /*
   * Permitimos apenas um único "#" opcional
   * antes de uma pesquisa numérica.
   *
   * Exemplos válidos:
   * 25
   * 025
   * 0025
   * #25
   * #025
   * #0025
   *
   * Exemplos inválidos:
   * ##25
   * ###25
   * #pikachu
   */
  if (/^#\d+$/.test(normalizedQuery)) {
    return normalizedQuery.slice(1);
  }

  /*
   * Se existir qualquer "#" que não corresponda
   * ao formato acima, mantemos a string intacta.
   *
   * Isso é importante porque a query pode passar
   * pela normalização mais de uma vez sem transformar
   * "##999" em "#999" e depois em "999".
   */
  if (normalizedQuery.includes("#")) {
    return normalizedQuery;
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

export function searchPokemonSpecies(speciesList, query) {
  const normalizedQuery = normalizePokemonSearchQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  if (!Array.isArray(speciesList)) {
    return [];
  }

  /* =======================================================
     INVALID HASH
     ======================================================= */

  if (normalizedQuery.includes("#")) {
    return [];
  }

  /* =======================================================
     NUMBER
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
     NAME
     ======================================================= */

  return speciesList.filter((pokemon) => {
    return pokemon.name.toLowerCase().includes(normalizedQuery);
  });
}

/* =========================================================
   HELPERS
   ========================================================= */

function isNumericSearch(value) {
  return /^\d+$/.test(value);
}