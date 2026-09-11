import {
  getPokemonType,
  getPokemonTypeName,
} from "../data/pokemon-types.js";

/* =========================================================
   TYPE BADGE
   ========================================================= */

function createTypeBadge(type) {
  const typeData = getPokemonType(type);

  const badge = document.createElement("span");

  badge.className = "pokemon-card__type";
  badge.textContent = getPokemonTypeName(type);

  badge.style.setProperty(
    "--type-color",
    typeData.color
  );

  badge.style.setProperty(
    "--type-text-color",
    typeData.textColor
  );

  return badge;
}

/* =========================================================
   POKÉMON CARD
   ========================================================= */

export function createPokemonCard(pokemon) {
  const primaryType =
    pokemon.types[0] ?? "normal";

  const primaryTypeData =
    getPokemonType(primaryType);

  /* -------------------------------------------------------
     CARD
     ------------------------------------------------------- */

  const article =
    document.createElement("article");

  article.className = "pokemon-card";

  article.dataset.pokemonId =
    pokemon.id;

  article.dataset.primaryType =
    primaryType;

  article.style.setProperty(
    "--primary-type-color",
    primaryTypeData.color
  );

  /* -------------------------------------------------------
     ARTWORK
     ------------------------------------------------------- */

  const artwork =
    document.createElement("div");

  artwork.className =
    "pokemon-card__artwork";

  const image =
    document.createElement("img");

  image.className =
    "pokemon-card__image";

  image.src =
    pokemon.artwork;

  image.alt =
    pokemon.name;

  image.loading =
    "lazy";

  image.decoding =
    "async";

  image.draggable =
    false;

  artwork.append(image);

  /* -------------------------------------------------------
     INFO
     ------------------------------------------------------- */

  const info =
    document.createElement("div");

  info.className =
    "pokemon-card__info";

  /* -------------------------------------------------------
     NUMBER
     ------------------------------------------------------- */

  const number =
    document.createElement("span");

  number.className =
    "pokemon-card__number";

  number.textContent =
    pokemon.number;

  /* -------------------------------------------------------
     NAME
     ------------------------------------------------------- */

  const name =
    document.createElement("h2");

  name.className =
    "pokemon-card__name";

  name.textContent =
    pokemon.name;

  /* -------------------------------------------------------
     TYPES
     ------------------------------------------------------- */

  const types =
    document.createElement("div");

  types.className =
    "pokemon-card__types";

  pokemon.types.forEach((type) => {
    types.append(
      createTypeBadge(type)
    );
  });

  /* -------------------------------------------------------
     ASSEMBLY
     ------------------------------------------------------- */

  info.append(
    number,
    name,
    types
  );

  article.append(
    artwork,
    info
  );

  return article;
}