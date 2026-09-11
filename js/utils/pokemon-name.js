/* =========================================================
   POKÉDEX — POKÉMON NAME FORMATTER
   ========================================================= */

/* =========================================================
   SPECIAL NAMES
   ========================================================= */

const SPECIAL_POKEMON_NAMES = {
  "nidoran-m": "Nidoran♂",

  "nidoran-f": "Nidoran♀",
};

/* =========================================================
   FORMAT
   ========================================================= */

export function formatPokemonName(name) {
  if (!name) {
    return "";
  }

  const normalizedName = String(name).trim().toLowerCase();

  const specialName = SPECIAL_POKEMON_NAMES[normalizedName];

  if (specialName) {
    return specialName;
  }

  return normalizedName
    .split("-")
    .filter(Boolean)
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}