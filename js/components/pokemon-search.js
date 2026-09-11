/* =========================================================
   POKÉDEX — SEARCH COMPONENT
   ========================================================= */

export function createPokemonSearch({ onSearch, onClear } = {}) {
  const search = document.createElement("search");

  search.className = "pokemon-search";

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
      width="20"
      height="20"
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

  input.type = "search";

  input.name = "pokemon";

  input.placeholder = "Buscar Pokémon ou número";

  input.autocomplete = "off";

  input.autocapitalize = "none";

  input.spellcheck = false;

  input.enterKeyHint = "search";

  input.setAttribute("aria-label", "Buscar Pokémon por nome ou número");

  /* =======================================================
     CLEAR BUTTON
     ======================================================= */

  const clearButton = document.createElement("button");

  clearButton.className = "pokemon-search__clear";

  clearButton.type = "button";

  clearButton.setAttribute("aria-label", "Limpar pesquisa");

  clearButton.hidden = true;

  clearButton.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
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

  status.hidden = true;

  status.setAttribute("aria-live", "polite");

  /* =======================================================
     INTERNAL STATE
     ======================================================= */

  function updateClearButton() {
    clearButton.hidden = input.value.length === 0;
  }

  /* =======================================================
     EVENTS — INPUT
     ======================================================= */

  function handleInput() {
    updateClearButton();

    if (typeof onSearch === "function") {
      onSearch(input.value);
    }
  }

  /* =======================================================
     EVENTS — SUBMIT
     ======================================================= */

  function handleSubmit(event) {
    event.preventDefault();

    if (typeof onSearch === "function") {
      onSearch(input.value);
    }
  }

  /* =======================================================
     EVENTS — CLEAR
     ======================================================= */

  function handleClear() {
    input.value = "";

    updateClearButton();

    setStatus("");

    /*
     * Dispara o mesmo fluxo utilizado quando o usuário
     * apaga manualmente o conteúdo do campo.
     *
     * Isso permite que o app encerre o modo de pesquisa
     * e restaure a National Dex.
     */
    input.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    if (typeof onClear === "function") {
      onClear();
    }

    input.focus();
  }

  /* =======================================================
     EVENT LISTENERS
     ======================================================= */

  input.addEventListener("input", handleInput);

  form.addEventListener("submit", handleSubmit);

  clearButton.addEventListener("click", handleClear);

  /* =======================================================
     PUBLIC HELPERS
     ======================================================= */

  function setStatus(message) {
    status.textContent = message;

    status.hidden = !message;
  }

  function setValue(value) {
    input.value = value ?? "";

    updateClearButton();
  }

  function focus() {
    input.focus();
  }

  /* =======================================================
     ASSEMBLY
     ======================================================= */

  field.append(icon, input, clearButton);

  form.append(field);

  search.append(form, status);

  return {
    element: search,
    input,
    setStatus,
    setValue,
    focus,
  };
}