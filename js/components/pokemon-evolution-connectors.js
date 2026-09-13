/* =========================================================
   POKÉDEX — EVOLUTION CONNECTORS
   ========================================================= */

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const CONNECTOR_COLOR = "#17191c";
const CONNECTOR_WIDTH = 2;

const PARENT_STEM = 18;
const CHILD_GAP = 5;
const ROW_CONNECTOR_GAP = 16;

const connectorControllers = new WeakMap();

/* =========================================================
   SETUP
   ========================================================= */

export function setupPokemonEvolutionConnectors(article) {
  if (!(article instanceof Element)) {
    return;
  }

  const previousController = connectorControllers.get(article);

  if (previousController) {
    previousController.dispose();
  }

  const tree = article.querySelector(
    ".pokemon-detail__evolution-tree--branched",
  );

  if (!tree) {
    return;
  }

  const svg = createConnectorLayer();

  tree.prepend(svg);

  let frameId = null;

  function scheduleRender() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }

    frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => {
        frameId = null;

        renderEvolutionConnectors(tree, svg);
      });
    });
  }

  const resizeObserver = new ResizeObserver(() => {
    scheduleRender();
  });

  resizeObserver.observe(tree);

  const evolutionTab = article.querySelector(
    '[data-panel="pokemon-detail-evolution"]',
  );

  evolutionTab?.addEventListener("click", scheduleRender);

  scheduleRender();

  const controller = {
    dispose() {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);

        frameId = null;
      }

      resizeObserver.disconnect();

      evolutionTab?.removeEventListener("click", scheduleRender);

      svg.remove();

      connectorControllers.delete(article);
    },

    render: scheduleRender,
  };

  connectorControllers.set(article, controller);

  return controller;
}

/* =========================================================
   SVG LAYER
   ========================================================= */

function createConnectorLayer() {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");

  svg.classList.add("pokemon-detail__evolution-connectors");

  svg.setAttribute("aria-hidden", "true");

  svg.setAttribute("focusable", "false");

  svg.setAttribute("preserveAspectRatio", "none");

  return svg;
}

/* =========================================================
   RENDER
   ========================================================= */

function renderEvolutionConnectors(tree, svg) {
  if (!tree.isConnected) {
    return;
  }

  const treeRect = tree.getBoundingClientRect();

  if (treeRect.width <= 0 || treeRect.height <= 0) {
    return;
  }

  const width = Math.ceil(treeRect.width);
  const height = Math.ceil(treeRect.height);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  svg.setAttribute("width", String(width));

  svg.setAttribute("height", String(height));

  svg.replaceChildren();

  const branches = tree.querySelectorAll(".pokemon-detail__evolution-branch");

  branches.forEach((branch) => {
    renderBranchConnector({
      treeRect,
      branch,
      svg,
    });
  });
}

/* =========================================================
   BRANCH CONNECTOR
   ========================================================= */

function renderBranchConnector({ treeRect, branch, svg }) {
  const parentPokemon = getDirectChildByClass(
    branch,
    "pokemon-detail__evolution-pokemon",
  );

  const childrenContainer = getDirectChildByClass(
    branch,
    "pokemon-detail__evolution-children",
  );

  if (
    !parentPokemon ||
    !childrenContainer ||
    !childrenContainer.classList.contains("is-branched")
  ) {
    return;
  }

  const childConnections = [...childrenContainer.children].filter((child) => {
    return child.classList.contains("pokemon-detail__evolution-connection");
  });

  if (childConnections.length < 2) {
    return;
  }

  const childEntries = childConnections
    .map((connection) => {
      const childBranch = getDirectChildByClass(
        connection,
        "pokemon-detail__evolution-branch",
      );

      if (!childBranch) {
        return null;
      }

      const pokemon = getDirectChildByClass(
        childBranch,
        "pokemon-detail__evolution-pokemon",
      );

      if (!pokemon) {
        return null;
      }

      return {
        connection,
        pokemon,
        row: Number(connection.dataset.row) || 1,
      };
    })
    .filter(Boolean);

  if (childEntries.length < 2) {
    return;
  }

  const parentRect = parentPokemon.getBoundingClientRect();

  const parentPoint = {
    x: getCenterX(parentRect, treeRect),

    y: parentRect.bottom - treeRect.top + CHILD_GAP,
  };

  const children = childEntries.map((entry) => {
    const rect = entry.pokemon.getBoundingClientRect();

    return {
      ...entry,

      x: getCenterX(rect, treeRect),

      y: rect.top - treeRect.top - CHILD_GAP,
    };
  });

  const rows = groupChildrenByRow(children);

  const pathData = createBranchPath({
    parentPoint,

    rows,
  });

  if (!pathData) {
    return;
  }

  svg.append(createPath(pathData));
}

/* =========================================================
   BRANCH PATH
   ========================================================= */

