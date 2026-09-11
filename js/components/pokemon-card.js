import { getPokemonType, getPokemonTypeName } from "../data/pokemon-types.js";

function createTypeBadge(type) {
  const typeData = getPokemonType(type);

  const badge = document.createElement("span");
  badge.className = "pokemon-card__type";
  badge.textContent = getPokemonTypeName(type);

  badge.style.setProperty("--type-color", typeData.color);

  badge.style.setProperty("--type-text-color", typeData.textColor);

  return badge;
}

export function createPokemonCard(pokemon) {
  const primaryType = pokemon.types[0] ?? "normal";

  const primaryTypeData = getPokemonType(primaryType);

  const article = document.createElement("article");

  article.className = "pokemon-card";

  article.dataset.pokemonId = pokemon.id;

  article.dataset.primaryType = primaryType;

  article.style.setProperty("--primary-type-color", primaryTypeData.color);

  /* =======================================================
     ARTWORK
     ======================================================= */

  const artwork = document.createElement("div");

  artwork.className = "pokemon-card__artwork";

  const image = document.createElement("img");

  image.className = "pokemon-card__image";

  image.src = pokemon.artwork;

  image.alt = pokemon.name;

  image.loading = "lazy";

  image.decoding = "async";

  image.draggable = false;

  artwork.append(image);

  /* =======================================================
     INFO
     ======================================================= */

  const info = document.createElement("div");

  info.className = "pokemon-card__info";

  const number = document.createElement("span");

  number.className = "pokemon-card__number";

  number.textContent = pokemon.number;

  const name = document.createElement("h2");

  name.className = "pokemon-card__name";

  name.textContent = pokemon.name;

  /* =======================================================
     TYPES
     ======================================================= */

  const types = document.createElement("div");

  types.className = "pokemon-card__types";

  pokemon.types.forEach((type) => {
    types.append(createTypeBadge(type));
  });

  /* =======================================================
     ASSEMBLY
     ======================================================= */

  info.append(number, name, types);

  article.append(artwork, info);

  return article;
}

/* =========================================================
   SKELETON
   ========================================================= */

export function createPokemonCardSkeleton() {
  const article = document.createElement("article");

  article.className = "pokemon-card pokemon-card--skeleton";

  article.setAttribute("aria-hidden", "true");

  /* =======================================================
     ARTWORK PLACEHOLDER
     ======================================================= */

  const artwork = document.createElement("div");

  artwork.className = "pokemon-card__artwork pokemon-card__artwork--skeleton";

  const imagePlaceholder = document.createElement("div");

  imagePlaceholder.className = "pokemon-card__skeleton-image";

  artwork.append(imagePlaceholder);

  /* =======================================================
     INFO PLACEHOLDERS
     ======================================================= */

  const info = document.createElement("div");

  info.className = "pokemon-card__info pokemon-card__info--skeleton";

  const number = document.createElement("div");

  number.className =
    "pokemon-card__skeleton-line pokemon-card__skeleton-line--number";

  const name = document.createElement("div");

  name.className =
    "pokemon-card__skeleton-line pokemon-card__skeleton-line--name";

  const types = document.createElement("div");

  types.className = "pokemon-card__skeleton-types";

  const firstType = document.createElement("div");

  firstType.className = "pokemon-card__skeleton-type";

  const secondType = document.createElement("div");

  secondType.className = "pokemon-card__skeleton-type";

  types.append(firstType, secondType);

  info.append(number, name, types);

  article.append(artwork, info);

  return article;
}