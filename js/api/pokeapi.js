const API_BASE_URL = "https://pokeapi.co/api/v2";

/* =========================================================
   API ERRORS
   ========================================================= */

export class PokeApiHttpError extends Error {
  constructor(message, { status, statusText, endpoint } = {}) {
    super(message);

    this.name = "PokeApiHttpError";

    this.status = status ?? null;
    this.statusText = statusText ?? "";
    this.endpoint = endpoint ?? "";
  }
}

export class PokeApiNetworkError extends Error {
  constructor(message, { endpoint, cause } = {}) {
    super(message, {
      cause,
    });

    this.name = "PokeApiNetworkError";

    this.endpoint = endpoint ?? "";
  }
}

/* =========================================================
   ERROR HELPERS
   ========================================================= */

export function isPokeApiNotFoundError(error) {
  return error instanceof PokeApiHttpError && error.status === 404;
}

export function isPokeApiNetworkError(error) {
  return error instanceof PokeApiNetworkError;
}

/* =========================================================
   REQUEST
   ========================================================= */

async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal: options.signal,
    });
  } catch (error) {
    /*
     * AbortController faz parte do fluxo normal da aplicação.
     * Não transformamos AbortError em erro de rede.
     */

    if (error?.name === "AbortError") {
      throw error;
    }

    throw new PokeApiNetworkError("Não foi possível conectar à PokéAPI.", {
      endpoint,
      cause: error,
    });
  }

  if (!response.ok) {
    throw new PokeApiHttpError(
      `Erro na PokéAPI: ${response.status} ${response.statusText}`,
      {
        status: response.status,
        statusText: response.statusText,
        endpoint,
      },
    );
  }

  return response.json();
}

/* =========================================================
   IDENTIFIER
   ========================================================= */

function normalizeIdentifier(value, errorMessage) {
  if (value === undefined || value === null || value === "") {
    throw new Error(errorMessage);
  }

  const identifier = String(value).trim().toLowerCase();

  if (!identifier) {
    throw new Error(errorMessage);
  }

  return identifier;
}

/* =========================================================
   POKÉMON
   ========================================================= */

export async function getPokemon(idOrName, options = {}) {
  const identifier = normalizeIdentifier(
    idOrName,
    "É necessário informar o ID ou nome do Pokémon.",
  );

  return request(`/pokemon/${encodeURIComponent(identifier)}`, options);
}

/* =========================================================
   POKÉMON SPECIES
   ========================================================= */

export async function getPokemonSpecies(idOrName, options = {}) {
  const identifier = normalizeIdentifier(
    idOrName,
    "É necessário informar o ID ou nome da espécie.",
  );

  return request(`/pokemon-species/${encodeURIComponent(identifier)}`, options);
}

/* =========================================================
   SPECIES LIST
   ========================================================= */

export async function getPokemonSpeciesList(
  { limit = 24, offset = 0 } = {},
  options = {},
) {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('"limit" deve ser um número inteiro maior que zero.');
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error(
      '"offset" deve ser um número inteiro maior ou igual a zero.',
    );
  }

  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return request(`/pokemon-species?${searchParams.toString()}`, options);
}

/* =========================================================
   COMPLETE SPECIES INDEX
   ========================================================= */

export async function getAllPokemonSpecies(options = {}) {
  const firstPage = await getPokemonSpeciesList(
    {
      limit: 1,
      offset: 0,
    },
    options,
  );

  const totalSpecies = firstPage.count;

  if (!Number.isInteger(totalSpecies) || totalSpecies <= 0) {
    return [];
  }

  const completeList = await getPokemonSpeciesList(
    {
      limit: totalSpecies,
      offset: 0,
    },
    options,
  );

  return completeList.results;
}

/* =========================================================
   EVOLUTION CHAIN
   ========================================================= */

export async function getEvolutionChain(id, options = {}) {
  const identifier = normalizeIdentifier(
    id,
    "É necessário informar o ID da cadeia evolutiva.",
  );

  return request(`/evolution-chain/${encodeURIComponent(identifier)}`, options);
}

/* =========================================================
   TYPES
   ========================================================= */

export async function getType(idOrName, options = {}) {
  const identifier = normalizeIdentifier(
    idOrName,
    "É necessário informar o tipo do Pokémon.",
  );

  return request(`/type/${encodeURIComponent(identifier)}`, options);
}

/* =========================================================
   GENERATIONS
   ========================================================= */

export async function getGenerationList(options = {}) {
  return request("/generation", options);
}

export async function getGeneration(idOrName, options = {}) {
  const identifier = normalizeIdentifier(
    idOrName,
    "É necessário informar a geração.",
  );

  return request(`/generation/${encodeURIComponent(identifier)}`, options);
}