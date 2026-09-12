import { getPokemonType, getPokemonTypeName } from "../data/pokemon-types.js";

import { loadPokemonImage } from "../utils/pokemon-image.js";

/* =========================================================
   POKÉDEX — POKÉMON CARD
   ========================================================= */

/* =========================================================
   IMAGE STATE
   ========================================================= */

function setupPokemonCardImage({ image, placeholder, artwork, pokemon }) {
  function showImage() {
    image.hidden = false;

    placeholder.hidden = true;

    artwork.classList.remove("pokemon-card__artwork--unavailable");
  }

  function showUnavailableState() {
    image.hidden = true;

    placeholder.hidden = false;

    artwork.classList.add("pokemon-card__artwork--unavailable");
  }

  loadPokemonImage({
    image,

    id: pokemon.id,

    source: pokemon.artwork,

    onLoad: showImage,

    onUnavailable: showUnavailableState,
  });
}

/* =========================================================
   TYPE BADGE
   ========================================================= */

function createTypeBadge(type) {
  const typeData = getPokemonType(type);

  const badge = document.createElement("span");

  badge.className = "pokemon-card__type";

  badge.textContent = getPokemonTypeName(type);

  badge.style.setProperty("--type-color", typeData.color);

  badge.style.setProperty("--type-text-color", typeData.textColor);

  return badge;
}

/* =========================================================
   ROUTE
   ========================================================= */

function getPokemonRouteIdentifier(pokemon) {
  const slug =
    typeof pokemon?.slug === "string" ? pokemon.slug.trim().toLowerCase() : "";

  if (slug) {
    return slug;
  }

  const id = Number(pokemon?.id);

  if (Number.isInteger(id) && id > 0) {
    return String(id);
  }

  throw new Error("Não foi possível criar a rota do Pokémon.");
}

function createPokemonHref(pokemon) {
  const identifier = getPokemonRouteIdentifier(pokemon);

  return `#/pokemon/${encodeURIComponent(identifier)}`;
}

/* =========================================================
   CARD
   ========================================================= */

export function createPokemonCard(pokemon) {
  const primaryType = pokemon.types[0] ?? "normal";

  const primaryTypeData = getPokemonType(primaryType);

  /* =======================================================
     LINK
     ======================================================= */

  const card = document.createElement("a");

  card.className = "pokemon-card";

  card.href = createPokemonHref(pokemon);

  card.dataset.pokemonId = pokemon.id;

  card.dataset.primaryType = primaryType;

  card.style.setProperty("--primary-type-color", primaryTypeData.color);

  /* =======================================================
     ARTWORK
     ======================================================= */

  const artwork = document.createElement("div");

  artwork.className = "pokemon-card__artwork";

  const image = document.createElement("img");

  image.className = "pokemon-card__image";

  image.alt = pokemon.name;

  image.loading = "lazy";

  image.decoding = "async";

  image.draggable = false;

  const imagePlaceholder = document.createElement("div");

  imagePlaceholder.className = "pokemon-card__image-placeholder";

  imagePlaceholder.hidden = true;

  imagePlaceholder.setAttribute("role", "img");

  imagePlaceholder.setAttribute(
    "aria-label",
    `Imagem de ${pokemon.name} indisponível`,
  );

  const imagePlaceholderSymbol = document.createElement("span");

  imagePlaceholderSymbol.className = "pokemon-card__image-placeholder-symbol";

  imagePlaceholderSymbol.textContent = "?";

  imagePlaceholderSymbol.setAttribute("aria-hidden", "true");

  imagePlaceholder.append(imagePlaceholderSymbol);

  artwork.append(image, imagePlaceholder);

  setupPokemonCardImage({
    image,
    placeholder: imagePlaceholder,
    artwork,
    pokemon,
  });

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

  card.append(artwork, info);

  return card;
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