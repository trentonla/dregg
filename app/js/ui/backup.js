// Backup controls shared by Progress and Settings.
import { escapeHtml } from "./components.js";

export function backupHtml(state, { compact = false } = {}) {
  const storage = state.storage;
  return `<section class="module${compact ? " module--compact" : ""}">
    <div class="module-head"><h2>Backup</h2><span class="mono">${storage.available ? "Local" : "Unavailable"}</span></div>
    <p class="muted">${storage.lastSaved ? `Last saved ${escapeHtml(storage.lastSaved.slice(0, 16).replace("T", " "))}.` : "Nothing saved yet."} There is no cloud copy.</p>
    <div class="button-row">
      <button class="btn btn--secondary" data-export>Export backup</button>
      <button class="btn btn--secondary" data-import>Import backup</button>
      <button class="btn btn--ghost" data-reset="track">Reset track</button>
      <button class="btn btn--ghost" data-reset="all">Reset everything</button>
    </div>
    <input type="file" accept="application/json,.json" data-file hidden>
  </section>`;
}

function download(text, name) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function wireBackup(root, store) {
  root.querySelector("[data-export]")?.addEventListener("click", async () => {
    const text = store.exportBackup();
    const name = `dregg-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([text], name, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Dregg backup" });
        return;
      } catch {
        // Fall through to a download when the share sheet is dismissed or unavailable.
      }
    }
    download(text, name);
    store.toast("Backup exported.");
  });

  const fileInput = root.querySelector("[data-file]");
  root.querySelector("[data-import]")?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const units = payload?.progress?.units ? Object.keys(payload.progress.units).length : 0;
      const sessions = payload?.progress?.sessions?.length || 0;
      if (!confirm(`Replace this device's progress with ${units} units and ${sessions} sessions?`)) return;
      const summary = store.importBackup(text);
      store.toast(`Imported ${summary.units} units, ${summary.sessions} sessions.`);
    } catch (error) {
      store.toast(error?.message || "That file could not be imported.");
    } finally {
      fileInput.value = "";
    }
  });

  for (const button of root.querySelectorAll("[data-reset]")) {
    button.addEventListener("click", () => {
      const scope = button.dataset.reset;
      const label = scope === "all" ? "everything, including both tracks" : `the ${store.getState().track} track`;
      if (!confirm(`This permanently deletes ${label} on this device. Continue?`)) return;
      store.resetProgress(scope);
      store.toast("Progress reset.");
    });
  }
}
