// Progress: mastery grid, curriculum stages, recent volume, session history, backup.
import { activePhases } from "../curriculum.js";
import { isUnitUnlocked } from "../engine.js";
import { escapeHtml, pageHeader, percent, unitGlyph, unitLabel } from "./components.js";
import { backupHtml, wireBackup } from "./backup.js";

const view = { sort: "weak" };

// What each phase adds, in the order the app teaches it.
const STAGE_NOTES = {
  1: "Short/long pairs n–m and t–d, plus the plain a and e vowel circles.",
  2: "The k and g arches, the l and r curves, and the plain o hook.",
  3: "The s curve in its left and right join forms, h as a dot, and the plain u hook.",
  4: "p/b and f/v: short/long downward curves for the lip and teeth sounds.",
  5: "ch and j (short/long down-left strokes), plus sh and th.",
  6: "ng and nk strokes, and the w and y glides.",
  7: "ai, ow, oi and yu: two vowel sounds written as one stroke.",
  8: "Long-vowel signs (tick below) for a, e, o, u — ale, eat, old, food.",
  9: "Broad/short-vowel signs (dot below) — art, bet, all, book.",
  10: "Blends: two strokes written as one, such as ten/den, tem/dem, pent/gent.",
};

function stageList(state) {
  const phases = activePhases(state.track).map((phase) => {
    const unlocked = new Set(phase.units.filter((id) => isUnitUnlocked(state.progress, id, state.track)));
    return { ...phase, unlocked, complete: unlocked.size === phase.units.length };
  });
  const current = phases.find((phase) => !phase.complete)?.number ?? null;
  return `<ol class="phase-list">${phases
    .map((phase) => {
      const status = phase.complete ? "done" : phase.number === current ? "current" : "locked";
      return `<li class="phase-row is-${status}">
        <div class="phase-head">
          <span class="mono">Phase ${phase.number}</span>
          <h3>${escapeHtml(phase.name)}</h3>
          ${status === "current" ? `<span class="badge">Current</span>` : ""}
          ${status === "done" ? `<span class="badge badge--ok">Done</span>` : ""}
        </div>
        <p class="muted">${escapeHtml(STAGE_NOTES[phase.number] || "")}</p>
        <div class="chip-row">${phase.units
          .map(
            (id) =>
              `<span class="chip${phase.unlocked.has(id) ? "" : " is-locked"}">${escapeHtml(unitLabel(id))}</span>`,
          )
          .join("")}</div>
      </li>`;
    })
    .join("")}</ol>`;
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function lastDays(count) {
  const days = [];
  const today = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * 86400000);
    days.push({ key: date.toISOString().slice(0, 10) });
  }
  return days;
}

function sortedRows(rows) {
  const copy = [...rows];
  if (view.sort === "name") return copy.sort((a, b) => a.label.localeCompare(b.label));
  if (view.sort === "attempts") return copy.sort((a, b) => b.attempts - a.attempts);
  return copy.sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.mastery - b.mastery);
}

function volumeChart(sessions) {
  const days = lastDays(14);
  const byDay = new Map(days.map((day) => [day.key, { items: 0, correct: 0, sessions: 0 }]));
  for (const session of sessions) {
    const entry = byDay.get(dayKey(session.date));
    if (!entry) continue;
    entry.items += session.items;
    entry.correct += session.correct;
    entry.sessions += 1;
  }
  const max = Math.max(1, ...days.map((day) => byDay.get(day.key).items));
  return `<figure class="volume-figure">
    <svg class="volume-chart" viewBox="0 0 140 64" role="img" aria-label="Items practiced over the last 14 days">
      ${days
        .map((day, index) => {
          const entry = byDay.get(day.key);
          const height = Math.max(entry.items ? 2 : 0.5, Math.round((entry.items / max) * 56));
          return `<rect x="${index * 10 + 1}" y="${60 - height}" width="8" height="${height}" rx="1"><title>${escapeHtml(day.key)}: ${entry.items} items, ${entry.sessions} sessions</title></rect>`;
        })
        .join("")}
      <line x1="0" y1="60" x2="140" y2="60"></line>
    </svg>
    <figcaption class="muted">14 days ago to today</figcaption>
  </figure>`;
}

