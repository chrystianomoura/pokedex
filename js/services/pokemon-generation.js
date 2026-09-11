/* =========================================================
   POKÉDEX — GENERATION SERVICE
   ========================================================= */

/* =========================================================
   GENERATION LABELS
   ========================================================= */

const GENERATION_LABELS = {
  "generation-i": "Geração I",
  "generation-ii": "Geração II",
  "generation-iii": "Geração III",
  "generation-iv": "Geração IV",
  "generation-v": "Geração V",
  "generation-vi": "Geração VI",
  "generation-vii": "Geração VII",
  "generation-viii": "Geração VIII",
  "generation-ix": "Geração IX",
};

/* =========================================================
   GENERATION REFERENCE
   ========================================================= */

export function mapGenerationReference(generation) {
  if (!generation) {
    throw new Error("Dados da geração não informados.");
  }

  const id = getResourceId(generation.url);

  if (!id) {
    throw new Error(
      `Não foi possível identificar a geração "${generation.name}".`,
    );
  }

  return {
    id,
    name: generation.name,
    label: getGenerationLabel(generation.name),
  };
}

/* =========================================================
   GENERATION LIST
   ========================================================= */

export function mapGenerationList(generations = []) {
  return generations.map(mapGenerationReference).sort((a, b) => a.id - b.id);
}

/* =========================================================
   GENERATION DETAIL
   ========================================================= */

export function mapGenerationDetail(generation) {
  if (!generation) {
    throw new Error("Dados da geração não informados.");
  }

  const species = mapGenerationSpecies(generation.pokemon_species);

  return {
    id: generation.id,

    name: generation.name,

    label: getGenerationLabel(generation.name),

    species,
  };
}

/* =========================================================
   GENERATION SPECIES
   ========================================================= */

export function mapGenerationSpecies(speciesList = []) {
  return speciesList
    .map((species) => {
      const id = getResourceId(species.url);

      if (!id) {
        return null;
      }

      return {
        id,
        name: species.name,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.id - b.id);
}

/* =========================================================
   GENERATION LABEL
   ========================================================= */

export function getGenerationLabel(generationName) {
  if (!generationName) {
    return "";
  }

  return (
    GENERATION_LABELS[generationName] ?? formatGenerationName(generationName)
  );
}

/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

function getResourceId(url) {
  if (!url) {
    return null;
  }

  const parts = url.split("/").filter(Boolean);

  const id = Number(parts.at(-1));

  return Number.isInteger(id) && id > 0 ? id : null;
}

function formatGenerationName(generationName) {
  return generationName.replace(/^generation-/, "Geração ").toUpperCase();
}   