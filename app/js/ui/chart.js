// Chart: the whole inventory, grouped the way the chart groups it.
import { CONSONANTS, DIPHTHONGS, GLIDES, BLENDS, VOWELS, UNIT_BY_ID } from "../units.js";
import { phaseOfUnit } from "../curriculum.js";
import { availableBriefs, isUnitUnlocked, trackUnits } from "../engine.js";
import { BRIEF_FORMS, briefById, outlineForBrief } from "../briefs.js";
import { UNIT_FRAME, outlineSvg, referenceViewBox } from "../outline.js";
import { escapeHtml, pageHeader, unitGlyph, unitLabel } from "./components.js";

const FAMILY_TITLES = {
  a: "A — ah / ay",
  e: "E — eh / ee",
  o: "O — aw / oh",
  u: "U — oo / uh",
};

function unitCard(id, state, selected) {
  const unlocked = isUnitUnlocked(state.progress, id, state.track) && trackUnits(state.track).includes(id);
  return `<button class="chart-unit${unlocked ? "" : " is-locked"}${selected === id ? " is-selected" : ""}" data-unit="${escapeHtml(id)}" aria-pressed="${selected === id}">
    ${unitGlyph(id, "precision", { className: "glyph chart-glyph" })}
    <span class="chart-name">${escapeHtml(unitLabel(id))}</span>
    ${unlocked ? "" : `<span class="lock-dot" aria-label="Locked">·</span>`}
  </button>`;
}

function group(title, ids, state, selected) {
  return `<section class="chart-group">
    <h2>${escapeHtml(title)}</h2>
    <div class="chart-grid">${ids.map((id) => unitCard(id, state, selected)).join("")}</div>
  </section>`;
}

function briefGlyph(brief, state, className = "glyph chart-glyph") {
  const outline = outlineForBrief(brief, state.track);
  return outlineSvg(outline, {
    className,
    label: brief.words[0],
    viewBox: referenceViewBox(outline, UNIT_FRAME),
  });
}

function briefCard(brief, state, selected, unlocked) {
  const isSelected = selected === brief.id;
  return `<button class="chart-unit${unlocked ? "" : " is-locked"}${isSelected ? " is-selected" : ""}" data-brief="${escapeHtml(brief.id)}" aria-pressed="${isSelected}">
    ${briefGlyph(brief, state)}
    <span class="chart-name">${escapeHtml(brief.words[0])}</span>
    ${unlocked ? "" : `<span class="lock-dot" aria-label="Locked">·</span>`}
  </button>`;
}

function briefSection(state, selected) {
  const available = new Set(availableBriefs(state.progress, state.track).map((brief) => brief.id));
  return `<section class="chart-group">
    <h2>Brief forms</h2>
    <p class="muted">Memorized whole-word abbreviations, not built from sounds. They unlock with the strokes they use.</p>
    <div class="chart-grid">${BRIEF_FORMS.map((brief) => briefCard(brief, state, selected, available.has(brief.id))).join("")}</div>
    ${available.size ? `<button class="btn btn--secondary" data-brief-drill>Drill brief forms</button>` : ""}
  </section>`;
}

function briefDetail(brief, state) {
  const unlocked = availableBriefs(state.progress, state.track).some((entry) => entry.id === brief.id);
  return `<aside class="chart-detail" role="dialog" aria-label="${escapeHtml(brief.words[0])}" aria-live="polite">
    <button class="chart-close" data-close aria-label="Close">×</button>
    <div class="chart-detail-head">
      <div class="chart-detail-glyph">${briefGlyph(brief, state, "glyph glyph--hero")}</div>
      <div>
        <p class="eyebrow">brief form</p>
        <h2>${escapeHtml(brief.words.join(" / "))}</h2>
        <p class="muted">${escapeHtml(brief.hint)}</p>
      </div>
    </div>
    <p class="muted">${unlocked ? "Unlocked." : "Locked. Unlocks with the strokes it uses."}</p>
    ${unlocked ? `<button class="btn btn--secondary" data-brief-drill>Drill brief forms</button>` : ""}
  </aside>`;
}