function historyList(sessions) {
  const recent = [...sessions].reverse().slice(0, 12);
  if (!recent.length) return `<p class="muted">No sessions yet.</p>`;
  return `<ul class="history-list">${recent
    .map(
      (session) => `<li>
        <span class="mono">${escapeHtml(dayKey(session.date))}</span>
        <span>${escapeHtml(session.track)}</span>
        <span>${session.correct}/${session.items}</span>
        <span class="mono">${percent(session.accuracy)}</span>
        ${session.unlocked ? `<span class="badge badge--ok">+${escapeHtml(session.unlocked)}</span>` : ""}
      </li>`,
    )
    .join("")}</ul>`;
}

export function renderProgress(root, store) {
  function render() {
    const state = store.getState();
    const mastery = store.mastery();
    const rows = sortedRows(mastery.rows);
    const sessions = state.progress.sessions || [];
    const totalItems = sessions.reduce((sum, session) => sum + session.items, 0);
    const totalCorrect = sessions.reduce((sum, session) => sum + session.correct, 0);

    root.innerHTML = `${pageHeader("Progress", `${mastery.mastered} mastered · ${mastery.unlocked} of ${mastery.total} unlocked.`, {
      eyebrow: state.track === "precision" ? "Precision track" : "Core track",
    })}
    <section class="module">
      <div class="module-head">
        <h2>Mastery</h2>
        <div class="segmented segmented--small" role="group" aria-label="Sort units">
          <label><input type="radio" name="sort" value="weak" ${view.sort === "weak" ? "checked" : ""}><span>Weakest</span></label>
          <label><input type="radio" name="sort" value="name" ${view.sort === "name" ? "checked" : ""}><span>Name</span></label>
          <label><input type="radio" name="sort" value="attempts" ${view.sort === "attempts" ? "checked" : ""}><span>Most seen</span></label>
        </div>
      </div>
      <p class="muted">One tile per stroke. The percentage is your recent accuracy and the count is how many times you have seen it. Tap a tile to drill that stroke. Locked tiles open as you master the strokes before them.</p>
      <div class="mastery-grid">${rows
        .map(
          (row) => `<button class="mastery-cell${row.unlocked ? "" : " is-locked"}" data-unit="${escapeHtml(row.id)}" aria-label="${escapeHtml(row.label)}: ${percent(row.mastery)} accuracy, seen ${row.attempts} times">
            ${unitGlyph(row.id, state.track, { className: "glyph glyph--small" })}
            <span class="mastery-name">${escapeHtml(row.label)}</span>
            <span class="mono mastery-stats"><span>${percent(row.mastery)}</span><span class="mastery-attempts">${row.attempts}×</span></span>
          </button>`,
        )
        .join("")}</div>
    </section>

    <section class="module">
      <div class="module-head"><h2>Stages</h2><span class="mono">${activePhases(state.track).length} phases</span></div>
      <p class="muted">Strokes unlock a phase at a time, in this order. A phase opens when the ones before it are mastered.${state.track === "core" ? " Core skips the two Precision vowel phases; switch tracks in Settings to see them." : ""}</p>
      ${stageList(state)}
    </section>

    <section class="module">
      <div class="module-head"><h2>Last 14 days</h2><span class="mono">${totalCorrect}/${totalItems} correct</span></div>
      <p class="muted">Items you practised each day, newest on the right. Taller means more practice, not better scores.</p>
      ${volumeChart(sessions)}
    </section>

    <section class="module">
      <div class="module-head"><h2>History</h2><span class="mono">${sessions.length} sessions</span></div>
      <p class="muted">Your last 12 sessions: date, track, correct answers, accuracy, and any new strokes unlocked.</p>
      ${historyList(sessions)}
    </section>

    ${backupHtml(state)}`;

    for (const radio of root.querySelectorAll('input[name="sort"]')) {
      radio.addEventListener("change", () => {
        view.sort = radio.value;
        render();
      });
    }
    for (const cell of root.querySelectorAll("[data-unit]")) {
      cell.addEventListener("click", () => store.practiceUnit(cell.dataset.unit));
    }
    wireBackup(root, store);
  }

  render();
}
