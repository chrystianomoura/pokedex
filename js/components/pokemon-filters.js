import { getPokemonTypeName } from "../data/pokemon-types.js";

/* =========================================================
   POKÉDEX — POKÉMON FILTERS
   ========================================================= */

const DEFAULT_FILTERS = Object.freeze({
  type: "all",

  generation: 0,

  sort: "number-asc",
});

const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

const SORT_OPTIONS = [
  {
    value: "number-asc",

    label: "Número crescente",
  },

  {
    value: "number-desc",

    label: "Número decrescente",
  },

  {
    value: "name-asc",

    label: "A–Z",
  },

  {
    value: "name-desc",

    label: "Z–A",
  },
];

let filterInstanceCount = 0;

/* =========================================================
   FACTORY
   ========================================================= */

export function createPokemonFilters({
  initialFilters = DEFAULT_FILTERS,

  onApply = null,

  onClear = null,
} = {}) {
  validateCallback(onApply, "onApply");

  validateCallback(onClear, "onClear");

  filterInstanceCount += 1;

  const instanceId = `pokemon-filters-${filterInstanceCount}`;

  let filters = normalizeFilters(initialFilters);

  /* =======================================================
     ROOT
     ======================================================= */

  const element = document.createElement("div");

  element.className = "pokemon-filters";

  /* =======================================================
     TOGGLE
     ======================================================= */

  const toggleButton = createToggleButton({
    panelId: `${instanceId}-panel`,
  });

  const badge = toggleButton.querySelector(".pokemon-filters__badge");

  /* =======================================================
     PANEL
     ======================================================= */

  const panel = document.createElement("div");

  panel.id = `${instanceId}-panel`;

  panel.className = "pokemon-filters__panel";

  panel.hidden = true;

  /* =======================================================
     FORM
     ======================================================= */

  const form = document.createElement("form");

  form.className = "pokemon-filters__form";

  form.noValidate = true;

  /* =======================================================
     HEADER
     ======================================================= */

  const header = document.createElement("div");

  header.className = "pokemon-filters__header";

  const title = document.createElement("h2");

  title.className = "pokemon-filters__title";

  title.textContent = "Filtros";

  const closeButton = createCloseButton();

  header.append(title, closeButton);

  /* =======================================================
     FIELDS
     ======================================================= */

  const fields = document.createElement("div");

  fields.className = "pokemon-filters__fields";

  /* =======================================================
     TYPE
     ======================================================= */

  const {
    field: typeField,

    select: typeSelect,
  } = createSelectField({
    id: `${instanceId}-type`,

    label: "Tipo",

    options: createTypeOptions(),
  });

  /* =======================================================
     GENERATION
     ======================================================= */

  const {
    field: generationField,

    select: generationSelect,
  } = createSelectField({
    id: `${instanceId}-generation`,

    label: "Geração",

    options: createGenerationOptions(),
  });

  /* =======================================================
     SORT
     ======================================================= */

  const {
    field: sortField,

    select: sortSelect,
  } = createSelectField({
    id: `${instanceId}-sort`,

    label: "Ordenar por",

    options: SORT_OPTIONS,
  });

  fields.append(typeField, generationField, sortField);

  /* =======================================================
     ACTIONS
     ======================================================= */

  const actions = document.createElement("div");

  actions.className = "pokemon-filters__actions";

  const clearButton = document.createElement("button");

  clearButton.className = "pokemon-filters__clear";

  clearButton.type = "button";

  clearButton.textContent = "Limpar";

  const applyButton = document.createElement("button");

  applyButton.className = "pokemon-filters__apply";

  applyButton.type = "submit";

  applyButton.textContent = "Aplicar filtros";

  actions.append(clearButton, applyButton);

  /* =======================================================
     ASSEMBLY
     ======================================================= */

  form.append(header, fields, actions);

  panel.append(form);

  element.append(toggleButton, panel);

  /* =======================================================
     OPEN / CLOSE
     ======================================================= */

  function open() {
    panel.hidden = false;

    toggleButton.setAttribute("aria-expanded", "true");

    requestAnimationFrame(() => {
      typeSelect.focus();
    });
  }

  function close({ restoreFocus = false } = {}) {
    panel.hidden = true;

    toggleButton.setAttribute("aria-expanded", "false");

    if (restoreFocus) {
      toggleButton.focus();
    }
  }

  function toggle() {
    if (panel.hidden) {
      open();

      return;
    }

    close();
  }

  /* =======================================================
     STATE
     ======================================================= */

  function readControls() {
    return normalizeFilters({
      type: typeSelect.value,

      generation: generationSelect.value,

      sort: sortSelect.value,
    });
  }

  function syncControls() {
    typeSelect.value = filters.type;

    generationSelect.value = String(filters.generation);

    sortSelect.value = filters.sort;

    updateToggleState();
  }

  function setFilters(nextFilters, { notify = false } = {}) {
    filters = normalizeFilters(nextFilters);

    syncControls();

    if (notify && typeof onApply === "function") {
      onApply(getFilters());
    }
  }

  function getFilters() {
    return {
      ...filters,
    };
  }

  function reset({ notify = false } = {}) {
    filters = {
      ...DEFAULT_FILTERS,
    };

    syncControls();

    if (notify && typeof onClear === "function") {
      onClear(getFilters());
    }
  }

  /* =======================================================
     ACTIVE STATE
     ======================================================= */

  function getActiveFilterCount() {
    let count = 0;

    if (filters.type !== DEFAULT_FILTERS.type) {
      count += 1;
    }

    if (filters.generation !== DEFAULT_FILTERS.generation) {
      count += 1;
    }

    if (filters.sort !== DEFAULT_FILTERS.sort) {
      count += 1;
    }

    return count;
  }

  function updateToggleState() {
    const activeCount = getActiveFilterCount();

    toggleButton.classList.toggle("is-active", activeCount > 0);

    badge.textContent = String(activeCount);

    badge.hidden = activeCount === 0;

    const label =
      activeCount === 0
        ? "Abrir filtros"
        : `Abrir filtros, ${activeCount} ativo${activeCount === 1 ? "" : "s"}`;

    toggleButton.setAttribute("aria-label", label);
  }

  /* =======================================================
     EVENTS
     ======================================================= */

  toggleButton.addEventListener("click", toggle);

  closeButton.addEventListener("click", () => {
    close({
      restoreFocus: true,
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    filters = readControls();

    updateToggleState();

    if (typeof onApply === "function") {
      onApply(getFilters());
    }

    close({
      restoreFocus: true,
    });
  });

  clearButton.addEventListener("click", () => {
    reset();

    if (typeof onClear === "function") {
      onClear(getFilters());
    }
  });

  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();

    close({
      restoreFocus: true,
    });
  });

  /* =======================================================
     INITIAL STATE
     ======================================================= */

  syncControls();

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    element,

    toggleButton,

    panel,

    form,

    typeSelect,

    generationSelect,

    sortSelect,

    open,

    close,

    toggle,

    reset,

    setFilters,

    getFilters,

    get isOpen() {
      return !panel.hidden;
    },

    get activeCount() {
      return getActiveFilterCount();
    },

    get isActive() {
      return getActiveFilterCount() > 0;
    },
  };
}

