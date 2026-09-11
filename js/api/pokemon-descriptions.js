/* =========================================================
   POKÉDEX — PT-BR DESCRIPTIONS API
   ========================================================= */

const DESCRIPTION_SOURCE_URL =
  "https://raw.githubusercontent.com/WatWowMap/pogo-data-api/refs/heads/main/data/v1/translations/pt-br/descriptions.json";

const STORAGE_KEY = "pokedex:descriptions:pt-br:v1";

/* =========================================================
   CACHE
   ========================================================= */

let descriptionsCache = null;

let descriptionsPromise = null;

/* =========================================================
   PUBLIC API
   ========================================================= */

export async function getPokemonDescriptionPtBr(pokemonId, options = {}) {
  validatePokemonId(pokemonId);

  const descriptions = await getDescriptions(options);

  const key = `desc_${pokemonId}`;

  const description = descriptions[key];

  if (typeof description !== "string" || !description.trim()) {
    throw new Error(
      `Descrição PT-BR não encontrada para o Pokémon #${pokemonId}.`,
    );
  }

  return normalizeDescription(description);
}

/* =========================================================
   DESCRIPTIONS
   ========================================================= */

async function getDescriptions(options = {}) {
  if (descriptionsCache) {
    return descriptionsCache;
  }

  const storedDescriptions = readStoredDescriptions();

  if (storedDescriptions) {
    descriptionsCache = storedDescriptions;

    return descriptionsCache;
  }

  if (!descriptionsPromise) {
    descriptionsPromise = fetchDescriptions(options);
  }

  try {
    descriptionsCache = await descriptionsPromise;

    return descriptionsCache;
  } finally {
    descriptionsPromise = null;
  }
}

/* =========================================================
   FETCH
   ========================================================= */

async function fetchDescriptions(options = {}) {
  const response = await fetch(DESCRIPTION_SOURCE_URL, {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao carregar descrições PT-BR: ${response.status} ${response.statusText}`,
    );
  }

  const descriptions = await response.json();

  if (
    !descriptions ||
    typeof descriptions !== "object" ||
    Array.isArray(descriptions)
  ) {
    throw new Error("Formato inválido das descrições PT-BR.");
  }

  storeDescriptions(descriptions);

  return descriptions;
}

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function readStoredDescriptions() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);

    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      Array.isArray(parsedValue)
    ) {
      localStorage.removeItem(STORAGE_KEY);

      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

function storeDescriptions(descriptions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(descriptions));
  } catch {
    /*
     * O cache persistente é uma otimização.
     * A aplicação continua funcionando
     * normalmente apenas com cache em memória.
     */
  }
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeDescription(description) {
  return String(description)
    .replace(/[\n\f\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validatePokemonId(pokemonId) {
  if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
    throw new Error("ID inválido para carregar a descrição PT-BR.");
  }
}