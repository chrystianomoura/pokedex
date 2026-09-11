/* =========================================================
   POKÉDEX — POKÉMON SERVICE
   ========================================================= */

/**
 * Converte os dados completos de um Pokémon vindos da PokéAPI
 * para o formato utilizado pelos cards da aplicação.
 */
export function mapPokemonToCard(pokemon) {
  if (!pokemon) {
    throw new Error("Dados do Pokémon não informados.");
  }

  return {
    id: pokemon.id,

    number: formatPokemonNumber(pokemon.id),

    name: formatPokemonName(pokemon.name),

    types: [...pokemon.types]
      .sort((a, b) => a.slot - b.slot)
      .map((item) => item.type.name),

    artwork:
      pokemon.sprites?.other?.["official-artwork"]?.front_default ??
      pokemon.sprites?.front_default ??
      null,
  };
}

/**
 * Converte uma entrada retornada por /pokemon-species
 * para uma referência simples da National Dex.
 *
 * Exemplo:
 *
 * {
 *   name: "bulbasaur",
 *   url: "https://pokeapi.co/api/v2/pokemon-species/1/"
 * }
 *
 * vira:
 *
 * {
 *   id: 1,
 *   name: "bulbasaur"
 * }
 */
export function mapPokemonSpeciesReference(species) {
  if (!species) {
    throw new Error("Dados da espécie não informados.");
  }

  const id = getResourceId(species.url);

  if (!id) {
    throw new Error(
      `Não foi possível identificar o ID da espécie "${species.name}".`,
    );
  }

  return {
    id,
    name: species.name,
  };
}

/**
 * Normaliza uma lista retornada por /pokemon-species.
 */
export function mapPokemonSpeciesList(speciesList = []) {
  return speciesList.map(mapPokemonSpeciesReference);
}

/**
 * Extrai o ID numérico de uma URL da PokéAPI.
 *
 * Exemplo:
 * https://pokeapi.co/api/v2/pokemon-species/25/
 * -> 25
 */
function getResourceId(url) {
  if (!url) {
    return null;
  }

  const parts = url.split("/").filter(Boolean);

  const id = Number(parts.at(-1));

  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Formata o número da National Dex.
 *
 * 1    -> #001
 * 25   -> #025
 * 1025 -> #1025
 */
function formatPokemonNumber(id) {
  return `#${String(id).padStart(3, "0")}`;
}

/**
 * Formata nomes retornados pela PokéAPI.
 *
 * "mr-mime"   -> "Mr Mime"
 * "tapu-koko" -> "Tapu Koko"
 */
function formatPokemonName(name) {
  if (!name) {
    return "";
  }

  return name
    .split("-")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}