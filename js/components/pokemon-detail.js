import {
  getPokemonType,
  getPokemonTypeIcon,
  getPokemonTypeName,
} from "../data/pokemon-types.js";

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

  setupSectionTabs(article);

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

  const image = document.createElement("img");

  image.className = "pokemon-detail__image";

  image.src = pokemon.artwork ?? "";

  image.alt = pokemon.name;

  image.decoding = "async";

  image.draggable = false;

  if (!pokemon.artwork) {
    image.hidden = true;
  }

  artwork.append(image);

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

  const weaknesses = createWeaknessesSection(pokemon);

  const evolution = createEvolutionSection(pokemon);

  content.append(navigation, about, weaknesses, evolution);

  return content;
}

/* =========================================================
   SECTION NAVIGATION
   ========================================================= */

function createSectionNavigation() {
  const navigation = document.createElement("div");

  navigation.className = "pokemon-detail__section-navigation";

  navigation.setAttribute("role", "tablist");

  navigation.setAttribute("aria-label", "Informações do Pokémon");

  navigation.append(
    createSectionTab({
      id: "pokemon-detail-tab-about",
      panelId: "pokemon-detail-about",
      label: "Sobre",
      active: true,
    }),

    createSectionTab({
      id: "pokemon-detail-tab-weaknesses",
      panelId: "pokemon-detail-weaknesses",
      label: "Fraquezas",
    }),

    createSectionTab({
      id: "pokemon-detail-tab-evolution",
      panelId: "pokemon-detail-evolution",
      label: "Evolução",
    }),
  );

  return navigation;
}

function createSectionTab({ id, panelId, label, active = false }) {
  const button = document.createElement("button");

  button.id = id;

  button.className = "pokemon-detail__section-link";

  button.type = "button";

  button.setAttribute("role", "tab");

  button.setAttribute("aria-controls", panelId);

  button.setAttribute("aria-selected", String(active));

  button.tabIndex = active ? 0 : -1;

  button.dataset.panel = panelId;

  if (active) {
    button.classList.add("is-active");
  }

  button.textContent = label;

  return button;
}

/* =========================================================
   TABS
   ========================================================= */

function setupSectionTabs(article) {
  const tabs = [...article.querySelectorAll('[role="tab"]')];

  const panels = [...article.querySelectorAll('[role="tabpanel"]')];

  function activateTab(selectedTab, { moveFocus = false } = {}) {
    const targetId = selectedTab.dataset.panel;

    tabs.forEach((tab) => {
      const isActive = tab === selectedTab;

      tab.classList.toggle("is-active", isActive);

      tab.setAttribute("aria-selected", String(isActive));

      tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.hidden = panel.id !== targetId;
    });

    if (moveFocus) {
      selectedTab.focus();
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      activateTab(tab);
    });

    tab.addEventListener("keydown", (event) => {
      let nextIndex = null;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      }

      if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      }

      if (event.key === "Home") {
        nextIndex = 0;
      }

      if (event.key === "End") {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex === null) {
        return;
      }

      event.preventDefault();

      activateTab(tabs[nextIndex], {
        moveFocus: true,
      });
    });
  });
}

/* =========================================================
   ABOUT
   ========================================================= */