/* =========================================================
   TOGGLE BUTTON
   ========================================================= */

function createToggleButton({ panelId }) {
  const button = document.createElement("button");

  button.className = "pokemon-filters__toggle";

  button.type = "button";

  button.setAttribute("aria-label", "Abrir filtros");

  button.setAttribute("aria-expanded", "false");

  button.setAttribute("aria-controls", panelId);

  const icon = document.createElement("span");

  icon.className = "pokemon-filters__toggle-icon";

  icon.setAttribute("aria-hidden", "true");

  icon.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7H20"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />

      <path
        d="M7 12H17"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />

      <path
        d="M10 17H14"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  `;

  const label = document.createElement("span");

  label.className = "pokemon-filters__toggle-label";

  label.textContent = "Filtros";

  const badge = document.createElement("span");

  badge.className = "pokemon-filters__badge";

  badge.hidden = true;

  badge.setAttribute("aria-hidden", "true");

  button.append(icon, label, badge);

  return button;
}

/* =========================================================
   CLOSE BUTTON
   ========================================================= */

function createCloseButton() {
  const button = document.createElement("button");

  button.className = "pokemon-filters__close";

  button.type = "button";

  button.setAttribute("aria-label", "Fechar filtros");

  button.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 7L17 17"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />

      <path
        d="M17 7L7 17"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  `;

  return button;
}

