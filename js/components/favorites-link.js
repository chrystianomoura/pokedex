/* =========================================================
   POKÉDEX — FAVORITES LINK
   ========================================================= */

/* =========================================================
   FACTORY
   ========================================================= */

export function createFavoritesLink() {
  const link = document.createElement("a");

  link.className = "pokedex-favorites-link";

  link.href = "/favorites";

  link.setAttribute("aria-label", "Abrir favoritos");

  link.innerHTML = `
    <svg
      viewBox="0 0 24 24"
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

  return link;
}