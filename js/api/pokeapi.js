const API_BASE_URL = "https://pokeapi.co/api/v2";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(
      `Erro na PokéAPI: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function getPokemon(idOrName, options = {}) {
  if (idOrName === undefined || idOrName === null || idOrName === "") {
    throw new Error("É necessário informar o ID ou nome do Pokémon.");
  }

  const identifier = String(idOrName).trim().toLowerCase();

  return request(`/pokemon/${encodeURIComponent(identifier)}`, options);
}

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
