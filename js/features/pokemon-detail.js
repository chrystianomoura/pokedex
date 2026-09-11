import {
  getEvolutionChain,
  getPokemon,
  getPokemonSpecies,
  getType,
} from "../api/pokeapi.js";

import { getPokemonDescriptionPtBr } from "../api/pokemon-descriptions.js";

import { mapPokemonDetail } from "../services/pokemon-detail.js";

import { calculatePokemonWeaknesses } from "../services/pokemon-weaknesses.js";

import {
  getEvolutionSpecies,
  mapEvolutionChain,
} from "../services/pokemon-evolution.js";

import {
  createPokemonDetail,
  createPokemonDetailSkeleton,
} from "../components/pokemon-detail.js";

/* =========================================================
   POKÉDEX — POKÉMON DETAIL FEATURE
   ========================================================= */

/* =========================================================
   DEFAULT BACK TARGET
   ========================================================= */

const DEFAULT_BACK_TARGET = Object.freeze({
  href: "/",

  label: "Pokédex",

  ariaLabel: "Voltar para a Pokédex",
});

/* =========================================================
   FACTORY
   ========================================================= */

export function createPokemonDetailFeature({
  host,

  backTarget = DEFAULT_BACK_TARGET,
} = {}) {
  validateHost(host);

  const detailBackTarget = normalizeBackTarget(backTarget);

  /* =======================================================
     STATE
     ======================================================= */

  let controller = null;

  let requestId = 0;

  let currentPokemon = null;

  let isLoading = false;

  /* =======================================================
     REQUEST CONTROL
     ======================================================= */

  function createController() {
    abort();

    controller = new AbortController();

    return controller;
  }

  function abort() {
    if (!controller) {
      return;
    }

    controller.abort();

    controller = null;
  }

  function isCurrentRequest(currentRequestId, currentController) {
    return !currentController.signal.aborted && currentRequestId === requestId;
  }

  /* =======================================================
     LOAD
     ======================================================= */

  async function load(pokemonIdentifier) {
    const identifier = normalizeIdentifier(pokemonIdentifier);

    requestId += 1;

    const currentRequestId = requestId;

    const currentController = createController();

    isLoading = true;

    currentPokemon = null;

    renderLoading();

    try {
      /* ===================================================
         POKÉMON / FORM
         =================================================== */

      const rawPokemon = await getPokemon(identifier, {
        signal: currentController.signal,
      });

      if (!isCurrentRequest(currentRequestId, currentController)) {
        return null;
      }

      /* ===================================================
         CANONICAL SPECIES
         =================================================== */

      const speciesIdentifier = getCanonicalSpeciesIdentifier(rawPokemon);

      /* ===================================================
         SPECIES + TYPE RELATIONS
         =================================================== */

      const [rawSpecies, typeRelations] = await Promise.all([
        getPokemonSpecies(speciesIdentifier, {
          signal: currentController.signal,
        }),

        loadPokemonTypeRelations(rawPokemon, currentController),
      ]);

      if (!isCurrentRequest(currentRequestId, currentController)) {
        return null;
      }

      /* ===================================================
         LOCALIZED CONTENT + EVOLUTION
         =================================================== */

      const [descriptionPtBr, evolution] = await Promise.all([
        loadPokemonDescriptionPtBr(rawSpecies, currentController),

        loadPokemonEvolution(rawSpecies, currentController),
      ]);

      if (!isCurrentRequest(currentRequestId, currentController)) {
        return null;
      }

      /* ===================================================
         WEAKNESSES
         =================================================== */

      const weaknesses = calculatePokemonWeaknesses(typeRelations);

      /* ===================================================
         MAP
         =================================================== */

      const pokemon = {
        ...mapPokemonDetail(rawPokemon, rawSpecies, descriptionPtBr),

        weaknesses,

        evolution,
      };

      currentPokemon = pokemon;

      renderPokemon(pokemon);

      return pokemon;
    } catch (error) {
      if (error.name === "AbortError") {
        return null;
      }

      if (currentRequestId !== requestId) {
        return null;
      }

      renderError(identifier);

      console.error("Erro ao carregar detalhe do Pokémon:", error);

      return null;
    } finally {
      if (currentRequestId === requestId) {
        isLoading = false;
      }
    }
  }

  /* =======================================================
     RENDER — LOADING
     ======================================================= */

  function renderLoading() {
    const skeleton = createPokemonDetailSkeleton();

    host.replaceChildren(skeleton);

    host.setAttribute("aria-busy", "true");
  }

  /* =======================================================
     RENDER — POKÉMON
     ======================================================= */

  function renderPokemon(pokemon) {
    const detail = createPokemonDetail(pokemon, {
      backTarget: detailBackTarget,
    });

    host.replaceChildren(detail);

    host.removeAttribute("aria-busy");
  }

  /* =======================================================
     RENDER — ERROR
     ======================================================= */

  function renderError(identifier) {
    const error = document.createElement("section");

    error.className = "pokemon-detail-error";

    error.setAttribute("role", "alert");

    /* =====================================================
       TITLE
       ===================================================== */

    const title = document.createElement("h1");

    title.className = "pokemon-detail-error__title";

    title.textContent = "Pokémon não encontrado";

    /* =====================================================
       DESCRIPTION
       ===================================================== */

    const description = document.createElement("p");

    description.className = "pokemon-detail-error__description";

    description.textContent = `Não foi possível carregar "${formatIdentifier(identifier)}".`;

    /* =====================================================
       BACK
       ===================================================== */

    const backLink = document.createElement("a");

    backLink.className = "pokemon-detail-error__back";

    backLink.href = detailBackTarget.href;

    backLink.setAttribute("aria-label", detailBackTarget.ariaLabel);

    backLink.textContent = `Voltar para ${detailBackTarget.label}`;

    /* =====================================================
       ASSEMBLY
       ===================================================== */

    error.append(title, description, backLink);

    host.replaceChildren(error);

    host.removeAttribute("aria-busy");
  }

  /* =======================================================
     DESTROY
     ======================================================= */

  function destroy() {
    requestId += 1;

    abort();

    isLoading = false;

    currentPokemon = null;

    host.removeAttribute("aria-busy");
  }

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    load,

    destroy,

    get pokemon() {
      return currentPokemon;
    },

    get isLoading() {
      return isLoading;
    },
  };
}

