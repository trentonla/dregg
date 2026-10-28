// Word explorer: audited lexicon first, spelling heuristic second.
import { LEXICON_BY_WORD } from "../data/lexicon.js";
import { heuristicRecord } from "../phonemes.js";
import { UNIT_BY_ID, unitFor } from "../units.js";
import { isUnitUnlocked } from "../engine.js";
import { escapeHtml, pageHeader, unitChip, unitLabel, wordOutline } from "./components.js";

const view = { query: "", record: null, copied: false };

function resolve(word, track) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return null;
  const audited = LEXICON_BY_WORD[clean];
  if (audited) return { record: audited, verified: true };
  return { record: heuristicRecord(clean), verified: false };
}

function details(record, verified, state) {
  const units = state.track === "core" ? record.core : record.full;
  const known = units.filter((unit) => unitFor(unit));
  const unknown = units.filter((unit) => !unitFor(unit));
  const firstUnlocked = known.find((unit) => isUnitUnlocked(state.progress, unit, state.track));
  return `<section class="explorer-result">
    <div class="explorer-outline">${wordOutline(record, state.track, { label: `Outline for ${record.w}` })}</div>
    <div class="explorer-meta">
      <div class="module-head">
        <h2>${escapeHtml(record.w)}</h2>
        <span class="badge ${verified ? "badge--ok" : "badge--warn"}">${verified ? "Audited" : "Unverified"}</span>
      </div>
      ${record.arpabet?.length ? `<p class="phonemes">${escapeHtml(record.arpabet.join(" "))}</p>` : `<p class="muted">No dictionary pronunciation. Units come from spelling.</p>`}
      <div class="breakdown" aria-label="Stroke breakdown">${known.map((unit) => unitChip(unit, state.track)).join("")}</div>
      ${unknown.length ? `<p class="muted">Not modeled yet: ${unknown.map(escapeHtml).join(", ")}.</p>` : ""}
      ${state.track === "core" && (record.full || []).some((unit) => UNIT_BY_ID[unit]?.mark && UNIT_BY_ID[unit].mark !== "none") ? `<p class="muted">Core display: plain vowel shapes. Precision adds the dot and tick signs.</p>` : ""}
      ${verified ? "" : `<p class="muted">This outline is a spelling approximation. Check it against a manual before trusting it.</p>`}
      <div class="button-row">
        ${
          firstUnlocked
            ? `<button class="btn btn--secondary" data-practice="${escapeHtml(firstUnlocked)}">Practice ${escapeHtml(unitLabel(firstUnlocked))}</button>`
            : ""
        }
        <button class="btn btn--ghost" data-copy>${view.copied ? "Copied" : "Copy details"}</button>
      </div>
    </div>
  </section>`;
}

export function renderExplorer(root, store) {
  function render() {
    const state = store.getState();
    const recent = [...(state.progress.recentWords || [])].reverse().slice(0, 8);
    const resolved = view.record ? resolve(view.record.w, state.track) : null;

    root.innerHTML = `${pageHeader("Explorer", "Look up a word, or check a spelling the lexicon does not cover.")}
      <form class="explorer-form" data-form>
        <label class="sr-only" for="explorer-input">Word</label>
        <input id="explorer-input" class="read-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type a word" value="${escapeHtml(view.query)}">
        <button class="btn btn--primary" type="submit">Look up</button>
      </form>
      ${recent.length ? `<div class="recent-words"><span class="eyebrow">Recent</span>${recent.map((word) => `<button class="chip chip--button" data-recent="${escapeHtml(word)}">${escapeHtml(word)}</button>`).join("")}</div>` : ""}
      ${resolved ? details(resolved.record, resolved.verified, state) : `<div class="empty"><h2>No word yet.</h2><p>Try one you have practiced, or any English word.</p></div>`}`;

    const input = root.querySelector("#explorer-input");
    root.querySelector("[data-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) return;
      view.query = query;
      view.record = resolve(query, store.getState().track).record;
      view.copied = false;
      render();
    });
    for (const button of root.querySelectorAll("[data-recent]")) {
      button.addEventListener("click", () => {
        view.query = button.dataset.recent;
        view.record = resolve(view.query, store.getState().track).record;
        view.copied = false;
        render();
      });
    }
    root.querySelector("[data-practice]")?.addEventListener("click", (event) => {
      store.practiceUnit(event.currentTarget.dataset.practice);
    });
    root.querySelector("[data-copy]")?.addEventListener("click", async () => {
      const record = resolved?.record;
      if (!record) return;
      const text = `${record.w} | ${(record.arpabet || []).join(" ")} | ${record.core.join(" ")} | ${record.full.join(" ")}`;
      try {
        await navigator.clipboard.writeText(text);
        view.copied = true;
        render();
      } catch {
        store.toast("Could not copy on this browser.");
      }
    });
  }

  render();
}
