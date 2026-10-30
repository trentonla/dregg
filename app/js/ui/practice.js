// Focused practice route. Read, write, trace, and drill share one session shell.
import { UNIT_BY_ID } from "../units.js";
import { LEXICON } from "../data/lexicon.js";
import { UNIT_VIEWBOX, outlineForWord, outlineSvg, referenceViewBox } from "../outline.js";
import { gradeDrill, gradeRead, traceScore, READ_ANSWER_OVERRIDES } from "../grader.js";
import { isUnitUnlocked, recommendation, trackUnits } from "../engine.js";
import { mountCanvas } from "../draw/canvas.js";
import { animateOutline } from "../draw/animate.js";
import { scoreTrace, traceGhost } from "../draw/trace.js";
import {
  breakdown,
  escapeHtml,
  modeLabel,
  percent,
  phonemes,
  progressBar,
  unitChip,
  unitGlyph,
  unitLabel,
} from "./components.js";

const view = {
  key: null,
  feedback: null,
  revealed: false,
  input: "",
  strokes: [],
  draw: null,
};

function resetFor(session, item) {
  const key = `${session.id}:${item.id}`;
  if (view.key === key) return;
  view.key = key;
  view.feedback = null;
  view.revealed = false;
  view.input = "";
  view.strokes = [];
  view.draw = null;
}

function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function noteFor(item, outline) {
  if (item.mode === "drill") return UNIT_BY_ID[item.drill?.answer]?.description || "";
  const units = (item.units || []).map(unitLabel).join(" · ");
  const contraction = outline.contractions?.map((entry) => entry.note).filter(Boolean).join(" ");
  const placement =
    outline.placements?.find((entry) => entry.note && entry.rule !== "on-straight")?.note ||
    outline.placements?.[0]?.note ||
    "";
  return [units, contraction || placement].filter(Boolean).join(". ");
}

function promptHtml(item, outline, sound, blends) {
  if (item.mode === "read") {
    return `<div class="stage stage--read">
      <div class="outline-stage">${outlineSvg(outlineForWord(item.word, item.track, { blends }), { className: "outline outline--large", label: "Outline to read", viewBox: referenceViewBox(outline) })}</div>
      <p class="muted">Type the word this outline spells.</p>
    </div>`;
  }
  if (item.mode === "write") {
    return `<div class="stage">
      <p class="word-display">${escapeHtml(item.word.w)}</p>
      ${phonemes(item.word)}
      ${sound ? `<button class="btn btn--ghost btn--small" data-speak>Hear it</button>` : ""}
      <p class="muted">Write the outline on paper or below.</p>
      ${view.revealed ? `<div class="reference-outline" data-reference>${outlineSvg(outlineForWord(item.word, item.track, { blends }), { className: "outline outline--large", label: "Reference outline", viewBox: referenceViewBox(outline) })}</div>` : ""}
    </div>`;
  }
  if (item.mode === "trace") {
    return `<div class="stage">
      <p class="word-display">${escapeHtml(item.word.w)}</p>
      ${phonemes(item.word)}
      <div class="canvas-wrap canvas-wrap--trace">
        ${traceGhost(outline)}
        <div class="canvas-host"></div>
      </div>
      <p class="muted">Trace the dashed outline in one continuous movement where you can.</p>
    </div>`;
  }
  if (item.mode === "drill") {
    return `<div class="stage stage--drill">
      <div class="outline-stage">${unitGlyph(item.drill?.answer, item.track, { className: "glyph glyph--drill", viewBox: UNIT_VIEWBOX })}</div>
      <p class="muted">Which stroke is this?</p>
    </div>`;
  }
  return "";
}

