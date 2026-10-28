// Hash routing. Relative hashes work under GitHub Pages subpaths and offline.
export const ROUTES = ["onboarding", "today", "practice", "chart", "explorer", "progress", "settings"];

export function parseRoute(hash) {
  const match = /^#\/([a-z]+)/.exec(String(hash || ""));
  return match && ROUTES.includes(match[1]) ? match[1] : null;
}

export function routeHref(route) {
  return `#/${route}`;
}

export function createRouter({ onChange, fallback = "today" } = {}) {
  if (typeof window === "undefined") {
    return {
      current: fallback,
      navigate(route) {
        this.current = route;
      },
      destroy() {},
    };
  }

  const handle = () => {
    const route = parseRoute(window.location.hash) || fallback;
    onChange?.(route);
  };
  window.addEventListener("hashchange", handle);
  handle();
  return {
    current: parseRoute(window.location.hash) || fallback,
    navigate(route) {
      if (window.location.hash === routeHref(route)) {
        onChange?.(route);
      } else {
        window.location.hash = routeHref(route);
      }
    },
    destroy() {
      window.removeEventListener("hashchange", handle);
    },
  };
}
