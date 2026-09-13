/* =========================================================
   POKÉDEX — POKÉMON SEARCH
   ========================================================= */

export function createPokemonSearch() {
  /* =======================================================
     ROOT
     ======================================================= */

  const element = document.createElement("div");

  element.className = "pokemon-search";

  /* =======================================================
     FORM
     ======================================================= */

  const form = document.createElement("form");

  form.className = "pokemon-search__form";

  form.setAttribute("role", "search");

  form.noValidate = true;

  /* =======================================================
     FIELD
     ======================================================= */

  const field = document.createElement("div");

  field.className = "pokemon-search__field";

  /* =======================================================
     SEARCH ICON
     ======================================================= */

  const icon = document.createElement("span");

  icon.className = "pokemon-search__icon";

  icon.setAttribute("aria-hidden", "true");

  icon.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        stroke-width="1.8"
      />

      <path
        d="M16 16L20 20"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  `;

  /* =======================================================
     INPUT
     ======================================================= */

  const input = document.createElement("input");

  input.className = "pokemon-search__input";

  input.type = "text";

  input.name = "pokemon-search";

  input.placeholder = "Buscar Pokémon ou número";

  input.autocomplete = "off";

  input.spellcheck = false;

  input.enterKeyHint = "search";

  input.setAttribute("aria-label", "Buscar Pokémon por nome ou número");

  /* =======================================================
     CLEAR
     ======================================================= */

  const clearButton = document.createElement("button");

  clearButton.className = "pokemon-search__clear";

  clearButton.type = "button";

  clearButton.setAttribute("aria-label", "Limpar pesquisa");

  clearButton.hidden = true;

  clearButton.innerHTML = `
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

  /* =======================================================
     STATUS
     ======================================================= */

  const status = document.createElement("p");

  status.className = "pokemon-search__status";

  status.setAttribute("aria-live", "polite");

  status.setAttribute("aria-atomic", "true");

  status.hidden = true;

  /* =======================================================
     ASSEMBLY
     ======================================================= */

  field.append(icon, input, clearButton);

  form.append(field);

  element.append(form);

  /* =======================================================
     CLEAR BUTTON STATE
     ======================================================= */

  function updateClearButton() {
    clearButton.hidden = input.value.length === 0;
  }

  /* =======================================================
     STATUS
     ======================================================= */

  function setStatus(message = "") {
    const normalizedMessage = String(message ?? "").trim();

    status.textContent = normalizedMessage;

    status.hidden = normalizedMessage.length === 0;
  }

  /* =======================================================
     VALUE
     ======================================================= */

  function setValue(value = "", { dispatch = false } = {}) {
    input.value = String(value ?? "");

    updateClearButton();

    if (dispatch) {
      input.dispatchEvent(
        new Event("input", {
          bubbles: true,
        }),
      );
    }
  }

  /* =======================================================
     FOCUS
     ======================================================= */

  function focus() {
    input.focus();
  }

  /* =======================================================
     EVENTS
     ======================================================= */

  input.addEventListener("input", () => {
    updateClearButton();
  });

  clearButton.addEventListener("click", () => {
    if (input.value.length === 0) {
      input.focus();

      return;
    }

    input.value = "";

    updateClearButton();

    input.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    input.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  /* =======================================================
     INITIAL STATE
     ======================================================= */

  updateClearButton();

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    element,

    form,

    field,

    input,

    clearButton,

    status,

    setStatus,

    setValue,

    focus,
  };
}