function detail(id, state) {
  const brief = briefById(id);
  if (brief) return briefDetail(brief, state);
  const unit = UNIT_BY_ID[id];
  if (!unit) return "";
  const unlocked = isUnitUnlocked(state.progress, id, state.track);
  const inTrack = trackUnits(state.track).includes(id);
  const phase = phaseOfUnit(id, state.track) ?? unit.phase;
  const phaseNote =
    state.track === "core" && !inTrack
      ? `Locked. Precision track, phase ${phase}.`
      : unlocked
        ? "Unlocked."
        : `Locked. Introduced in phase ${phase}.`;
  return `<aside class="chart-detail" role="dialog" aria-label="${escapeHtml(unit.label)}" aria-live="polite">
    <button class="chart-close" data-close aria-label="Close">×</button>
    <div class="chart-detail-head">
      <div class="chart-detail-glyph">${unitGlyph(id, "precision", { className: "glyph glyph--hero", frame: [0, 0] })}</div>
      <div>
        <p class="eyebrow">${escapeHtml(unit.kind)}${unit.family ? ` · family ${unit.family.toUpperCase()}` : ""}</p>
        <h2>${escapeHtml(unit.label)}</h2>
        <p class="muted">${escapeHtml(unit.description || "")}</p>
      </div>
    </div>
    ${unit.examples?.length ? `<p class="muted">Examples: ${unit.examples.map(escapeHtml).join(", ")}</p>` : ""}
    <p class="muted">${phaseNote}</p>
    ${
      unlocked && inTrack
        ? `<button class="btn btn--secondary" data-practice="${escapeHtml(id)}">Practice this stroke</button>`
        : ""
    }
  </aside>`;
}

export function renderChart(root, store) {
  let selected = null;
  const state = store.getState();
  const trackIds = new Set(trackUnits(state.track));

  function render() {
    const current = store.getState();
    const vowels = ["a", "e", "o", "u"].map((family) => {
      const ids = VOWELS.filter((unit) => unit.family === family).map((unit) => unit.id);
      return group(FAMILY_TITLES[family], ids, current, selected);
    });
    const byDirection = (direction) =>
      CONSONANTS.filter((unit) => (unit.direction || "none") === direction).map((unit) => unit.id);
    const locked = [...trackIds].filter((id) => !isUnitUnlocked(current.progress, id, current.track)).length;

    root.innerHTML = `${pageHeader("Chart", "Every stroke in the system. Locked strokes are visible, not hidden.", {
      eyebrow: current.track === "precision" ? "Precision track" : "Core track",
    })}
    <div class="chart-layout">
      <div class="chart-body">
        ${vowels.join("")}
        ${group("Downward curves", byDirection("downward"), current, selected)}
        ${group("Forward strokes", byDirection("forward"), current, selected)}
        ${group("Other consonants", byDirection("none"), current, selected)}
        ${group("Diphthongs", DIPHTHONGS.map((unit) => unit.id), current, selected)}
        ${group("Glides", GLIDES.map((unit) => unit.id), current, selected)}
        ${group("Blends", BLENDS.map((unit) => unit.id), current, selected)}
        ${briefSection(current, selected)}
        <p class="muted">${locked} stroke${locked === 1 ? "" : "s"} still locked in this track.</p>
      </div>
      <div class="chart-side${selected ? " is-open" : ""}">${selected ? detail(selected, current) : `<p class="muted chart-hint">Tap a stroke to see its name, sound, and phase.</p>`}</div>
    </div>`;

    for (const button of root.querySelectorAll("[data-unit]")) {
      button.addEventListener("click", () => {
        selected = button.dataset.unit === selected ? null : button.dataset.unit;
        render();
      });
    }
    root.querySelector("[data-practice]")?.addEventListener("click", (event) => {
      store.practiceUnit(event.currentTarget.dataset.practice);
    });
    for (const button of root.querySelectorAll("[data-brief]")) {
      button.addEventListener("click", () => {
        selected = button.dataset.brief === selected ? null : button.dataset.brief;
        render();
      });
    }
    root.querySelectorAll("[data-brief-drill]").forEach((button) => {
      button.addEventListener("click", () => store.startBriefSession());
    });
    const close = () => {
      selected = null;
      render();
    };
    root.querySelector("[data-close]")?.addEventListener("click", close);
    const side = root.querySelector(".chart-side");
    side?.addEventListener("click", (event) => {
      if (event.target === side) close();
    });
  }

  render();
}