function answerHtml(item) {
  if (item.mode === "read") {
    return `<form class="answer answer--read" data-read-form>
      <label class="sr-only" for="read-answer">Your answer</label>
      <input id="read-answer" class="read-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="Type the word" value="${escapeHtml(view.input)}">
      <button class="btn btn--primary" type="submit">Check</button>
    </form>`;
  }
  if (item.mode === "write") {
    return `<div class="answer">
      <div class="canvas-wrap">
        <div class="canvas-host"></div>
      </div>
      <div class="canvas-tools">
        <button class="btn btn--ghost" data-undo>Undo</button>
        <button class="btn btn--ghost" data-clear>Clear</button>
        ${
          view.revealed
            ? `<button class="btn btn--ghost" data-show>Show me</button>`
            : `<button class="btn btn--secondary" data-reveal>Reveal outline</button>`
        }
      </div>
      ${
        view.revealed
          ? `<div class="self-grade"><p class="muted">Compare your outline with the model.</p><div class="button-row"><button class="btn btn--primary" data-grade="yes">I wrote it</button><button class="btn btn--secondary" data-grade="no">Not yet</button></div></div>`
          : `<p class="muted">Draw the whole outline, then reveal to compare.</p>`
      }
    </div>`;
  }
  if (item.mode === "trace") {
    return `<div class="answer">
      <div class="canvas-tools">
        <button class="btn btn--ghost" data-undo>Undo</button>
        <button class="btn btn--ghost" data-clear>Clear</button>
        <button class="btn btn--ghost" data-show>Show me</button>
        <button class="btn btn--primary" data-check ${view.strokes.length ? "" : "disabled"}>Check trace</button>
      </div>
    </div>`;
  }
  if (item.mode === "drill") {
    return `<div class="answer answer--drill"><div class="option-grid">${(item.drill?.options || [])
      .map(
        (option) =>
          `<button class="option" data-option="${escapeHtml(option.id)}"><span class="option-label">${escapeHtml(option.label)}</span></button>`,
      )
      .join("")}</div></div>`;
  }
  return "";
}

function strokeReferenceHtml(state) {
  const units = trackUnits(state.track).filter((id) => isUnitUnlocked(state.progress, id, state.track));
  if (!units.length) return "";
  return `<details class="stroke-reference">
    <summary>Forgot a stroke?</summary>
    <div class="stroke-reference-body">
      <p class="muted">Every stroke you have unlocked so far. The question stays as it is.</p>
      <div class="chip-row">${units.map((id) => unitChip(id, state.track)).join("")}</div>
    </div>
  </details>`;
}

