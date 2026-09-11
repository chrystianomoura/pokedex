import { getPokemonType, getPokemonTypeName } from "../data/pokemon-types.js";

/* =========================================================
   POKÉDEX — POKÉMON DETAIL COMPONENT
   ========================================================= */

/* =========================================================
   DETAIL
   ========================================================= */

export function createPokemonDetail(pokemon) {
  validatePokemon(pokemon);

  const article = document.createElement("article");

  article.className = "pokemon-detail";

  article.dataset.pokemonId = pokemon.id;

  article.dataset.primaryType = pokemon.primaryType;

  const primaryType = getPokemonType(pokemon.primaryType);

  article.style.setProperty("--primary-type-color", primaryType.color);

  const hero = createHero(pokemon);

  const content = createContent(pokemon);

  article.append(hero, content);

  return article;
}

/* =========================================================
   HERO
   ========================================================= */

function createHero(pokemon) {
  const hero = document.createElement("header");

  hero.className = "pokemon-detail__hero";

  const topbar = createTopbar();

  const identity = createIdentity(pokemon);

  const artwork = createArtwork(pokemon);

  hero.append(topbar, identity, artwork);

  return hero;
}

/* =========================================================
   TOPBAR
   ========================================================= */

function createTopbar() {
  const topbar = document.createElement("div");

  topbar.className = "pokemon-detail__topbar";

  const backLink = document.createElement("a");

  backLink.className = "pokemon-detail__back";

  backLink.href = "/";

  backLink.setAttribute("aria-label", "Voltar para a Pokédex");

  const backIcon = document.createElement("span");

  backIcon.className = "pokemon-detail__back-icon";

  backIcon.setAttribute("aria-hidden", "true");

  backIcon.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  const backLabel = document.createElement("span");

  backLabel.className = "pokemon-detail__back-label";

  backLabel.textContent = "Pokédex";

  backLink.append(backIcon, backLabel);

  const favoriteButton = document.createElement("button");

  favoriteButton.className = "pokemon-detail__favorite";

  favoriteButton.type = "button";

  favoriteButton.setAttribute("aria-label", "Adicionar aos favoritos");

  favoriteButton.setAttribute("aria-pressed", "false");

  favoriteButton.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 20.25C12 20.25 4.5 16.15 4.5 10.25C4.5 7.7 6.25 6 8.5 6C10.1 6 11.25 6.9 12 8C12.75 6.9 13.9 6 15.5 6C17.75 6 19.5 7.7 19.5 10.25C19.5 16.15 12 20.25 12 20.25Z"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  topbar.append(backLink, favoriteButton);

  return topbar;
}

/* =========================================================
   IDENTITY
   ========================================================= */

function createIdentity(pokemon) {
  const identity = document.createElement("div");

  identity.className = "pokemon-detail__identity";

  const number = document.createElement("span");

  number.className = "pokemon-detail__number";

  number.textContent = pokemon.number;

  const name = document.createElement("h1");

  name.className = "pokemon-detail__name";

  name.textContent = pokemon.name;

  const types = createTypes(pokemon.types);

  identity.append(number, name, types);

  return identity;
}

/* =========================================================
   TYPES
   ========================================================= */

function createTypes(pokemonTypes) {
  const types = document.createElement("div");

  types.className = "pokemon-detail__types";

  types.setAttribute("aria-label", "Tipos do Pokémon");

  pokemonTypes.forEach((type) => {
    types.append(createTypeBadge(type));
  });

  return types;
}

function createTypeBadge(type) {
  const typeData = getPokemonType(type);

  const badge = document.createElement("span");

  badge.className = "pokemon-detail__type";

  badge.textContent = getPokemonTypeName(type);

  badge.style.setProperty("--type-color", typeData.color);

  badge.style.setProperty("--type-text-color", typeData.textColor);

  return badge;
}

/* =========================================================
   ARTWORK
   ========================================================= */

function createArtwork(pokemon) {
  const artwork = document.createElement("div");

  artwork.className = "pokemon-detail__artwork";

  const background = document.createElement("div");

  background.className = "pokemon-detail__artwork-background";

  background.setAttribute("aria-hidden", "true");

  const image = document.createElement("img");

  image.className = "pokemon-detail__image";

  image.src = pokemon.artwork ?? "";

  image.alt = pokemon.name;

  image.decoding = "async";

  image.draggable = false;

  if (!pokemon.artwork) {
    image.hidden = true;
  }

  artwork.append(background, image);

  return artwork;
}

/* =========================================================
   CONTENT
   ========================================================= */

function createContent(pokemon) {
  const content = document.createElement("div");

  content.className = "pokemon-detail__content";

  const navigation = createSectionNavigation();

  const about = createAboutSection(pokemon);

  const weaknesses = createPlaceholderSection({
    id: "pokemon-detail-weaknesses",

    title: "Fraquezas",

    className: "pokemon-detail__weaknesses",
  });

  const evolution = createPlaceholderSection({
    id: "pokemon-detail-evolution",

    title: "Evolução",

    className: "pokemon-detail__evolution",
  });

  content.append(navigation, about, weaknesses, evolution);

  return content;
}

/* =========================================================
   SECTION NAVIGATION
   ========================================================= */

function createSectionNavigation() {
  const navigation = document.createElement("nav");

  navigation.className = "pokemon-detail__section-navigation";

  navigation.setAttribute("aria-label", "Seções do Pokémon");

  navigation.append(
    createSectionLink({
      href: "#pokemon-detail-about",

      label: "Sobre",
    }),

    createSectionLink({
      href: "#pokemon-detail-weaknesses",

      label: "Fraquezas",
    }),

    createSectionLink({
      href: "#pokemon-detail-evolution",

      label: "Evolução",
    }),
  );

  return navigation;
}

