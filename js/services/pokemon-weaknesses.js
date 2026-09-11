import { getPokemonTypeName } from "../data/pokemon-types.js";

/* =========================================================
   POKÉDEX — POKÉMON WEAKNESSES SERVICE
   ========================================================= */

/* =========================================================
   PUBLIC API
   ========================================================= */

export function calculatePokemonWeaknesses(typeRelations = []) {
  if (!Array.isArray(typeRelations)) {
    throw new Error("Relações de tipos inválidas.");
  }

  if (typeRelations.length === 0) {
    return [];
  }

  const multipliers = calculateDamageMultipliers(typeRelations);

  return [...multipliers.entries()]
    .filter(([, multiplier]) => {
      return multiplier > 1;
    })
    .map(([type, multiplier]) => {
      return {
        type,

        name: getPokemonTypeName(type),

        multiplier,
      };
    })
    .sort(sortWeaknesses);
}

/* =========================================================
   DAMAGE MULTIPLIERS
   ========================================================= */

function calculateDamageMultipliers(typeRelations) {
  const attackTypes = collectAttackTypes(typeRelations);

  const multipliers = new Map();

  attackTypes.forEach((attackType) => {
    let multiplier = 1;

    typeRelations.forEach((typeData) => {
      multiplier *= getDefensiveMultiplier(typeData, attackType);
    });

    multipliers.set(attackType, multiplier);
  });

  return multipliers;
}

/* =========================================================
   ATTACK TYPES
   ========================================================= */

function collectAttackTypes(typeRelations) {
  const attackTypes = new Set();

  typeRelations.forEach((typeData) => {
    const relations = typeData?.damage_relations;

    if (!relations) {
      return;
    }

    addRelationTypes(attackTypes, relations.double_damage_from);

    addRelationTypes(attackTypes, relations.half_damage_from);

    addRelationTypes(attackTypes, relations.no_damage_from);
  });

  return attackTypes;
}

function addRelationTypes(target, relations) {
  if (!Array.isArray(relations)) {
    return;
  }

  relations.forEach((relation) => {
    const type = relation?.name;

    if (type) {
      target.add(type);
    }
  });
}

/* =========================================================
   DEFENSIVE MULTIPLIER
   ========================================================= */

function getDefensiveMultiplier(typeData, attackType) {
  const relations = typeData?.damage_relations;

  if (!relations) {
    return 1;
  }

  if (hasRelation(relations.no_damage_from, attackType)) {
    return 0;
  }

  if (hasRelation(relations.double_damage_from, attackType)) {
    return 2;
  }

  if (hasRelation(relations.half_damage_from, attackType)) {
    return 0.5;
  }

  return 1;
}

function hasRelation(relations, attackType) {
  if (!Array.isArray(relations)) {
    return false;
  }

  return relations.some((relation) => {
    return relation?.name === attackType;
  });
}

/* =========================================================
   SORT
   ========================================================= */

function sortWeaknesses(first, second) {
  if (first.multiplier !== second.multiplier) {
    return second.multiplier - first.multiplier;
  }

  return first.name.localeCompare(second.name, "pt-BR");
}