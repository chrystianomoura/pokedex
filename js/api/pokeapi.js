const API_BASE_URL = "https://pokeapi.co/api/v2";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(
      `PokéAPI respondeu com status ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

export async function getPokemon(identifier, options = {}) {
  const normalizedIdentifier = String(identifier).trim().toLowerCase();

  return request(`/pokemon/${normalizedIdentifier}`, options);
}

export async function getPokemonList({
  limit = 20,
  offset = 0,
  signal,
} = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return request(`/pokemon?${params.toString()}`, { signal });
}