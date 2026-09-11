/* =========================================================
   POKÉDEX — POKÉMON DETAIL SERVICE
   ========================================================= */

const DESCRIPTION_UNAVAILABLE =
  "Descrição em português temporariamente indisponível.";

/* =========================================================
   DETAIL
   ========================================================= */

export function mapPokemonDetail(pokemon, species, descriptionPtBr) {
  if (!pokemon) {
    throw new Error("Dados do Pokémon não informados.");
  }

  if (!species) {
    throw new Error("Dados da espécie não informados.");
  }

  const types = getPokemonTypes(pokemon.types);

  const speciesId = getSpeciesId(species, pokemon);

  return {
    id: pokemon.id,

    speciesId,

    number: formatPokemonNumber(speciesId),

    name: formatPokemonName(pokemon.name),

    slug: pokemon.name,

    speciesSlug: species.name,

    types,

    primaryType: types[0] ?? "normal",

    artwork: getPokemonArtwork(pokemon),

    shinyArtwork: getPokemonShinyArtwork(pokemon),

    height: formatPokemonHeight(pokemon.height),

    weight: formatPokemonWeight(pokemon.weight),

    description: normalizePokemonDescription(descriptionPtBr),

    evolutionChainId: getEvolutionChainId(species),
  };
}

/* =========================================================
   SPECIES
   ========================================================= */

function getSpeciesId(species, pokemon) {
  const speciesId = Number(species?.id);

  if (Number.isInteger(speciesId) && speciesId > 0) {
    return speciesId;
  }

  const pokemonId = Number(pokemon?.id);

  if (Number.isInteger(pokemonId) && pokemonId > 0) {
    return pokemonId;
  }

  throw new Error("Não foi possível identificar o número da espécie.");
}

/* =========================================================
   TYPES
   ========================================================= */

function getPokemonTypes(types = []) {
  if (!Array.isArray(types)) {
    return [];
  }

  return [...types]
    .sort((first, second) => {
      return first.slot - second.slot;
    })
    .map((item) => {
      return item?.type?.name ?? null;
    })
    .filter(Boolean);
}

/* =========================================================
   ARTWORK
   ========================================================= */

function getPokemonArtwork(pokemon) {
  return (
    pokemon.sprites?.other?.["official-artwork"]?.front_default ??
    pokemon.sprites?.front_default ??
    null
  );
}

function getPokemonShinyArtwork(pokemon) {
  return (
    pokemon.sprites?.other?.["official-artwork"]?.front_shiny ??
    pokemon.sprites?.front_shiny ??
    null
  );
}

/* =========================================================
   DESCRIPTION
   ========================================================= */

function normalizePokemonDescription(description) {
  if (typeof description !== "string" || !description.trim()) {
    return DESCRIPTION_UNAVAILABLE;
  }

  return String(description)
    .replace(/[\n\f\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   HEIGHT
   ========================================================= */

function formatPokemonHeight(height) {
  const value = Number(height);

  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  const meters = value / 10;

  return {
    value: meters,

    formatted: `${formatDecimal(meters)} m`,
  };
}

/* =========================================================
   WEIGHT
   ========================================================= */

function formatPokemonWeight(weight) {
  const value = Number(weight);

  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  const kilograms = value / 10;

  return {
    value: kilograms,

    formatted: `${formatDecimal(kilograms)} kg`,
  };
}

/* =========================================================
   EVOLUTION CHAIN
   ========================================================= */

function getEvolutionChainId(species) {
  const url = species.evolution_chain?.url;

  return getResourceId(url);
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

/* =========================================================
   FORMAT — NAME
   ========================================================= */

function formatPokemonName(name) {
  if (!name) {
    return "";
  }

  return String(name)
    .split("-")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/* =========================================================
   FORMAT — DECIMAL
   ========================================================= */

function formatDecimal(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,

    maximumFractionDigits: 1,
  }).format(value);
}