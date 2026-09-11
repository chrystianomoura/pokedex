/* =========================================================
   POKÉDEX — POKÉMON DETAIL SERVICE
   ========================================================= */

/* =========================================================
   DETAIL
   ========================================================= */

export function mapPokemonDetail(pokemon, species) {
  if (!pokemon) {
    throw new Error("Dados do Pokémon não informados.");
  }

  if (!species) {
    throw new Error("Dados da espécie não informados.");
  }

  const types = getPokemonTypes(pokemon.types);

  return {
    id: pokemon.id,

    number: formatPokemonNumber(pokemon.id),

    name: formatPokemonName(pokemon.name),

    slug: pokemon.name,

    types,

    primaryType: types[0] ?? "normal",

    artwork: getPokemonArtwork(pokemon),

    shinyArtwork: getPokemonShinyArtwork(pokemon),

    height: formatPokemonHeight(pokemon.height),

    weight: formatPokemonWeight(pokemon.weight),

    description: getPokemonDescription(species),

    evolutionChainId: getEvolutionChainId(species),
  };
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

function getPokemonDescription(species) {
  const entries = species.flavor_text_entries;

  if (!Array.isArray(entries) || entries.length === 0) {
    return "";
  }

  const preferredLanguages = ["pt-br", "pt", "en"];

  for (const language of preferredLanguages) {
    const entry = entries.find((item) => {
      return item?.language?.name?.toLowerCase() === language;
    });

    if (entry?.flavor_text) {
      return normalizeDescription(entry.flavor_text);
    }
  }

  const firstAvailableEntry = entries.find((entry) => {
    return Boolean(entry?.flavor_text);
  });

  return firstAvailableEntry
    ? normalizeDescription(firstAvailableEntry.flavor_text)
    : "";
}

/* =========================================================
   DESCRIPTION NORMALIZATION
   ========================================================= */

function normalizeDescription(description) {
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