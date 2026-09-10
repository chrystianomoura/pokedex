const app = document.querySelector("#app");

if (!app) {
  throw new Error('Elemento "#app" não encontrado.');
}

function init() {
  console.log("Pokédex iniciada.");
}

init();