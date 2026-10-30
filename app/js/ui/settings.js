// Settings: track, session shape, display, storage, offline, and about.
import { escapeHtml, pageHeader } from "./components.js";
import { backupHtml, wireBackup } from "./backup.js";
import { applyUpdate, forceReload } from "../offline.js";
import { BUILD } from "../build.js";

function toggle(name, label, hint, checked, { disabled = false } = {}) {
  return `<label class="setting-row${disabled ? " is-disabled" : ""}">
    <span class="setting-copy"><span class="setting-label">${escapeHtml(label)}</span><span class="muted">${escapeHtml(hint)}</span></span>
    <input class="switch" type="checkbox" name="${name}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
  </label>`;
}

function select(name, label, hint, value, options) {
  return `<label class="setting-row">
    <span class="setting-copy"><span class="setting-label">${escapeHtml(label)}</span><span class="muted">${escapeHtml(hint)}</span></span>
    <select class="select" name="${name}">${options
      .map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${String(value) === String(optionValue) ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`)
      .join("")}</select>
  </label>`;
}

function segmented(name, label, hint, value, options) {
  return `<fieldset class="setting-row setting-row--stack">
    <legend class="setting-copy"><span class="setting-label">${escapeHtml(label)}</span><span class="muted">${escapeHtml(hint)}</span></legend>
    <div class="segmented">${options
      .map(
        ([optionValue, optionLabel]) =>
          `<label><input type="radio" name="${name}" value="${optionValue}" ${String(value) === optionValue ? "checked" : ""}><span>${escapeHtml(optionLabel)}</span></label>`,
      )
      .join("")}</div>
  </fieldset>`;
}

export function renderSettings(root, store) {
  function render() {
    const state = store.getState();
    const settings = state.settings;
    const precisionReady = store.isPrecisionAvailable();
    const storage = state.storage;
    const offline = state.offline;
    const track = state.track;

    root.innerHTML = `${pageHeader("Settings", "Everything stays on this device.")}
    <section class="module">
      <div class="module-head"><h2>Track</h2></div>
      <div class="segmented segmented--wide">
        <label><input type="radio" name="track" value="core" ${track === "core" ? "checked" : ""}><span>Core</span></label>
        <label class="${precisionReady ? "" : "is-disabled"}"><input type="radio" name="track" value="precision" ${track === "precision" ? "checked" : ""} ${precisionReady ? "" : "disabled"}><span>Precision${precisionReady ? "" : " (finish Core)"}</span></label>
      </div>
      <p class="muted">Core uses four vowel shapes. Precision adds the dot and tick marks for all twelve vowel signs.</p>
    </section>

    <section class="module">
      <div class="module-head"><h2>Practice</h2></div>
      ${select("sessionLength", "Session length", "Items per session.", settings.sessionLength, [[10, "10 items"], [15, "15 items"], [20, "20 items"], [30, "30 items"]])}
      ${segmented("modeMix", "Mode mix", "Read is the easiest on a keyboard; mixed adds writing, tracing, and drills.", settings.modeMix, [["read", "Mostly read"], ["mixed", "Mixed"], ["write", "Mostly write"]])}
      ${toggle("sound", "Sound", "On-device speech for dictation, when the browser has a voice.", settings.sound)}
      ${toggle("haptics", "Haptics", "Short vibration on check, where supported.", settings.haptics)}
    </section>

    <section class="module">
      <div class="module-head"><h2>Display</h2></div>
      ${segmented("theme", "Theme", "Follow the system, or pin light or dark.", settings.theme, [["system", "System"], ["light", "Light"], ["dark", "Dark"]])}
    </section>

    <section class="module">
      <div class="module-head"><h2>Storage & offline</h2><span class="badge ${storage.persistent ? "badge--ok" : "badge--warn"}">${storage.persistent ? "Persistent" : "Best effort"}</span></div>
      <p class="muted">${storage.available ? "Progress is saved in this browser." : "This browser is blocking local storage. Progress will not survive a reload."}</p>
      <p class="muted">${offline.ready ? "Offline cache ready. The app works without a network after install." : "Offline cache is still warming up."}${offline.updateReady ? ` <button class="text-link" data-update>Update now</button>` : ""}</p>
      <details class="install-note">
        <summary>Install on iPhone</summary>
        <p>Open this page in Safari, tap Share, choose Add to Home Screen, then open Dregg from the Home Screen. After the first load it works in Airplane Mode.</p>
      </details>
    </section>

    ${backupHtml(state, { compact: true })}

    <section class="module module--about">
      <div class="module-head"><h2>About</h2><span class="mono">v1.0 · ${escapeHtml(BUILD)}</span></div>
      <p class="muted">Gregg Anniversary shorthand, taught Core-first. Pronunciations from CMUdict; frequency tiers from a public word list. Stroke geometry follows the 1916 chart and the Anniversary manual.</p>
      <p class="muted">Some joins are simplified. The app labels approximations rather than presenting them as authoritative; see the outline notes in the repository.</p>
      <p class="muted">No account, no analytics, no network requests after install.</p>
      <button class="btn btn--ghost btn--small" data-force-update>Reload latest version</button>
    </section>`;

    for (const radio of root.querySelectorAll('input[name="track"]')) {
      radio.addEventListener("change", () => {
        store.setTrack(radio.value);
        render();
      });
    }
    for (const radio of root.querySelectorAll('input[name="theme"]')) {
      radio.addEventListener("change", () => store.setSettings({ theme: radio.value }));
    }
    for (const radio of root.querySelectorAll('input[name="modeMix"]')) {
      radio.addEventListener("change", () => store.setSettings({ modeMix: radio.value }));
    }
    for (const input of root.querySelectorAll('input[type="checkbox"][name="sound"], input[type="checkbox"][name="haptics"]')) {
      input.addEventListener("change", () => store.setSettings({ [input.name]: input.checked }));
    }
    root.querySelector('select[name="sessionLength"]')?.addEventListener("change", (event) => {
      store.setSettings({ sessionLength: Number(event.currentTarget.value) });
    });
    root.querySelector("[data-update]")?.addEventListener("click", () => {
      applyUpdate();
    });
    root.querySelector("[data-force-update]")?.addEventListener("click", () => {
      forceReload();
    });
    wireBackup(root, store);
  }

  render();
}
