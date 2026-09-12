/* =========================================================
   POKÉDEX — ROUTER
   ========================================================= */

export function createRouter({
  routes = [],
  onRouteChange,
  basePath = "",
} = {}) {
  const normalizedBasePath = normalizeBasePath(basePath);

  let currentRoute = null;
  let started = false;

  /* =======================================================
     LIFECYCLE
     ======================================================= */

  function start() {
    if (started) {
      return;
    }

    started = true;

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handlePopState);

    document.addEventListener("click", handleDocumentClick);

    migrateLegacyPath();

    resolveCurrentRoute({
      replace: true,
    });
  }

  function destroy() {
    if (!started) {
      return;
    }

    started = false;

    window.removeEventListener("hashchange", handleHashChange);
    window.removeEventListener("popstate", handlePopState);

    document.removeEventListener("click", handleDocumentClick);
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function navigate(path, options = {}) {
    const { replace = false, state = null } = options;

    const normalizedPath = normalizeApplicationPath(path);

    const browserPath = createBrowserPath(normalizedPath, normalizedBasePath);

    if (replace) {
      window.history.replaceState(state, "", browserPath);
    } else {
      window.history.pushState(state, "", browserPath);
    }

    resolveCurrentRoute();
  }

  function replace(path, state = null) {
    navigate(path, {
      replace: true,
      state,
    });
  }

  /* =======================================================
     RESOLVE
     ======================================================= */

  function resolveCurrentRoute({ replace = false } = {}) {
    const applicationPath = getApplicationPathFromHash();

    const matchedRoute = matchRoute(routes, applicationPath);

    const nextRoute = matchedRoute ?? {
      name: "not-found",

      path: applicationPath,

      params: {},

      route: null,
    };

    currentRoute = nextRoute;

    if (replace) {
      const browserPath = createBrowserPath(
        applicationPath,
        normalizedBasePath,
      );

      window.history.replaceState(window.history.state, "", browserPath);
    }

    if (typeof onRouteChange === "function") {
      onRouteChange(currentRoute);
    }

    return currentRoute;
  }

  /* =======================================================
     EVENTS
     ======================================================= */

  function handleHashChange() {
    resolveCurrentRoute();
  }

  function handlePopState() {
    resolveCurrentRoute();
  }

  function handleDocumentClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest("a[href]");

    if (!link) {
      return;
    }

    if (link.hasAttribute("download") || link.target === "_blank") {
      return;
    }

    const url = new URL(link.href, window.location.href);

    if (url.origin !== window.location.origin) {
      return;
    }

    const applicationPath = getApplicationPathFromUrl(url, normalizedBasePath);

    if (applicationPath === null) {
      return;
    }

    event.preventDefault();

    navigate(applicationPath);
  }

  /* =======================================================
     LEGACY PATH MIGRATION
     ======================================================= */

  function migrateLegacyPath() {
    if (window.location.hash) {
      return;
    }

    const legacyPath = getApplicationPathFromPathname(
      window.location.pathname,
      normalizedBasePath,
    );

    if (legacyPath === null || legacyPath === "/") {
      return;
    }

    const suffix = window.location.search;

    const applicationPath = `${legacyPath}${suffix}`;

    const browserPath = createBrowserPath(applicationPath, normalizedBasePath);

    window.history.replaceState(window.history.state, "", browserPath);
  }

  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {
    start,
    destroy,
    navigate,
    replace,
    resolve: resolveCurrentRoute,

    get currentRoute() {
      return currentRoute;
    },
  };
}

/* =========================================================
   ROUTE MATCHING
   ========================================================= */

function matchRoute(routes, applicationPath) {
  const pathname = getPathname(applicationPath);

  for (const route of routes) {
    const result = matchPath(route.path, pathname);

    if (!result) {
      continue;
    }

    return {
      name: route.name ?? route.path,

      path: applicationPath,

      params: result.params,

      route,
    };
  }

  return null;
}