function createBranchPath({ parentPoint, rows }) {
  const orderedRows = [...rows.entries()].sort(
    ([firstRow], [secondRow]) => firstRow - secondRow,
  );

  if (orderedRows.length === 0) {
    return "";
  }

  const [, firstRow] = orderedRows[0];

  if (!firstRow || firstRow.length === 0) {
    return "";
  }

  const commands = [];

  const firstRowTop = Math.min(...firstRow.map((child) => child.y));

  const firstJunctionY = Math.min(
    parentPoint.y + PARENT_STEM,

    firstRowTop - 10,
  );

  /* =======================================================
     PARENT → FIRST JUNCTION
     ======================================================= */

  commands.push(
    `M ${format(parentPoint.x)} ${format(parentPoint.y)}`,

    `V ${format(firstJunctionY)}`,
  );

  drawRow({
    commands,

    row: firstRow,

    junctionY: firstJunctionY,
  });

  let previousJunctionY = firstJunctionY;

  /* =======================================================
     REMAINING ROWS
     ======================================================= */

  for (let index = 1; index < orderedRows.length; index += 1) {
    const [, row] = orderedRows[index];

    if (!row || row.length === 0) {
      continue;
    }

    /*
     * Última linha com apenas um Pokémon.
     *
     * Ex.:
     * Tyrogue → Hitmontop
     * Applin → Dipplin
     *
     * O tronco vem do nível anterior diretamente até ele.
     */

    if (row.length === 1) {
      const child = row[0];

      if (Math.abs(child.x - parentPoint.x) < 1) {
        commands.push(
          `M ${format(parentPoint.x)} ${format(previousJunctionY)}`,

          `V ${format(child.y)}`,
        );

        previousJunctionY = child.y;

        continue;
      }

      const childJunctionY = Math.max(
        previousJunctionY + ROW_CONNECTOR_GAP,

        child.y - ROW_CONNECTOR_GAP,
      );

      commands.push(
        `M ${format(parentPoint.x)} ${format(previousJunctionY)}`,

        `V ${format(childJunctionY)}`,

        `H ${format(child.x)}`,

        `V ${format(child.y)}`,
      );

      previousJunctionY = childJunctionY;

      continue;
    }

    /* =====================================================
       NEXT ROW JUNCTION
       ===================================================== */

    const rowTop = Math.min(...row.map((child) => child.y));

    const junctionY = Math.max(
      previousJunctionY + ROW_CONNECTOR_GAP,

      rowTop - ROW_CONNECTOR_GAP,
    );

    /*
     * Esta é a barra vertical que estava faltando.
     *
     * Ela liga uma ramificação intermediária à próxima.
     *
     * A linha para na última barra porque não existe outra
     * iteração depois dela.
     */

    commands.push(
      `M ${format(parentPoint.x)} ${format(previousJunctionY)}`,

      `V ${format(junctionY)}`,
    );

    drawRow({
      commands,

      row,

      junctionY,
    });

    previousJunctionY = junctionY;
  }

  return commands.join(" ");
}

/* =========================================================
   ROW
   ========================================================= */

function drawRow({ commands, row, junctionY }) {
  if (row.length === 0) {
    return;
  }

  if (row.length === 1) {
    const child = row[0];

    commands.push(
      `M ${format(child.x)} ${format(junctionY)}`,

      `V ${format(child.y)}`,
    );

    return;
  }

  const leftChild = row[0];

  const rightChild = row[row.length - 1];

  /* =======================================================
     HORIZONTAL BAR
     ======================================================= */

  commands.push(
    `M ${format(leftChild.x)} ${format(junctionY)}`,

    `H ${format(rightChild.x)}`,
  );

  /* =======================================================
     CHILD STEMS
     ======================================================= */

  row.forEach((child) => {
    commands.push(
      `M ${format(child.x)} ${format(junctionY)}`,

      `V ${format(child.y)}`,
    );
  });
}

/* =========================================================
   ROW GROUPING
   ========================================================= */

function groupChildrenByRow(children) {
  const rows = new Map();

  children.forEach((child) => {
    if (!rows.has(child.row)) {
      rows.set(child.row, []);
    }

    rows.get(child.row).push(child);
  });

  rows.forEach((row) => {
    row.sort((firstChild, secondChild) => {
      return firstChild.x - secondChild.x;
    });
  });

  return rows;
}

/* =========================================================
   SVG PATH
   ========================================================= */

function createPath(pathData) {
  const path = document.createElementNS(SVG_NAMESPACE, "path");

  path.setAttribute("d", pathData);

  path.setAttribute("fill", "none");

  path.setAttribute("stroke", CONNECTOR_COLOR);

  path.setAttribute("stroke-width", String(CONNECTOR_WIDTH));

  path.setAttribute("stroke-linecap", "square");

  path.setAttribute("stroke-linejoin", "miter");

  path.setAttribute("vector-effect", "non-scaling-stroke");

  path.setAttribute("shape-rendering", "geometricPrecision");

  return path;
}

/* =========================================================
   DIRECT CHILD
   ========================================================= */

function getDirectChildByClass(parent, className) {
  return [...parent.children].find((child) => {
    return child.classList.contains(className);
  });
}

/* =========================================================
   GEOMETRY
   ========================================================= */

function getCenterX(rect, referenceRect) {
  return rect.left - referenceRect.left + rect.width / 2;
}

function format(value) {
  return Number(value.toFixed(2));
}