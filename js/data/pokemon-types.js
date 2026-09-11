const POKEMON_TYPES = {
  normal: {
    name: "Normal",
    color: "#A4ACAF",
    textColor: "#111417",
  },

  fire: {
    name: "Fogo",
    color: "#FD7D24",
    textColor: "#111417",
  },

  water: {
    name: "Água",
    color: "#4592C4",
    textColor: "#FFFFFF",
  },

  electric: {
    name: "Elétrico",
    color: "#EED535",
    textColor: "#111417",
  },

  grass: {
    name: "Planta",
    color: "#9BCC50",
    textColor: "#111417",
  },

  ice: {
    name: "Gelo",
    color: "#51C4E7",
    textColor: "#111417",
  },

  fighting: {
    name: "Lutador",
    color: "#D56723",
    textColor: "#FFFFFF",
  },

  poison: {
    name: "Venenoso",
    color: "#B97FC9",
    textColor: "#FFFFFF",
  },

  ground: {
    name: "Terrestre",
    color: "#AB9842",
    textColor: "#111417",
  },

  flying: {
    name: "Voador",
    color: "#3DC7EF",
    textColor: "#111417",
  },

  psychic: {
    name: "Psíquico",
    color: "#F366B9",
    textColor: "#111417",
  },

  bug: {
    name: "Inseto",
    color: "#729F3F",
    textColor: "#FFFFFF",
  },

  rock: {
    name: "Pedra",
    color: "#A38C21",
    textColor: "#FFFFFF",
  },

  ghost: {
    name: "Fantasma",
    color: "#7B62A3",
    textColor: "#FFFFFF",
  },

  dragon: {
    name: "Dragão",
    color: "#53A4CF",
    textColor: "#111417",
  },

  dark: {
    name: "Sombrio",
    color: "#707070",
    textColor: "#FFFFFF",
  },

  steel: {
    name: "Aço",
    color: "#9EB7B8",
    textColor: "#111417",
  },

  fairy: {
    name: "Fada",
    color: "#FDB9E9",
    textColor: "#111417",
  },
};

export function getPokemonType(type) {
  return POKEMON_TYPES[type] ?? POKEMON_TYPES.normal;
}

export function getPokemonTypeName(type) {
  return getPokemonType(type).name;
}