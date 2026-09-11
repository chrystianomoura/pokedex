import {
  getGeneration,
  getGenerationList,
  getPokemon,
} from "../api/pokeapi.js";

import {
  mapGenerationDetail,
  mapGenerationList,
} from "../services/pokemon-generation.js";

import { mapPokemonToCard } from "../services/pokemon.js";

import {
  createPokemonCard,
  createPokemonCardSkeleton,
} from "../components/pokemon-card.js";

import { createPokemonGenerationSelector } from "../components/pokemon-generation.js";

/* =========================================================
   POKÉDEX — GENERATIONS FEATURE
   ========================================================= */

const DEFAULT_BATCH_SIZE = 24;

const DEFAULT_PREFETCH_DISTANCE = 600;

const DEFAULT_ROOT_MARGIN = `0px 0px ${DEFAULT_PREFETCH_DISTANCE}px 0px`;

const NATIONAL_DEX_ID = 0;

/* =========================================================
   FACTORY
   ========================================================= */

export function createPokemonGenerationsFeature({
  generationHost,
  generationGrid,
  generationSentinel,
  loadMoreButton,
  search,
  searchFeature,
  batchSize = DEFAULT_BATCH_SIZE,
  onModeChange,
} = {}) {
  validateElements({
    generationHost,
    generationGrid,
    generationSentinel,
    loadMoreButton,
    search,
    searchFeature,
  });

  /* =======================================================
     STATE
     ======================================================= */

  let generations = [];

  let activeGenerationId = NATIONAL_DEX_ID;

  let generationMatches = [];

  let generationRenderedCount = 0;

  let isGenerationLoading = false;

  let generationController = null;

  let generationObserver = null;

  let generationRequestId = 0;

  let continuationFrame = null;

  /* =======================================================
     DATA
     ======================================================= */

  async function loadGenerations() {
    const response = await getGenerationList();

    generations = mapGenerationList(response.results);

    return generations;
  }

  /* =======================================================
     REQUEST CONTROL
     ======================================================= */

  function createGenerationController() {
    if (generationController) {
      generationController.abort();
    }

    generationController = new AbortController();

    return generationController;
  }

  function abortGenerationRequest() {
    if (!generationController) {
      return;
    }

    generationController.abort();

    generationController = null;
  }

  /* =======================================================
     STATE
     ======================================================= */

  function resetGenerationState() {
    generationMatches = [];

    generationRenderedCount = 0;

    isGenerationLoading = false;

    cancelContinuationCheck();
  }

  function isActive() {
    return activeGenerationId !== NATIONAL_DEX_ID;
  }

  function hasMorePokemon() {
    return generationRenderedCount < generationMatches.length;
  }

  function notifyModeChange() {
    if (typeof onModeChange === "function") {
      onModeChange(isActive());
    }
  }

  /* =======================================================
     RENDER — POKÉMON
     ======================================================= */

  function renderPokemonList(pokemonList) {
    const fragment = document.createDocumentFragment();

    pokemonList.forEach((pokemon) => {
      fragment.append(createPokemonCard(pokemon));
    });

    generationGrid.append(fragment);
  }

  /* =======================================================
     RENDER — SKELETONS
     ======================================================= */

  function renderSkeletons(amount) {
    const fragment = document.createDocumentFragment();

    const skeletons = [];

    for (let index = 0; index < amount; index += 1) {
      const skeleton = createPokemonCardSkeleton();

      skeletons.push(skeleton);

      fragment.append(skeleton);
    }

    generationGrid.append(fragment);

    return skeletons;
  }

  function removeSkeletons(skeletons) {
    skeletons.forEach((skeleton) => {
      skeleton.remove();
    });
  }

  /* =======================================================
     SELECTOR — SCROLL
     ======================================================= */

  function getSelectorScrollLeft() {
    const list = generationHost.querySelector(".pokemon-generation__list");

    if (!list) {
      return 0;
    }

    return list.scrollLeft;
  }

  function restoreSelectorScrollLeft(scrollLeft) {
    const list = generationHost.querySelector(".pokemon-generation__list");

    if (!list) {
      return;
    }

    list.scrollLeft = scrollLeft;
  }

  /* =======================================================
     SELECTOR
     ======================================================= */

  function renderSelector({ preserveScroll = true } = {}) {
    const scrollLeft = preserveScroll ? getSelectorScrollLeft() : 0;

    const generationOptions = [
      {
        id: NATIONAL_DEX_ID,

        name: "national-dex",

        label: "National Dex",
      },

      ...generations,
    ];

    const selector = createPokemonGenerationSelector({
      generations: generationOptions,

      activeGenerationId,

      onSelect: handleSelect,
    });

    generationHost.replaceChildren(selector);

    if (preserveScroll) {
      restoreSelectorScrollLeft(scrollLeft);
    }
  }

  /* =======================================================
     LOAD RANGE
     ======================================================= */

  function isSentinelWithinLoadRange() {
    if (generationSentinel.hidden) {
      return false;
    }

    const rect = generationSentinel.getBoundingClientRect();

    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    return (
      rect.top <= viewportHeight + DEFAULT_PREFETCH_DISTANCE && rect.bottom >= 0
    );
  }

  function scheduleContinuationCheck({
    requestId = generationRequestId,

    controller = generationController,
  } = {}) {
    cancelContinuationCheck();

    continuationFrame = requestAnimationFrame(() => {
      continuationFrame = null;

      if (
        requestId !== generationRequestId ||
        !controller ||
        controller.signal.aborted ||
        searchFeature.isActive ||
        !isActive() ||
        isGenerationLoading ||
        !hasMorePokemon() ||
        !isSentinelWithinLoadRange()
      ) {
        return;
      }

      void loadNextBatch({
        requestId,
        controller,
      });
    });
  }

  function cancelContinuationCheck() {
    if (continuationFrame === null) {
      return;
    }

    cancelAnimationFrame(continuationFrame);

    continuationFrame = null;
  }

  /* =======================================================
     LOAD NEXT BATCH
     ======================================================= */

  async function loadNextBatch({
    requestId = generationRequestId,

    controller = generationController,
  } = {}) {
    if (!controller || isGenerationLoading || !hasMorePokemon()) {
      return;
    }

    isGenerationLoading = true;

    cancelContinuationCheck();

    updateLoadMoreButton();

    const batch = generationMatches.slice(
      generationRenderedCount,

      generationRenderedCount + batchSize,
    );

    const skeletons = renderSkeletons(batch.length);

    try {
      const requests = batch.map(({ id }) => {
        return getPokemon(id, {
          signal: controller.signal,
        });
      });

      const rawPokemonList = await Promise.all(requests);

      if (controller.signal.aborted || requestId !== generationRequestId) {
        removeSkeletons(skeletons);

        return;
      }

      const pokemonList = rawPokemonList.map(mapPokemonToCard);

      removeSkeletons(skeletons);

      renderPokemonList(pokemonList);

      generationRenderedCount += pokemonList.length;

      updateSentinel();
    } catch (error) {
      removeSkeletons(skeletons);

      if (error.name === "AbortError") {
        return;
      }

      console.error("Erro ao carregar Pokémon da geração:", error);
    } finally {
      if (requestId === generationRequestId) {
        isGenerationLoading = false;

        updateLoadMoreButton();

        scheduleContinuationCheck({
          requestId,
          controller,
        });
      }
    }
  }

  /* =======================================================
     SELECT GENERATION
     ======================================================= */

  async function handleSelect(generation) {
    if (!generation) {
      return;
    }

    /* =====================================================
       CLEAR SEARCH
       ===================================================== */

    if (search.input.value !== "") {
      searchFeature.clear();
    }

    /* =====================================================
       NATIONAL DEX
       ===================================================== */

    if (generation.id === NATIONAL_DEX_ID) {
      generationRequestId += 1;

      abortGenerationRequest();

      resetGenerationState();

      generationGrid.replaceChildren();

      activeGenerationId = NATIONAL_DEX_ID;

      renderSelector({
        preserveScroll: true,
      });

      updateSentinel();

      notifyModeChange();

      return;
    }

    /* =====================================================
       GENERATION
       ===================================================== */

    activeGenerationId = generation.id;

    generationRequestId += 1;

    const requestId = generationRequestId;

    const controller = createGenerationController();

    resetGenerationState();

    generationGrid.replaceChildren();

    renderSelector({
      preserveScroll: true,
    });

    updateSentinel();

    notifyModeChange();

    try {
      const rawGeneration = await getGeneration(generation.id, {
        signal: controller.signal,
      });

      if (controller.signal.aborted || requestId !== generationRequestId) {
        return;
      }

      const mappedGeneration = mapGenerationDetail(rawGeneration);

      generationMatches = mappedGeneration.species;

      generationGrid.setAttribute(
        "aria-label",
        `Pokémon da ${mappedGeneration.label}`,
      );

      updateSentinel();

      await loadNextBatch({
        requestId,
        controller,
      });

      notifyModeChange();
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.error("Erro ao carregar geração:", error);
    }
  }

  /* =======================================================
     LOAD MORE BUTTON
     ======================================================= */

  function updateLoadMoreButton() {
    if (!isActive()) {
      return;
    }

    const hasMore = hasMorePokemon();

    loadMoreButton.disabled = isGenerationLoading || !hasMore;

    if (isGenerationLoading) {
      loadMoreButton.textContent = "Carregando...";

      return;
    }

    if (!hasMore) {
      loadMoreButton.textContent = "Todos da geração carregados";

      return;
    }

    loadMoreButton.textContent = "Carregar mais";
  }

  /* =======================================================
     SENTINEL
     ======================================================= */

  function updateSentinel() {
    generationSentinel.hidden = !isActive() || !hasMorePokemon();
  }

  /* =======================================================
     INFINITE SCROLL
     ======================================================= */

  function setupInfiniteScroll() {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    stopInfiniteScroll();

    generationObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (
          !entry.isIntersecting ||
          searchFeature.isActive ||
          !isActive() ||
          isGenerationLoading ||
          !hasMorePokemon()
        ) {
          return;
        }

        void loadNextBatch();
      },

      {
        root: null,

        rootMargin: DEFAULT_ROOT_MARGIN,

        threshold: 0,
      },
    );

    generationObserver.observe(generationSentinel);
  }

  function stopInfiniteScroll() {
    if (!generationObserver) {
      return;
    }

    generationObserver.disconnect();

    generationObserver = null;
  }

  /* =======================================================
     INIT
     ======================================================= */

  async function init() {
    setupInfiniteScroll();

    try {
      await loadGenerations();

      renderSelector({
        preserveScroll: false,
      });
    } catch (error) {
      console.error("Erro ao carregar gerações:", error);
    }
  }

  /* =======================================================
     DESTROY
     ======================================================= */

  function destroy() {
    cancelContinuationCheck();

    abortGenerationRequest();

    stopInfiniteScroll();
  }

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    init,

    destroy,

    loadNextBatch,

    updateLoadMoreButton,

    updateSentinel,

    get isActive() {
      return isActive();
    },

    get isLoading() {
      return isGenerationLoading;
    },

    get activeGenerationId() {
      return activeGenerationId;
    },

    get totalPokemon() {
      return generationMatches.length;
    },

    get renderedPokemon() {
      return generationRenderedCount;
    },
  };
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateElements({
  generationHost,
  generationGrid,
  generationSentinel,
  loadMoreButton,
  search,
  searchFeature,
}) {
  if (!(generationHost instanceof Element)) {
    throw new Error("Generations Feature: host não informado.");
  }

  if (!(generationGrid instanceof Element)) {
    throw new Error("Generations Feature: grid não informado.");
  }

  if (!(generationSentinel instanceof Element)) {
    throw new Error("Generations Feature: sentinel não informado.");
  }

  if (!(loadMoreButton instanceof HTMLButtonElement)) {
    throw new Error(
      "Generations Feature: botão de carregamento não informado.",
    );
  }

  if (!search || !(search.input instanceof HTMLInputElement)) {
    throw new Error("Generations Feature: componente de busca inválido.");
  }

  if (!searchFeature || typeof searchFeature.clear !== "function") {
    throw new Error("Generations Feature: Search Feature inválida.");
  }
}