function matchPath(routePath, pathname) {
  const normalizedRoutePath = normalizePathname(routePath);

  const normalizedPathname = normalizePathname(pathname);

  const routeSegments = getPathSegments(normalizedRoutePath);

  const pathnameSegments = getPathSegments(normalizedPathname);

  if (routeSegments.length !== pathnameSegments.length) {
    return null;
  }

  const params = {};

  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];

    const pathnameSegment = pathnameSegments[index];

    if (routeSegment.startsWith(":")) {
      const paramName = routeSegment.slice(1);

      if (!paramName) {
        return null;
      }

      try {
        params[paramName] = decodeURIComponent(pathnameSegment);
      } catch {
        params[paramName] = pathnameSegment;
      }

      continue;
    }

    if (routeSegment !== pathnameSegment) {
      return null;
    }
  }

  return {
    params,
  };
}

/* =========================================================
   APPLICATION PATH
   ========================================================= */

function normalizeApplicationPath(path) {
  if (path === null || path === undefined || path === "") {
    return "/";
  }

  let rawPath = String(path).trim();

  if (!rawPath) {
    return "/";
  }

  if (rawPath.startsWith("#")) {
    rawPath = rawPath.slice(1);
  }

  if (!rawPath.startsWith("/")) {
    rawPath = `/${rawPath}`;
  }

  const hashIndex = rawPath.indexOf("#");

  if (hashIndex !== -1) {
    rawPath = rawPath.slice(0, hashIndex);
  }

  const queryIndex = rawPath.indexOf("?");

  const rawPathname =
    queryIndex === -1 ? rawPath : rawPath.slice(0, queryIndex);

  const search = queryIndex === -1 ? "" : rawPath.slice(queryIndex);

  const pathname = normalizePathname(rawPathname);

  return `${pathname}${search}`;
}

function normalizePathname(pathname) {
  if (pathname === null || pathname === undefined || pathname === "") {
    return "/";
  }

  let normalized = String(pathname).trim();

  normalized = normalized.split(/[?#]/)[0];

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, "/");

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || "/";
}

function getPathname(applicationPath) {
  return normalizePathname(applicationPath);
}

function getPathSegments(pathname) {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/") {
    return [];
  }

  return normalizedPathname.split("/").filter(Boolean);
}

/* =========================================================
   HASH
   ========================================================= */

function getApplicationPathFromHash() {
  const hash = window.location.hash;

  if (!hash || hash === "#") {
    return "/";
  }

  const rawPath = hash.slice(1);

  return normalizeApplicationPath(rawPath);
}

/* =========================================================
   LINKS
   ========================================================= */

function getApplicationPathFromUrl(url, basePath) {
  /*
   * Link já usando hash routing.
   *
   * Exemplo:
   *
   * /pokedex/#/pokemon/pikachu
   */

  if (url.hash.startsWith("#/")) {
    return normalizeApplicationPath(url.hash.slice(1));
  }

  /*
   * Compatibilidade temporária com links antigos.
   *
   * Exemplo:
   *
   * /pokemon/pikachu
   *
   * ou:
   *
   * /pokedex/pokemon/pikachu
   */

  const pathname = getApplicationPathFromPathname(url.pathname, basePath);

  if (pathname === null) {
    return null;
  }

  return normalizeApplicationPath(`${pathname}${url.search}`);
}

/* =========================================================
   BASE PATH
   ========================================================= */

function normalizeBasePath(basePath) {
  if (!basePath) {
    return "";
  }

  let normalized = String(basePath).trim();

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, "/");

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  if (normalized === "/") {
    return "";
  }

  return normalized;
}

function getApplicationPathFromPathname(pathname, basePath) {
  const normalizedPathname = normalizePathname(pathname);

  if (!basePath) {
    return normalizedPathname;
  }

  if (normalizedPathname === basePath) {
    return "/";
  }

  if (!normalizedPathname.startsWith(`${basePath}/`)) {
    return null;
  }

  const applicationPath = normalizedPathname.slice(basePath.length);

  return normalizePathname(applicationPath);
}

/* =========================================================
   BROWSER PATH
   ========================================================= */

function createBrowserPath(applicationPath, basePath) {
  const normalizedPath = normalizeApplicationPath(applicationPath);

  const rootPath = basePath ? `${basePath}/` : "/";

  return `${rootPath}#${normalizedPath}`;
}