function feedbackHtml(item, outline, total, blends) {
  const feedback = view.feedback;
  const correct = Boolean(feedback?.correct);
  if (item.mode === "drill") {
    const answerId = item.drill?.answer;
    const answerUnit = UNIT_BY_ID[answerId];
    const chosenUnit = UNIT_BY_ID[feedback?.answer];
    return `<div class="feedback ${correct ? "feedback--correct" : "feedback--wrong"}" role="status" aria-live="polite">
      <p class="feedback-title">${correct ? "Correct." : "Not quite."}</p>
      <div class="drill-result">
        <div class="outline-stage">${unitGlyph(answerId, item.track, { className: "glyph glyph--drill", viewBox: UNIT_VIEWBOX })}</div>
        <div>
          <p class="feedback-word">${escapeHtml(answerUnit?.label || answerId)}</p>
          <p class="feedback-note">${escapeHtml(answerUnit?.description || "")}</p>
        </div>
      </div>
      ${!correct && chosenUnit ? `<p class="muted">You chose ${escapeHtml(chosenUnit.label)}.</p>` : ""}
      <button class="btn btn--primary btn--wide" data-next>${item.index >= total - 1 ? "Finish" : "Next"}</button>
    </div>`;
  }
  const accepted = feedback?.accepted?.filter((word) => word !== item.word.w) || [];
  return `<div class="feedback ${correct ? "feedback--correct" : "feedback--wrong"}" role="status" aria-live="polite">
    <p class="feedback-title">${correct ? "Correct." : "Not quite."}</p>
    <p class="feedback-word">${escapeHtml(item.word.w)}</p>
    ${phonemes(item.word)}
    <div class="feedback-outline">${outlineSvg(outlineForWord(item.word, item.track, { blends }), { className: "outline outline--large", label: item.word.w, viewBox: referenceViewBox(outline) })}</div>
    ${breakdown(item.units, item.track)}
    <p class="feedback-note">${escapeHtml(noteFor(item, outline))}</p>
    ${
      feedback?.score !== undefined && feedback?.score !== null
        ? `<p class="mono">Trace match: ${percent(feedback.score)}</p>`
        : ""
    }
    ${
      feedback?.issues?.length
        ? `<ul class="issue-list">${feedback.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`
        : ""
    }
    ${!correct && accepted.length ? `<p class="muted">Also accepted: ${accepted.map(escapeHtml).join(", ")}</p>` : ""}
    ${!correct && !accepted.length ? `<p class="muted">The answer is ${escapeHtml(item.word.w)}.</p>` : ""}
    ${
      item.mode === "read"
        ? `<div class="button-row">
            <button class="btn btn--secondary" data-override-correct>Mark as correct</button>
            <button class="btn btn--ghost" data-override-wrong>Mark as wrong</button>
          </div>`
        : ""
    }
    ${
      item.mode === "trace" && !correct
        ? `<button class="btn btn--secondary" data-retry>Try again (this attempt counted)</button>`
        : ""
    }
    <button class="btn btn--primary btn--wide" data-next>${item.index >= total - 1 ? "Finish" : "Next"}</button>
  </div>`;
}

function summaryHtml(summary, state) {
  const unlocked = summary.unlocked ? UNIT_BY_ID[summary.unlocked] : null;
  return `<section class="practice practice--summary">
    <header class="page-head">
      <p class="eyebrow">${summary.track === "precision" ? "Precision" : "Core"} session</p>
      <h1>Session complete.</h1>
      <p class="lead">${escapeHtml(recommendation(summary, state.progress, summary.track))}</p>
    </header>
    <div class="summary-grid">
      <div class="summary-stat"><span class="summary-value">${percent(summary.accuracy)}</span><span class="muted">Accuracy</span></div>
      <div class="summary-stat"><span class="summary-value">${summary.correct}/${summary.items}</span><span class="muted">Correct</span></div>
      <div class="summary-stat"><span class="summary-value">${formatDuration(summary.durationMs)}</span><span class="muted">Time</span></div>
    </div>
    ${unlocked ? `<div class="module module--new"><h2>New stroke: ${escapeHtml(unlocked.label)}</h2><p>${escapeHtml(unlocked.description)}</p><div class="chip-row">${unitGlyph(unlocked.id, summary.track)}</div></div>` : ""}
    <div class="button-row">
      <button class="btn btn--primary" data-done>Done</button>
      <button class="btn btn--secondary" data-again>Practice again</button>
    </div>
  </section>`;
}

export function renderPractice(root, store) {
  const state = store.getState();
  const session = state.session;
  if (!session || !session.items.length) {
    root.innerHTML = `<section class="practice"><div class="empty"><h2>No session yet.</h2><p>Start a short session from Today.</p><a class="btn btn--primary" href="#/today">Go to Today</a></div></section>`;
    return;
  }
  if (session.finished && session.summary) {
    root.innerHTML = summaryHtml(session.summary, state);
    root.querySelector("[data-done]")?.addEventListener("click", () => store.navigate("today"));
    root.querySelector("[data-again]")?.addEventListener("click", () => store.startSession());
    return;
  }

  const item = store.currentItem();
  if (!item) {
    root.innerHTML = `<section class="practice"><div class="empty"><h2>This session is done.</h2><p>Start another when you are ready.</p><a class="btn btn--primary" href="#/today">Go to Today</a></div></section>`;
    return;
  }

  view.draw?.destroy();
  view.draw = null;
  resetFor(session, item);
  const blends = new Set(session.blends || []);
  const outline = outlineForWord(item.word, item.track, { blends });
  const answered = Boolean(view.feedback);

  root.innerHTML = `<section class="practice">
    <div class="practice-top">
      <button class="btn btn--ghost" data-exit>Exit</button>
      <span class="practice-meta mono">${modeLabel(item.mode)} · ${session.index + 1} / ${session.items.length}</span>
      ${progressBar(session.results.length, session.items.length, "Session progress")}
    </div>
    ${promptHtml(item, outline, state.settings.sound, blends)}
    ${answered ? feedbackHtml(item, outline, session.items.length, blends) : answerHtml(item)}
    ${!answered ? strokeReferenceHtml(state) : ""}
    <div class="practice-bottom">
      ${!answered ? `<button class="btn btn--ghost" data-giveup>Give up</button>` : ""}
    </div>
  </section>`;

  const host = root.querySelector(".canvas-host");
  if (host) {
    view.draw = mountCanvas(host, {
      initialStrokes: view.strokes,
      label: item.mode === "trace" ? "Trace the outline" : "Write the outline",
      onChange: (strokes) => {
        view.strokes = strokes;
        const check = root.querySelector("[data-check]");
        if (check) check.disabled = strokes.length === 0;
      },
    });
  }

  const input = root.querySelector("#read-answer");
  if (input && !answered && typeof matchMedia !== "undefined" && matchMedia("(pointer: fine)").matches) {
    requestAnimationFrame(() => input.focus());
  }

  const submit = (feedback, result) => {
    view.feedback = feedback;
    store.submitResult(result);
  };

  root.querySelector("[data-exit]")?.addEventListener("click", () => store.exitSession());
  root.querySelector("[data-speak]")?.addEventListener("click", () => store.audio.speak(item.word.w));
  root.querySelector("[data-giveup]")?.addEventListener("click", () => {
    if (item.mode === "drill") {
      const answer = item.drill?.answer || "";
      submit(
        { correct: false, expected: answer, answer: "", note: noteFor(item, outline) },
        { correct: false, answer: "" },
      );
      return;
    }
    submit(
      { correct: false, expected: item.word.w, note: noteFor(item, outline) },
      { correct: false, answer: "" },
    );
  });
  root.querySelector("[data-next]")?.addEventListener("click", () => store.next());
  root.querySelector("[data-retry]")?.addEventListener("click", () => {
    view.feedback = null;
    view.strokes = [];
    renderPractice(root, store);
  });

  const overrideMark = (correct) => {
    store.overrideResult(correct);
    view.feedback = { ...view.feedback, correct };
    renderPractice(root, store);
  };
  root.querySelector("[data-override-correct]")?.addEventListener("click", () => overrideMark(true));
  root.querySelector("[data-override-wrong]")?.addEventListener("click", () => overrideMark(false));

  root.querySelector("[data-read-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input?.value || "";
    if (!value.trim()) return;
    view.input = value;
    const result = gradeRead(value, item, LEXICON, READ_ANSWER_OVERRIDES);
    submit(
      { ...result, note: noteFor(item, outline) },
      { correct: result.correct, answer: value },
    );
  });
  if (input) {
    input.addEventListener("input", () => {
      view.input = input.value;
    });
  }

  for (const button of root.querySelectorAll("[data-option]")) {
    button.addEventListener("click", () => {
      const result = gradeDrill(button.dataset.option, item);
      submit(
        { ...result, answer: button.dataset.option, note: noteFor(item, outline) },
        { correct: result.correct, answer: button.dataset.option },
      );
    });
  }

  root.querySelector("[data-reveal]")?.addEventListener("click", () => {
    view.revealed = true;
    renderPractice(root, store);
  });
  root.querySelector("[data-show]")?.addEventListener("click", () => {
    view.revealed = true;
    renderPractice(root, store);
    requestAnimationFrame(() => {
      const svg = root.querySelector("[data-reference] svg, .trace-ghost");
      if (svg) animateOutline(svg);
    });
  });
  for (const button of root.querySelectorAll("[data-grade]")) {
    button.addEventListener("click", () => {
      const correct = button.dataset.grade === "yes";
      submit(
        { correct, expected: item.word.w, note: noteFor(item, outline) },
        { correct, answer: correct ? item.word.w : "" },
      );
    });
  }

  root.querySelector("[data-undo]")?.addEventListener("click", () => {
    view.draw?.undo();
    const check = root.querySelector("[data-check]");
    if (check) check.disabled = view.strokes.length === 0;
  });
  root.querySelector("[data-clear]")?.addEventListener("click", () => {
    view.draw?.clear();
    const check = root.querySelector("[data-check]");
    if (check) check.disabled = true;
  });
  root.querySelector("[data-check]")?.addEventListener("click", () => {
    const result = scoreTrace(outline, view.strokes);
    submit(
      {
        correct: result.passed,
        expected: item.word.w,
        score: result.score,
        issues: result.issues,
        note: noteFor(item, outline),
      },
      { correct: result.passed, score: result.score, answer: "" },
    );
  });
}
