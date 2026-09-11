/* =========================================================
   POKÉDEX — POKÉMON TYPES
   ========================================================= */

/* =========================================================
   ICON
   ========================================================= */

function getTypeIconUrl(fileName) {
  return new URL(`../../assets/type-icons/${fileName}`, import.meta.url).href;
}

/* =========================================================
   TYPES
   ========================================================= */

const POKEMON_TYPES = {
  normal: {
    name: "Normal",

    color: "#9FA19F",

    textColor: "#111417",

    icon: getTypeIconUrl("normal.png"),
  },

  fire: {
    name: "Fogo",

    color: "#E62829",

    textColor: "#111417",

    icon: getTypeIconUrl("fire.png"),
  },

  water: {
    name: "Água",

    color: "#2980EF",

    textColor: "#111417",

    icon: getTypeIconUrl("water.png"),
  },

  electric: {
    name: "Elétrico",

    color: "#FAC000",

    textColor: "#111417",

    icon: getTypeIconUrl("electric.png"),
  },

  grass: {
    name: "Planta",

    color: "#3FA129",

    textColor: "#111417",

    icon: getTypeIconUrl("grass.png"),
  },

  ice: {
    name: "Gelo",

    color: "#3DCEF3",

    textColor: "#111417",

    icon: getTypeIconUrl("ice.png"),
  },

  fighting: {
    name: "Lutador",

    color: "#FF8000",

    textColor: "#111417",

    icon: getTypeIconUrl("fighting.png"),
  },

  poison: {
    name: "Venenoso",

    color: "#9141CB",

    textColor: "#FFFFFF",

    icon: getTypeIconUrl("poison.png"),
  },

  ground: {
    name: "Terrestre",

    color: "#915121",

    textColor: "#FFFFFF",

    icon: getTypeIconUrl("ground.png"),
  },

  flying: {
    name: "Voador",

    color: "#81B9EF",

    textColor: "#111417",

    icon: getTypeIconUrl("flying.png"),
  },

  psychic: {
    name: "Psíquico",

    color: "#EF4179",

    textColor: "#111417",

    icon: getTypeIconUrl("psychic.png"),
  },

  bug: {
    name: "Inseto",

    color: "#91A119",

    textColor: "#111417",

    icon: getTypeIconUrl("bug.png"),
  },

  rock: {
    name: "Pedra",

    color: "#AFA981",

    textColor: "#111417",

    icon: getTypeIconUrl("rock.png"),
  },

  ghost: {
    name: "Fantasma",

    color: "#704170",

    textColor: "#FFFFFF",

    icon: getTypeIconUrl("ghost.png"),
  },

  dragon: {
    name: "Dragão",

    color: "#5060E1",

    textColor: "#FFFFFF",

    icon: getTypeIconUrl("dragon.png"),
  },

  dark: {
    name: "Sombrio",

    color: "#624D4E",

    textColor: "#FFFFFF",

    icon: getTypeIconUrl("dark.png"),
  },

  steel: {
    name: "Aço",

    color: "#60A1B8",

    textColor: "#111417",

    icon: getTypeIconUrl("steel.png"),
  },

  fairy: {
    name: "Fada",

    color: "#EF70EF",

    textColor: "#111417",

    icon: getTypeIconUrl("fairy.png"),
  },
};

/* =========================================================
   TYPE
   ========================================================= */

export function getPokemonType(type) {
  return POKEMON_TYPES[type] ?? POKEMON_TYPES.normal;
}

/* =========================================================
   NAME
   ========================================================= */

export function getPokemonTypeName(type) {
  return getPokemonType(type).name;
}

/* =========================================================
   ICON
   ========================================================= */

export function getPokemonTypeIcon(type) {
  return getPokemonType(type).icon;
}