function createAboutSection(pokemon) {
  const section = createTabPanel({
    id: "pokemon-detail-about",

    labelledBy: "pokemon-detail-tab-about",

    className: "pokemon-detail__about",

    active: true,
  });

  const header = createSectionHeader({
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
   WEAKNESSES
   ========================================================= */

function createWeaknessesSection(pokemon) {
  const section = createTabPanel({
    id: "pokemon-detail-weaknesses",

    labelledBy: "pokemon-detail-tab-weaknesses",

    className: "pokemon-detail__weaknesses",
  });

  const header = createSectionHeader({
    title: "Fraquezas",
  });

  const weaknesses = Array.isArray(pokemon.weaknesses)
    ? pokemon.weaknesses
    : [];

  if (weaknesses.length === 0) {
    const empty = document.createElement("p");

    empty.className = "pokemon-detail__weakness-empty";

    empty.textContent = "Nenhuma fraqueza de tipo encontrada.";

    section.append(header, empty);

    return section;
  }

  const list = document.createElement("ul");

  list.className = "pokemon-detail__weakness-list";

  list.setAttribute("aria-label", "Fraquezas por tipo");

  weaknesses.forEach((weakness) => {
    list.append(createWeaknessItem(weakness));
  });

  section.append(header, list);

  return section;
}

/* =========================================================
   WEAKNESS ITEM
   ========================================================= */

function createWeaknessItem(weakness) {
  const typeData = getPokemonType(weakness.type);

  const item = document.createElement("li");

  item.className = "pokemon-detail__weakness";

  item.dataset.type = weakness.type;

  item.style.setProperty("--weakness-type-color", typeData.color);

  const indicator = document.createElement("span");

  indicator.className = "pokemon-detail__weakness-indicator";

  const icon = document.createElement("img");

  icon.className = "pokemon-detail__weakness-icon";

  icon.src = getPokemonTypeIcon(weakness.type);

  icon.alt = "";

  icon.setAttribute("aria-hidden", "true");

  icon.decoding = "async";

  icon.draggable = false;

  indicator.append(icon);

  const name = document.createElement("span");

  name.className = "pokemon-detail__weakness-name";

  name.textContent = weakness.name || getPokemonTypeName(weakness.type);

  item.setAttribute("aria-label", `Fraqueza a ${name.textContent}`);

  item.append(indicator, name);

  return item;
}

/* =========================================================
   EVOLUTION
   ========================================================= */

function createEvolutionSection(pokemon) {
  const section = createTabPanel({
    id: "pokemon-detail-evolution",

    labelledBy: "pokemon-detail-tab-evolution",

    className: "pokemon-detail__evolution",
  });

  const header = createSectionHeader({
    title: "Evolução",
  });

  const evolution = pokemon.evolution;

  if (!evolution) {
    const empty = createEvolutionEmpty(
      "Dados de evolução temporariamente indisponíveis.",
    );

    section.append(header, empty);

    return section;
  }

  /* =======================================================
     SINGLE STAGE
     ======================================================= */

  if (isSingleStageEvolution(evolution)) {
    const message = createEvolutionEmpty("Este Pokémon não evolui.");

    section.append(header, message);

    return section;
  }

  /* =======================================================
     TREE
     ======================================================= */

  const tree = document.createElement("div");

  tree.className = "pokemon-detail__evolution-tree";

  const treeMode = hasEvolutionBranching(evolution) ? "branched" : "linear";

  tree.classList.add(`pokemon-detail__evolution-tree--${treeMode}`);

  tree.dataset.mode = treeMode;

  tree.setAttribute("aria-label", `Cadeia evolutiva de ${pokemon.name}`);

  const currentSpeciesId =
    Number.isInteger(pokemon.speciesId) && pokemon.speciesId > 0
      ? pokemon.speciesId
      : pokemon.id;

  tree.append(createEvolutionNode(evolution, currentSpeciesId, 0));

  section.append(header, tree);

  return section;
}

/* =========================================================
   EVOLUTION NODE
   ========================================================= */

function createEvolutionNode(node, currentSpeciesId, depth) {
  const branch = document.createElement("div");

  branch.className = "pokemon-detail__evolution-branch";

  branch.dataset.depth = depth;

  const pokemon = createEvolutionPokemon(node, currentSpeciesId);

  branch.append(pokemon);

  const children = getEvolutionChildren(node);

  if (children.length === 0) {
    return branch;
  }

  const childrenContainer = document.createElement("div");

  childrenContainer.className = "pokemon-detail__evolution-children";

  childrenContainer.setAttribute("role", "group");

  const isBranched = children.length > 1;

  childrenContainer.classList.add(isBranched ? "is-branched" : "is-linear");

  children.forEach((child) => {
    const connection = document.createElement("div");

    connection.className = "pokemon-detail__evolution-connection";

    connection.classList.add(isBranched ? "is-branched" : "is-linear");

    /*
     * Cadeia linear:
     * usamos seta.
     *
     * Ramificação:
     * não criamos seta;
     * o CSS desenhará apenas
     * as linhas da árvore.
     */
    if (!isBranched) {
      connection.append(createEvolutionArrow());
    }

    connection.append(createEvolutionNode(child, currentSpeciesId, depth + 1));

    childrenContainer.append(connection);
  });

  branch.append(childrenContainer);

  return branch;
}

/* =========================================================
   EVOLUTION ARROW
   ========================================================= */

function createEvolutionArrow() {
  const arrow = document.createElement("span");

  arrow.className = "pokemon-detail__evolution-arrow";

  arrow.setAttribute("aria-hidden", "true");

  arrow.innerHTML = `
    <svg
      viewBox="0 0 24 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2V27"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path
        d="M6 21L12 27L18 21"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  return arrow;
}

/* =========================================================
   EVOLUTION POKÉMON
   ========================================================= */

function createEvolutionPokemon(node, currentSpeciesId) {
  const link = document.createElement("a");

  link.className = "pokemon-detail__evolution-pokemon";

  link.href = `/pokemon/${node.slug}`;

  link.setAttribute("aria-label", `${node.name} ${node.number}`);

  if (node.id === currentSpeciesId) {
    link.classList.add("is-current");

    link.setAttribute("aria-current", "page");
  }

  const artwork = document.createElement("span");

  artwork.className = "pokemon-detail__evolution-artwork";

  const image = document.createElement("img");

  image.className = "pokemon-detail__evolution-image";

  image.src = node.artwork ?? "";

  image.alt = "";

  image.loading = "lazy";

  image.decoding = "async";

  image.draggable = false;

  if (!node.artwork) {
    image.hidden = true;
  }

  artwork.append(image);

  const identity = document.createElement("span");

  identity.className = "pokemon-detail__evolution-identity";

  const number = document.createElement("span");

  number.className = "pokemon-detail__evolution-number";

  number.textContent = node.number;

  const name = document.createElement("span");

  name.className = "pokemon-detail__evolution-name";

  name.textContent = node.name;

  identity.append(number, name);

  link.append(artwork, identity);

  return link;
}

/* =========================================================
   EVOLUTION STRUCTURE
   ========================================================= */

function isSingleStageEvolution(evolution) {
  return getEvolutionChildren(evolution).length === 0;
}

function hasEvolutionBranching(node) {
  const children = getEvolutionChildren(node);

  if (children.length > 1) {
    return true;
  }

  return children.some((child) => {
    return hasEvolutionBranching(child);
  });
}

function getEvolutionChildren(node) {
  return Array.isArray(node?.children) ? node.children : [];
}

/* =========================================================
   EVOLUTION — EMPTY
   ========================================================= */

function createEvolutionEmpty(message) {
  const empty = document.createElement("p");

  empty.className = "pokemon-detail__evolution-empty";

  empty.textContent = message;

  return empty;
}

/* =========================================================
   TAB PANEL
   ========================================================= */

function createTabPanel({ id, labelledBy, className, active = false }) {
  const section = document.createElement("section");

  section.id = id;

  section.className = `pokemon-detail__section ${className}`;

  section.setAttribute("role", "tabpanel");

  section.setAttribute("aria-labelledby", labelledBy);

  section.tabIndex = 0;

  section.hidden = !active;

  return section;
}

/* =========================================================
   SECTION HEADER
   ========================================================= */

function createSectionHeader({ title }) {
  const header = document.createElement("div");

  header.className = "pokemon-detail__section-header";

  const heading = document.createElement("h2");

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