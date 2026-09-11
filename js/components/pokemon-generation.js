/* =========================================================
   POKÉDEX — GENERATION COMPONENT
   ========================================================= */

export function createPokemonGenerationSelector({
  generations = [],
  activeGenerationId = null,
  onSelect,
} = {}) {
  const section = document.createElement("section");

  section.className = "pokemon-generation";

  section.setAttribute("aria-label", "Selecionar geração");

  /* =======================================================
     HEADER
     ======================================================= */

  const header = document.createElement("div");

  header.className = "pokemon-generation__header";

  const title = document.createElement("h2");

  title.className = "pokemon-generation__title";

  title.textContent = "Gerações";

  header.append(title);

  /* =======================================================
     LIST
     ======================================================= */

  const list = document.createElement("div");

  list.className = "pokemon-generation__list";

  list.setAttribute("role", "list");

  generations.forEach((generation) => {
    const button = createGenerationButton({
      generation,
      activeGenerationId,
      onSelect,
    });

    list.append(button);
  });

  /* =======================================================
     ASSEMBLY
     ======================================================= */

  section.append(header, list);

  return section;
}

/* =========================================================
   GENERATION BUTTON
   ========================================================= */

function createGenerationButton({ generation, activeGenerationId, onSelect }) {
  const wrapper = document.createElement("div");

  wrapper.className = "pokemon-generation__item";

  wrapper.setAttribute("role", "listitem");

  const button = document.createElement("button");

  button.className = "pokemon-generation__button";

  button.type = "button";

  button.dataset.generationId = generation.id;

  button.textContent = generation.label;

  const isActive = generation.id === activeGenerationId;

  button.classList.toggle("pokemon-generation__button--active", isActive);

  button.setAttribute("aria-pressed", String(isActive));

  button.addEventListener("click", () => {
    if (typeof onSelect !== "function") {
      return;
    }

    onSelect(generation);
  });

  wrapper.append(button);

  return wrapper;
}