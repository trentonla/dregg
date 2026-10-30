// Service-worker registration, offline readiness, and storage persistence.
// All checks are local; nothing here makes a network request of its own.
export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return null;
    const already = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    if (already) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

export async function initOffline({ onReady, onUpdate, onStatus } = {}) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    onReady?.(false);
    onStatus?.({ supported: false, ready: false, persistent: null });
    return { supported: false, ready: false };
  }

  let ready = false;
  let updateReady = false;

  const publish = (patch = {}) => {
    onStatus?.({
      supported: true,
      ready,
      updateReady,
      standalone: isStandalone(),
      ...patch,
    });
  };

  try {
    const registration = await navigator.serviceWorker.register(new URL("../sw.js", import.meta.url), {
      scope: new URL("../", import.meta.url).pathname,
      updateViaCache: "none",
    });

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          updateReady = true;
          publish({ updateReady: true });
          onUpdate?.();
        }
      });
    });

    await navigator.serviceWorker.ready;
    ready = true;
    publish({ ready: true });
    onReady?.(true);

    const persistent = await requestPersistence();
    publish({ persistent });
    return { supported: true, ready: true, persistent, registration };
  } catch {
    publish({ ready: false });
    onReady?.(false);
    return { supported: true, ready: false, persistent: null };
  }
}

export async function applyUpdate() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  return true;
}

// Escape hatch for a stale installed app: drop the worker and every cache so
// the next load has to come from the network.
export async function forceReload() {
  try {
    if ("serviceWorker" in navigator) {
      for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
    }
    if (globalThis.caches) {
      for (const key of await caches.keys()) await caches.delete(key);
    }
  } finally {
    location.reload();
  }
}
