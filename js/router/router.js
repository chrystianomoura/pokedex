/* =========================================================
   POKÉDEX — ROUTER
   ========================================================= */

export function createRouter({
  routes = [],
  onRouteChange,
  basePath = null,
} = {}) {
  const normalizedBasePath = resolveBasePath(basePath);

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

    ensureHashRoute();

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

    const rawHref = link.getAttribute("href");

    if (typeof rawHref !== "string" || !rawHref.startsWith("#/")) {
      return;
    }

    const applicationPath = normalizeApplicationPath(rawHref.slice(1));

    event.preventDefault();

    navigate(applicationPath);
  }

  /* =======================================================
     INITIAL HASH
     ======================================================= */

  function ensureHashRoute() {
    if (window.location.hash.startsWith("#/")) {
      return;
    }

    const browserPath = createBrowserPath("/", normalizedBasePath);

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

  if (!hash || hash === "#" || !hash.startsWith("#/")) {
    return "/";
  }

  return normalizeApplicationPath(hash.slice(1));
}

/* =========================================================
   BASE PATH
   ========================================================= */

function resolveBasePath(basePath) {
  if (basePath !== null && basePath !== undefined) {
    return normalizeBasePath(basePath);
  }

  return getDocumentBasePath();
}

function getDocumentBasePath() {
  const pathname = window.location.pathname;

  if (!pathname || pathname === "/") {
    return "";
  }

  if (pathname.toLowerCase().endsWith("/index.html")) {
    return normalizeBasePath(pathname.slice(0, -"/index.html".length));
  }

  return normalizeBasePath(pathname);
}

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

/* =========================================================
   BROWSER PATH
   ========================================================= */

function createBrowserPath(applicationPath, basePath) {
  const normalizedPath = normalizeApplicationPath(applicationPath);

  const rootPath = basePath ? `${basePath}/` : "/";

  return `${rootPath}#${normalizedPath}`;
}