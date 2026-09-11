import { formatPokemonName } from "../utils/pokemon-name.js";

/* =========================================================
   POKÉDEX — POKÉMON EVOLUTION SERVICE
   ========================================================= */

/* =========================================================
   PUBLIC API
   ========================================================= */

export function getEvolutionSpecies(evolutionChain) {
  validateEvolutionChain(evolutionChain);

  const species = [];

  collectSpecies(evolutionChain.chain, species);

  return species;
}

/* =========================================================
   MAP EVOLUTION TREE
   ========================================================= */

export function mapEvolutionChain(evolutionChain, pokemonBySpecies) {
  validateEvolutionChain(evolutionChain);

  if (!(pokemonBySpecies instanceof Map)) {
    throw new Error("Mapa de Pokémon da evolução não informado.");
  }

  return mapEvolutionNode(evolutionChain.chain, pokemonBySpecies);
}

/* =========================================================
   COLLECT SPECIES
   ========================================================= */

function collectSpecies(node, target) {
  const speciesName = getSpeciesName(node);

  if (speciesName && !target.includes(speciesName)) {
    target.push(speciesName);
  }

  const evolutions = Array.isArray(node?.evolves_to) ? node.evolves_to : [];

  evolutions.forEach((evolution) => {
    collectSpecies(evolution, target);
  });
}

/* =========================================================
   NODE
   ========================================================= */

function mapEvolutionNode(node, pokemonBySpecies) {
  const speciesName = getSpeciesName(node);

  if (!speciesName) {
    throw new Error("Espécie inválida na cadeia de evolução.");
  }

  const pokemon = pokemonBySpecies.get(speciesName);

  if (!pokemon) {
    throw new Error(
      `Dados de "${speciesName}" não encontrados na cadeia de evolução.`,
    );
  }

  const evolutions = Array.isArray(node.evolves_to) ? node.evolves_to : [];

  return {
    id: pokemon.id,

    number: formatPokemonNumber(pokemon.id),

    name: formatPokemonName(pokemon.name),

    slug: pokemon.name,

    artwork: getPokemonArtwork(pokemon),

    evolution: mapEvolutionRequirement(node.evolution_details),

    children: evolutions.map((child) => {
      return mapEvolutionNode(child, pokemonBySpecies);
    }),
  };
}

/* =========================================================
   EVOLUTION REQUIREMENT
   ========================================================= */

function mapEvolutionRequirement(evolutionDetails) {
  if (!Array.isArray(evolutionDetails) || evolutionDetails.length === 0) {
    return null;
  }

  const detail = evolutionDetails[0];

  return {
    trigger: detail?.trigger?.name ?? null,

    minLevel: normalizePositiveNumber(detail?.min_level),

    minHappiness: normalizePositiveNumber(detail?.min_happiness),

    minBeauty: normalizePositiveNumber(detail?.min_beauty),

    minAffection: normalizePositiveNumber(detail?.min_affection),

    item: detail?.item?.name ?? null,

    heldItem: detail?.held_item?.name ?? null,

    knownMove: detail?.known_move?.name ?? null,

    knownMoveType: detail?.known_move_type?.name ?? null,

    location: detail?.location?.name ?? null,

    timeOfDay: normalizeText(detail?.time_of_day),

    gender: normalizeNumber(detail?.gender),

    needsOverworldRain: Boolean(detail?.needs_overworld_rain),

    turnUpsideDown: Boolean(detail?.turn_upside_down),

    relativePhysicalStats: normalizeNumber(detail?.relative_physical_stats),

    partySpecies: detail?.party_species?.name ?? null,

    partyType: detail?.party_type?.name ?? null,

    tradeSpecies: detail?.trade_species?.name ?? null,
  };
}

/* =========================================================
   SPECIES
   ========================================================= */

function getSpeciesName(node) {
  const name = node?.species?.name;

  if (!name) {
    return null;
  }

  return String(name).trim().toLowerCase();
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

/* =========================================================
   FORMAT — NUMBER
   ========================================================= */

function formatPokemonNumber(id) {
  return `#${String(id).padStart(4, "0")}`;
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizePositiveNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return number;
}

function normalizeNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  return text || null;
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateEvolutionChain(evolutionChain) {
  if (!evolutionChain || !evolutionChain.chain) {
    throw new Error("Cadeia de evolução não informada.");
  }
}