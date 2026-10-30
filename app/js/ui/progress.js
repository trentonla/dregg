// Progress: mastery grid, recent volume, session history, backup.
import { escapeHtml, pageHeader, percent, progressBar, unitGlyph } from "./components.js";
import { backupHtml, wireBackup } from "./backup.js";

const view = { sort: "weak" };

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
      <p class="muted">One tile per stroke. The bar is mastery from your recent accuracy; the number is how many times you have seen it. Tap a tile to drill that stroke. Locked tiles open as you master the strokes before them.</p>
      <div class="mastery-grid">${rows
        .map(
          (row) => `<button class="mastery-cell${row.unlocked ? "" : " is-locked"}" data-unit="${escapeHtml(row.id)}" aria-label="${escapeHtml(row.label)}: ${percent(row.mastery)} mastery">
            ${unitGlyph(row.id, state.track, { className: "glyph glyph--small" })}
            <span class="mastery-name">${escapeHtml(row.label)}</span>
            ${progressBar(row.mastery, 1, `${row.label} mastery`)}
            <span class="mono mastery-attempts">${row.attempts}</span>
          </button>`,
        )
        .join("")}</div>
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
