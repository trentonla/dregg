// Today: one primary action, a thin mastery line, weak spots, and a streak.
import { escapeHtml, modeLabel, pageHeader, percent, progressBar, ring, unitGlyph, unitLabel } from "./components.js";
import { availableBriefs } from "../engine.js";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function renderToday(root, store) {
  const state = store.getState();
  const mastery = store.mastery();
  const weak = store.weakest(3);
  const next = store.nextUnit();
  const unlock = store.unlockReady();
  const sessionsToday = state.progress.sessions.filter((session) => String(session.date).slice(0, 10) === todayKey()).length;
  const streak = state.progress.streak || { current: 0, best: 0 };
  const resume = Boolean(state.session && !state.session.finished && state.session.results.length);
  const briefs = availableBriefs(state.progress, state.track);

  const status = unlock
    ? `${unitLabel(unlock)} is ready to unlock.`
    : next
      ? `${percent(mastery.average)} average mastery. ${unitLabel(next)} is next.`
      : "Every stroke in this track is unlocked.";

  root.innerHTML = `${pageHeader("Today", status, { eyebrow: state.track === "precision" ? "Precision track" : "Core track" })}
    <section class="today-grid">
      <div class="today-primary">
        <div class="mastery-line">
          ${ring(mastery.average, { label: "Average mastery", size: 52 })}
          <div>
            <p class="stat-line"><strong>${mastery.mastered}</strong> of ${mastery.total} units mastered</p>
            ${progressBar(mastery.unlocked, mastery.total, "Units unlocked")}
            <p class="muted">${mastery.unlocked} unlocked</p>
          </div>
        </div>
        <button class="btn btn--primary btn--wide" data-start>${resume ? "Resume session" : "Start a session"}</button>
        <button class="btn btn--secondary btn--wide" data-zen>Zen practice · no limit</button>
        <p class="muted">${state.settings.sessionLength} items · ${state.settings.modes.map(modeLabel).join(", ")}</p>
      </div>

      <div class="today-side">
        <section class="module">
          <div class="module-head"><h2>Streak</h2><span class="mono">${streak.current} days</span></div>
          <p class="muted">Best: ${streak.best}. Goal: ${state.settings.dailyGoal} min.</p>
          <p class="muted">${sessionsToday ? `${sessionsToday} session${sessionsToday === 1 ? "" : "s"} today.` : "No session yet today."}</p>
        </section>

        ${
          briefs.length
            ? `<section class="module">
          <div class="module-head"><h2>Brief forms</h2><span class="mono">${briefs.length} ready</span></div>
          <p class="muted">${briefs.map((brief) => escapeHtml(brief.words[0])).join(", ")}</p>
          <button class="btn btn--secondary btn--wide" data-briefs>Drill brief forms</button>
        </section>`
            : ""
        }

        <section class="module">
          <div class="module-head"><h2>Weak spots</h2><a class="text-link" href="#/chart">Chart</a></div>
          ${
            weak.length
              ? `<ul class="weak-list">${weak
                  .map(
                    (unit) => `<li>
                      <button class="weak-row" data-unit="${escapeHtml(unit.id)}">
                        <span class="weak-glyph">${unitGlyph(unit.id, state.track, { className: "glyph glyph--small" })}</span>
                        <span class="weak-name">${escapeHtml(unit.label)}</span>
                        <span class="weak-bar">${progressBar(unit.mastery, 1, `${unit.label} mastery`)}</span>
                        <span class="mono weak-count">${unit.attempts}</span>
                      </button>
                    </li>`,
                  )
                  .join("")}</ul>`
              : `<p class="muted">Practice a session to find your weak strokes.</p>`
          }
        </section>

        ${
          unlock
            ? `<section class="module module--new"><div class="module-head"><h2>New stroke ready</h2></div><p>${escapeHtml(unitLabel(unlock))} can unlock after a strong session.</p></section>`
            : ""
        }
      </div>
    </section>`;

  root.querySelector("[data-start]").addEventListener("click", () => {
    if (!store.resumeSession()) store.startSession();
  });
  root.querySelector("[data-zen]")?.addEventListener("click", () => store.startSession({ zen: true }));
  for (const button of root.querySelectorAll("[data-unit]")) {
    button.addEventListener("click", () => store.practiceUnit(button.dataset.unit));
  }
  root.querySelector("[data-briefs]")?.addEventListener("click", () => store.startBriefSession());
}