/* =========================================================
   TYPE RELATIONS
   ========================================================= */

async function loadPokemonTypeRelations(pokemon, controller) {
  const typeNames = getPokemonTypeNames(pokemon);

  if (typeNames.length === 0) {
    throw new Error("Não foi possível identificar os tipos do Pokémon.");
  }

  return Promise.all(
    typeNames.map((typeName) => {
      return getType(typeName, {
        signal: controller.signal,
      });
    }),
  );
}

/* =========================================================
   TYPE NAMES
   ========================================================= */

function getPokemonTypeNames(pokemon) {
  if (!Array.isArray(pokemon?.types)) {
    return [];
  }

  const typeNames = pokemon.types
    .map((item) => {
      return item?.type?.name ?? null;
    })
    .filter(Boolean);

  return [...new Set(typeNames)];
}

/* =========================================================
   PT-BR DESCRIPTION
   ========================================================= */

async function loadPokemonDescriptionPtBr(species, controller) {
  const speciesId = getCanonicalSpeciesId(species);

  try {
    return await getPokemonDescriptionPtBr(speciesId, {
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    console.warn(
      `Descrição PT-BR indisponível para o Pokémon #${String(
        speciesId,
      ).padStart(4, "0")}:`,
      error,
    );

    return null;
  }
}

/* =========================================================
   EVOLUTION
   ========================================================= */

async function loadPokemonEvolution(species, controller) {
  const evolutionChainId = getEvolutionChainId(species);

  if (!evolutionChainId) {
    return null;
  }

  try {
    /* =====================================================
       CHAIN
       ===================================================== */

    const rawEvolutionChain = await getEvolutionChain(evolutionChainId, {
      signal: controller.signal,
    });

    /* =====================================================
       SPECIES
       ===================================================== */

    const speciesNames = getEvolutionSpecies(rawEvolutionChain);

    if (speciesNames.length === 0) {
      return null;
    }

    /* =====================================================
       POKÉMON DATA
       ===================================================== */

    const evolutionEntries = await Promise.all(
      speciesNames.map(async (speciesName) => {
        const evolutionPokemon = await loadEvolutionPokemon(
          speciesName,
          controller,
        );

        return [speciesName, evolutionPokemon];
      }),
    );

    const pokemonBySpecies = new Map(evolutionEntries);

    /* =====================================================
       MAP TREE
       ===================================================== */

    return mapEvolutionChain(rawEvolutionChain, pokemonBySpecies);
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    console.warn("Cadeia de evolução temporariamente indisponível:", error);

    return null;
  }
}

/* =========================================================
   EVOLUTION POKÉMON
   ========================================================= */

async function loadEvolutionPokemon(speciesName, controller) {
  try {
    return await getPokemon(speciesName, {
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    /*
     * Algumas espécies possuem uma forma padrão cujo nome
     * do recurso /pokemon não é exatamente igual ao nome
     * canônico da espécie.
     *
     * Nesses casos buscamos a espécie e usamos sua variedade
     * marcada como padrão.
     */

    const rawSpecies = await getPokemonSpecies(speciesName, {
      signal: controller.signal,
    });

    const defaultPokemonName = getDefaultPokemonName(rawSpecies);

    if (!defaultPokemonName) {
      throw error;
    }

    return getPokemon(defaultPokemonName, {
      signal: controller.signal,
    });
  }
}

/* =========================================================
   DEFAULT VARIETY
   ========================================================= */

function getDefaultPokemonName(species) {
  if (!Array.isArray(species?.varieties)) {
    return null;
  }

  const defaultVariety = species.varieties.find((variety) => {
    return variety?.is_default === true;
  });

  const name = defaultVariety?.pokemon?.name;

  if (!name) {
    return null;
  }

  return String(name).trim().toLowerCase();
}

/* =========================================================
   EVOLUTION CHAIN ID
   ========================================================= */

function getEvolutionChainId(species) {
  const url = species?.evolution_chain?.url;

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
   CANONICAL SPECIES
   ========================================================= */

function getCanonicalSpeciesIdentifier(pokemon) {
  const speciesName = pokemon?.species?.name;

  if (!speciesName) {
    throw new Error(
      "Não foi possível identificar a espécie canônica do Pokémon.",
    );
  }

  return String(speciesName).trim().toLowerCase();
}

function getCanonicalSpeciesId(species) {
  const speciesId = Number(species?.id);

  if (!Number.isInteger(speciesId) || speciesId <= 0) {
    throw new Error("Não foi possível identificar o ID da espécie canônica.");
  }

  return speciesId;
}

/* =========================================================
   IDENTIFIER
   ========================================================= */

function normalizeIdentifier(value) {
  if (value === undefined || value === null) {
    throw new Error("Identificador do Pokémon não informado.");
  }

  const identifier = String(value).trim().toLowerCase();

  if (!identifier) {
    throw new Error("Identificador do Pokémon não informado.");
  }

  return identifier;
}

/* =========================================================
   BACK TARGET
   ========================================================= */

function normalizeBackTarget(backTarget) {
  const href = normalizeText(backTarget?.href);

  const label = normalizeText(backTarget?.label);

  const ariaLabel = normalizeText(backTarget?.ariaLabel);

  return {
    href: href || DEFAULT_BACK_TARGET.href,

    label: label || DEFAULT_BACK_TARGET.label,

    ariaLabel: ariaLabel || DEFAULT_BACK_TARGET.ariaLabel,
  };
}

/* =========================================================
   NORMALIZE TEXT
   ========================================================= */

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/* =========================================================
   FORMAT IDENTIFIER
   ========================================================= */

function formatIdentifier(identifier) {
  if (!identifier) {
    return "Pokémon";
  }

  if (/^\d+$/.test(identifier)) {
    return `#${String(Number(identifier)).padStart(4, "0")}`;
  }

  return identifier
    .split("-")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateHost(host) {
  if (!(host instanceof Element)) {
    throw new Error("Pokémon Detail Feature: host não informado.");
  }
}