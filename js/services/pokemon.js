function formatPokemonNumber(id) {
  return `#${String(id).padStart(3, "0")}`;
}

function formatPokemonName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function mapPokemonToCard(rawPokemon) {
  const artwork =
    rawPokemon.sprites?.other?.["official-artwork"]?.front_default ?? null;

  const types = rawPokemon.types
    .sort((a, b) => a.slot - b.slot)
    .map(({ type }) => type.name);

  return {
    id: rawPokemon.id,
    number: formatPokemonNumber(rawPokemon.id),
    name: formatPokemonName(rawPokemon.name),
    types,
    artwork,
  };
}