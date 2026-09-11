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

  function start() {
    if (started) {
      return;
    }

    started = true;

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick);

    resolveCurrentRoute({
      replace: true,
    });
  }

  function destroy() {
    if (!started) {
      return;
    }

    started = false;

    window.removeEventListener("popstate", handlePopState);
    document.removeEventListener("click", handleDocumentClick);
  }

  function navigate(path, options = {}) {
    const { replace = false, state = null } = options;

    const normalizedPath = normalizePath(path);
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

  function resolveCurrentRoute({ replace = false } = {}) {
    const pathname = getApplicationPath(
      window.location.pathname,
      normalizedBasePath,
    );

    const matchedRoute = matchRoute(routes, pathname);

    const nextRoute = matchedRoute ?? {
      name: "not-found",
      path: pathname,
      params: {},
      route: null,
    };

    currentRoute = nextRoute;

    if (replace && matchedRoute) {
      const browserPath = createBrowserPath(pathname, normalizedBasePath);

      window.history.replaceState(
        window.history.state,
        "",
        `${browserPath}${window.location.search}${window.location.hash}`,
      );
    }

    if (typeof onRouteChange === "function") {
      onRouteChange(currentRoute);
    }

    return currentRoute;
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

    const applicationPath = getApplicationPath(
      url.pathname,
      normalizedBasePath,
    );

    if (applicationPath === null) {
      return;
    }

    event.preventDefault();

    const nextPath = `${applicationPath}${url.search}${url.hash}`;

    navigate(nextPath);
  }

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

function matchRoute(routes, pathname) {
  for (const route of routes) {
    const result = matchPath(route.path, pathname);

    if (!result) {
      continue;
    }

    return {
      name: route.name ?? route.path,

      path: pathname,

      params: result.params,

      route,
    };
  }

  return null;
}

function matchPath(routePath, pathname) {
  const normalizedRoutePath = normalizePath(routePath);

  const normalizedPathname = normalizePath(pathname);

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

      params[paramName] = decodeURIComponent(pathnameSegment);

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
   PATH
   ========================================================= */

function normalizePath(path) {
  if (path === null || path === undefined || path === "") {
    return "/";
  }

  const rawPath = String(path).trim();

  const url = new URL(rawPath, window.location.origin);

  let pathname = url.pathname;

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  return `${pathname}${url.search}${url.hash}`;
}

function getPathSegments(path) {
  const pathname = path.split(/[?#]/)[0];

  if (pathname === "/") {
    return [];
  }

  return pathname.split("/").filter(Boolean);
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

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  if (normalized === "/") {
    return "";
  }

  return normalized;
}

function getApplicationPath(pathname, basePath) {
  if (!basePath) {
    return normalizePath(pathname);
  }

  if (pathname === basePath) {
    return "/";
  }

  if (!pathname.startsWith(`${basePath}/`)) {
    return null;
  }

  const applicationPath = pathname.slice(basePath.length);

  return normalizePath(applicationPath);
}

function createBrowserPath(applicationPath, basePath) {
  const normalizedPath = normalizePath(applicationPath);

  const match = normalizedPath.match(/^([^?#]*)(.*)$/);

  const pathname = match?.[1] ?? "/";

  const suffix = match?.[2] ?? "";

  if (!basePath) {
    return `${pathname}${suffix}`;
  }

  if (pathname === "/") {
    return `${basePath}/${suffix}`;
  }

  return `${basePath}${pathname}${suffix}`;
}