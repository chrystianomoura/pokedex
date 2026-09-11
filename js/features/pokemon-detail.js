import { getPokemon, getPokemonSpecies } from "../api/pokeapi.js";

import { getPokemonDescriptionPtBr } from "../api/pokemon-descriptions.js";

import { mapPokemonDetail } from "../services/pokemon-detail.js";

import {
  createPokemonDetail,
  createPokemonDetailSkeleton,
} from "../components/pokemon-detail.js";

/* =========================================================
   POKÉDEX — POKÉMON DETAIL FEATURE
   ========================================================= */

/* =========================================================
   FACTORY
   ========================================================= */

export function createPokemonDetailFeature({ host } = {}) {
  validateHost(host);

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

      const rawSpecies = await getPokemonSpecies(speciesIdentifier, {
        signal: currentController.signal,
      });

      if (!isCurrentRequest(currentRequestId, currentController)) {
        return null;
      }

      /* ===================================================
         PT-BR DESCRIPTION
         =================================================== */

      const descriptionPtBr = await loadPokemonDescriptionPtBr(
        rawSpecies,
        currentController,
      );

      if (!isCurrentRequest(currentRequestId, currentController)) {
        return null;
      }

      /* ===================================================
         MAP
         =================================================== */

      const pokemon = mapPokemonDetail(rawPokemon, rawSpecies, descriptionPtBr);

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
    const detail = createPokemonDetail(pokemon);

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

    backLink.href = "/";

    backLink.textContent = "Voltar para a Pokédex";

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
      `Descrição PT-BR indisponível para o Pokémon #${String(speciesId).padStart(4, "0")}:`,
      error,
    );

    return null;
  }
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