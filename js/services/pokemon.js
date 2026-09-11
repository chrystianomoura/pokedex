import { formatPokemonName } from "../utils/pokemon-name.js";

/* =========================================================
   POKÉDEX — POKÉMON SERVICE
   ========================================================= */

/* =========================================================
   CARD
   ========================================================= */

export function mapPokemonToCard(pokemon) {
  if (!pokemon) {
    throw new Error("Dados do Pokémon não informados.");
  }

  return {
    id: pokemon.id,

    number: formatPokemonNumber(pokemon.id),

    name: formatPokemonName(pokemon.name),

    types: [...pokemon.types]
      .sort((first, second) => {
        return first.slot - second.slot;
      })
      .map((item) => {
        return item.type.name;
      }),

    artwork:
      pokemon.sprites?.other?.["official-artwork"]?.front_default ??
      pokemon.sprites?.front_default ??
      null,
  };
}

/* =========================================================
   SPECIES REFERENCE
   ========================================================= */

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

/* =========================================================
   SPECIES LIST
   ========================================================= */

export function mapPokemonSpeciesList(speciesList = []) {
  return speciesList.map(mapPokemonSpeciesReference);
}

/* =========================================================
   RESOURCE ID
   ========================================================= */

function getResourceId(url) {
  if (!url) {
    return null;
  }

  const parts = String(url).split("/").filter(Boolean);

  const id = Number(parts.at(-1));

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/* =========================================================
   FORMAT — NUMBER
   ========================================================= */

function formatPokemonNumber(id) {
  return `#${String(id).padStart(4, "0")}`;
}