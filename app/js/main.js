// Bootstrap: one store, hash routes, theme, offline registration, toast.
import { createStore } from "./store.js";
import { createRouter } from "./router.js";
import { initOffline } from "./offline.js";
import { renderOnboarding } from "./ui/onboarding.js";
import { renderToday } from "./ui/today.js";
import { renderPractice } from "./ui/practice.js";
import { renderChart } from "./ui/chart.js";
import { renderExplorer } from "./ui/explorer.js";
import { renderProgress } from "./ui/progress.js";
import { renderSettings } from "./ui/settings.js";

const SCREENS = {
  onboarding: renderOnboarding,
  today: renderToday,
  practice: renderPractice,
  chart: renderChart,
  explorer: renderExplorer,
  progress: renderProgress,
  settings: renderSettings,
};

const TITLES = {
  onboarding: "Welcome",
  today: "Today",
  practice: "Practice",
  chart: "Chart",
  explorer: "Explorer",
  progress: "Progress",
  settings: "Settings",
};

const NAV = [
  ["today", "Today"],
  ["practice", "Practice"],
  ["chart", "Chart"],
  ["progress", "Progress"],
  ["settings", "More"],
];

const store = createStore();
store.init();

const app = document.querySelector("#app");
const screen = document.querySelector("#screen");
const toast = document.querySelector("#toast");
const offlineLabel = document.querySelector("#offline-status");

function applyTheme(theme) {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#12110F" : "#FBFAF7");
}

function renderNav(route) {
  for (const link of document.querySelectorAll("[data-nav]")) {
    const active = link.dataset.nav === route;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

let lastToast = null;
function renderToast() {
  const current = store.getState().toast;
  if (current?.message === lastToast) return;
  lastToast = current?.message || null;
  if (toast) {
    toast.textContent = lastToast || "";
    toast.classList.toggle("is-visible", Boolean(lastToast));
  }
}

function render() {
  const state = store.getState();
  if (!state.ready) return;
  app.classList.toggle("is-onboarding", state.route === "onboarding");
  app.classList.toggle("is-practice", state.route === "practice");
  applyTheme(state.settings.theme);
  document.title = `${TITLES[state.route] || "Dregg"} — Dregg`;
  renderNav(state.route);
  renderToast();
  const renderScreen = SCREENS[state.route] || renderToday;
  renderScreen(screen, store);
  if (offlineLabel) {
    offlineLabel.textContent = state.offline.ready ? "Offline ready" : "Online only";
    offlineLabel.dataset.ready = state.offline.ready ? "true" : "false";
  }
}

store.subscribe(render);

const router = createRouter({
  onChange(route) {
    const state = store.getState();
    const target = state.settings.onboardingDone ? route : "onboarding";
    if (state.route !== target) store.setRoute(target);
    else render();
    const hash = `#/${target}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  },
});

matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
  if (store.getState().settings.theme === "system") applyTheme("system");
});

initOffline({
  onStatus(status) {
    store.setOffline({
      ready: Boolean(status.ready),
      updateReady: Boolean(status.updateReady),
      persistent: status.persistent ?? store.getState().storage.persistent,
    });
    if (status.persistent !== undefined) store.setStorage({ persistent: status.persistent });
  },
  onReady(ready) {
    store.setOffline({ ready });
  },
  onUpdate() {
    store.toast("An update is ready. Open Settings to install it.");
  },
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") render();
});

render();

export { store, router };
