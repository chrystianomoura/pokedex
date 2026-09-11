import { getPokemon } from "./api/pokeapi.js";
import { createPokemonCard } from "./components/pokemon-card.js";
import { mapPokemonToCard } from "./services/pokemon.js";

const app = document.querySelector("#app");

if (!app) {
  throw new Error('Elemento "#app" não encontrado.');
}

const TEST_POKEMON_IDS = [
  1,  // Bulbasaur
  2,  // Ivysaur
  3,  // Venusaur
  4,  // Charmander
  5,  // Charmeleon
  6,  // Charizard
  7,  // Squirtle
  8,  // Wartortle
  25, // Pikachu
];

function createPage() {
  const page = document.createElement("main");

  page.className = "pokedex-page";

  const header = document.createElement("header");
  header.className = "pokedex-page__header";

  const title = document.createElement("h1");
  title.className = "pokedex-page__title";
  title.textContent = "Pokédex";

  header.append(title);

  const grid = document.createElement("section");

  grid.className = "pokemon-grid";
  grid.setAttribute("aria-label", "Lista de Pokémon");

  page.append(header, grid);

  return {
    page,
    grid,
  };
}

async function loadPokemon(ids) {
  const requests = ids.map((id) => getPokemon(id));

  const rawPokemon = await Promise.all(requests);

  return rawPokemon.map(mapPokemonToCard);
}

async function init() {
  const { page, grid } = createPage();

  app.replaceChildren(page);

  try {
    const pokemonList = await loadPokemon(TEST_POKEMON_IDS);

    pokemonList.forEach((pokemon) => {
      grid.append(createPokemonCard(pokemon));
    });
  } catch (error) {
    console.error("Erro ao carregar a Pokédex:", error);
  }
}

init();