function createSectionLink({ href, label }) {
  const link = document.createElement("a");

  link.className = "pokemon-detail__section-link";

  link.href = href;

  link.textContent = label;

  return link;
}

/* =========================================================
   ABOUT
   ========================================================= */

function createAboutSection(pokemon) {
  const section = document.createElement("section");

  section.id = "pokemon-detail-about";

  section.className = "pokemon-detail__section pokemon-detail__about";

  section.setAttribute("aria-labelledby", "pokemon-detail-about-title");

  const header = createSectionHeader({
    id: "pokemon-detail-about-title",

    title: "Sobre",
  });

  const description = document.createElement("p");

  description.className = "pokemon-detail__description";

  description.textContent = pokemon.description || "Descrição indisponível.";

  const facts = createFacts(pokemon);

  section.append(header, description, facts);

  return section;
}

/* =========================================================
   PLACEHOLDER SECTION
   ========================================================= */

function createPlaceholderSection({ id, title, className }) {
  const section = document.createElement("section");

  section.id = id;

  section.className = `pokemon-detail__section ${className}`;

  section.hidden = true;

  const titleId = `${id}-title`;

  section.setAttribute("aria-labelledby", titleId);

  section.append(
    createSectionHeader({
      id: titleId,

      title,
    }),
  );

  return section;
}

/* =========================================================
   SECTION HEADER
   ========================================================= */

function createSectionHeader({ id, title }) {
  const header = document.createElement("div");

  header.className = "pokemon-detail__section-header";

  const heading = document.createElement("h2");

  heading.id = id;

  heading.className = "pokemon-detail__section-title";

  heading.textContent = title;

  header.append(heading);

  return header;
}

/* =========================================================
   FACTS
   ========================================================= */

function createFacts(pokemon) {
  const list = document.createElement("dl");

  list.className = "pokemon-detail__facts";

  if (pokemon.height) {
    list.append(
      createFact({
        label: "Altura",

        value: pokemon.height.formatted,
      }),
    );
  }

  if (pokemon.weight) {
    list.append(
      createFact({
        label: "Peso",

        value: pokemon.weight.formatted,
      }),
    );
  }

  return list;
}

function createFact({ label, value }) {
  const item = document.createElement("div");

  item.className = "pokemon-detail__fact";

  const term = document.createElement("dt");

  term.className = "pokemon-detail__fact-label";

  term.textContent = label;

  const description = document.createElement("dd");

  description.className = "pokemon-detail__fact-value";

  description.textContent = value;

  item.append(term, description);

  return item;
}

/* =========================================================
   LOADING
   ========================================================= */

export function createPokemonDetailSkeleton() {
  const article = document.createElement("article");

  article.className = "pokemon-detail pokemon-detail--skeleton";

  article.setAttribute("aria-hidden", "true");

  const hero = document.createElement("div");

  hero.className = "pokemon-detail__hero";

  const topbar = document.createElement("div");

  topbar.className = "pokemon-detail__topbar";

  topbar.append(
    createSkeletonBlock("pokemon-detail__skeleton-back"),

    createSkeletonBlock("pokemon-detail__skeleton-favorite"),
  );

  const identity = document.createElement("div");

  identity.className = "pokemon-detail__identity";

  identity.append(
    createSkeletonBlock("pokemon-detail__skeleton-number"),

    createSkeletonBlock("pokemon-detail__skeleton-name"),
  );

  const types = document.createElement("div");

  types.className = "pokemon-detail__types";

  types.append(
    createSkeletonBlock("pokemon-detail__skeleton-type"),

    createSkeletonBlock("pokemon-detail__skeleton-type"),
  );

  identity.append(types);

  const artwork = document.createElement("div");

  artwork.className = "pokemon-detail__artwork";

  artwork.append(createSkeletonBlock("pokemon-detail__skeleton-image"));

  hero.append(topbar, identity, artwork);

  const content = document.createElement("div");

  content.className = "pokemon-detail__content";

  const navigation = document.createElement("div");

  navigation.className = "pokemon-detail__section-navigation";

  navigation.append(
    createSkeletonBlock("pokemon-detail__skeleton-tab"),

    createSkeletonBlock("pokemon-detail__skeleton-tab"),

    createSkeletonBlock("pokemon-detail__skeleton-tab"),
  );

  const about = document.createElement("section");

  about.className = "pokemon-detail__section pokemon-detail__about";

  about.append(
    createSkeletonBlock("pokemon-detail__skeleton-section-title"),

    createSkeletonBlock("pokemon-detail__skeleton-description"),

    createSkeletonBlock("pokemon-detail__skeleton-facts"),
  );

  content.append(navigation, about);

  article.append(hero, content);

  return article;
}

/* =========================================================
   SKELETON BLOCK
   ========================================================= */

function createSkeletonBlock(className) {
  const block = document.createElement("div");

  block.className = `pokemon-detail__skeleton ${className}`;

  return block;
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validatePokemon(pokemon) {
  if (!pokemon) {
    throw new Error("Pokémon não informado para o componente de detalhe.");
  }

  if (!Number.isInteger(pokemon.id) || pokemon.id <= 0) {
    throw new Error("ID do Pokémon inválido.");
  }

  if (!pokemon.name) {
    throw new Error("Nome do Pokémon não informado.");
  }

  if (!Array.isArray(pokemon.types)) {
    throw new Error("Tipos do Pokémon não informados.");
  }
}