/* =========================================================
   SELECT FIELD
   ========================================================= */

function createSelectField({ id, label, options }) {
  const field = document.createElement("div");

  field.className = "pokemon-filters__field";

  const labelElement = document.createElement("label");

  labelElement.className = "pokemon-filters__label";

  labelElement.htmlFor = id;

  labelElement.textContent = label;

  const control = document.createElement("div");

  control.className = "pokemon-filters__select-control";

  const select = document.createElement("select");

  select.id = id;

  select.className = "pokemon-filters__select";

  options.forEach((option) => {
    const optionElement = document.createElement("option");

    optionElement.value = String(option.value);

    optionElement.textContent = option.label;

    select.append(optionElement);
  });

  const indicator = document.createElement("span");

  indicator.className = "pokemon-filters__select-indicator";

  indicator.setAttribute("aria-hidden", "true");

  indicator.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;

  control.append(select, indicator);

  field.append(labelElement, control);

  return {
    field,

    select,
  };
}

/* =========================================================
   TYPE OPTIONS
   ========================================================= */

function createTypeOptions() {
  return [
    {
      value: "all",

      label: "Todos os tipos",
    },

    ...POKEMON_TYPES.map((type) => {
      return {
        value: type,

        label: getPokemonTypeName(type),
      };
    }),
  ];
}

/* =========================================================
   GENERATION OPTIONS
   ========================================================= */

function createGenerationOptions() {
  const generations = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

  return [
    {
      value: 0,

      label: "Todas as gerações",
    },

    ...generations.map((label, index) => {
      return {
        value: index + 1,

        label: `Geração ${label}`,
      };
    }),
  ];
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizeFilters(filters) {
  const source =
    filters && typeof filters === "object" ? filters : DEFAULT_FILTERS;

  const type = normalizeType(source.type);

  const generation = normalizeGeneration(source.generation);

  const sort = normalizeSort(source.sort);

  return {
    type,
    generation,
    sort,
  };
}

/* =========================================================
   TYPE NORMALIZATION
   ========================================================= */

function normalizeType(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "all") {
    return "all";
  }

  if (POKEMON_TYPES.includes(normalized)) {
    return normalized;
  }

  return DEFAULT_FILTERS.type;
}

/* =========================================================
   GENERATION NORMALIZATION
   ========================================================= */

function normalizeGeneration(value) {
  const generation = Number(value);

  if (Number.isInteger(generation) && generation >= 0 && generation <= 9) {
    return generation;
  }

  return DEFAULT_FILTERS.generation;
}

/* =========================================================
   SORT NORMALIZATION
   ========================================================= */

function normalizeSort(value) {
  const normalized = String(value ?? "").trim();

  const isValid = SORT_OPTIONS.some((option) => {
    return option.value === normalized;
  });

  return isValid ? normalized : DEFAULT_FILTERS.sort;
}

/* =========================================================
   CALLBACK VALIDATION
   ========================================================= */

function validateCallback(callback, name) {
  if (callback !== null && typeof callback !== "function") {
    throw new Error(`Pokémon Filters: callback "${name}" inválido.`);
  }
}