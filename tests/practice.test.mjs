import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PROGRESS } from "../app/js/storage.js";
import { createSession, ensureProgress } from "../app/js/engine.js";
import { renderPractice } from "../app/js/ui/practice.js";
import { UNIT_BY_ID } from "../app/js/units.js";

function fakeRoot() {
  return {
    innerHTML: "",
    options: [],
    set innerHTML(value) {
      this._html = value;
      this.options = [...value.matchAll(/data-option="([^"]+)"/g)].map((match) => {
        const button = { dataset: { option: match[1] }, handler: null };
        button.addEventListener = (type, handler) => {
          button.handler = handler;
        };
        return button;
      });
    },
    get innerHTML() {
      return this._html;
    },
    querySelector: () => null,
    querySelectorAll(selector) {
      return selector === "[data-option]" ? this.options : [];
    },
  };
}

function setup(seed = 11) {
  const progress = structuredClone(DEFAULT_PROGRESS);
  ensureProgress(progress, "core");
  const session = createSession({
    progress,
    track: "core",
    settings: { sessionLength: 12, modes: ["read", "write", "trace", "drill"] },
    seed,
  });
  const state = { session, settings: { sound: false }, progress, track: "core" };
  const store = {
    getState: () => state,
    currentItem: () => session.items[session.index],
    submitResult: () => {},
  };
  return { state, store };
}

test("the forgot-a-stroke panel lists only unlocked strokes and leaves the question alone", () => {
  const { state, store } = setup(11);
  const drillIndex = state.session.items.findIndex((item) => item.mode === "drill");
  state.session.index = drillIndex;
  const root = fakeRoot();
  renderPractice(root, store);
  const html = root.innerHTML;

  assert.match(html, /Forgot a stroke\?/);
  assert.match(html, /Which stroke is this\?/);
  assert.match(html, /glyph--drill/);
  assert.ok(html.indexOf("stroke-reference") < html.indexOf("glyph--drill"), "the panel sits above the question");
  assert.ok(!html.includes(UNIT_BY_ID.k.label), "locked K should not be in the panel");
  assert.ok(!html.includes("data-toggle-hide"));
  assert.ok(!html.includes("option-desc"), "options should not carry descriptions");
  const answer = state.session.items[drillIndex].drill.answer;
  assert.ok(!html.includes(UNIT_BY_ID[answer].description), "the answer description should not be visible before answering");
});

test("drill feedback names the stroke instead of the word", () => {
  const { state, store } = setup(23);
  const drillIndex = state.session.items.findIndex((item) => item.mode === "drill");
  state.session.index = drillIndex;
  const item = state.session.items[drillIndex];
  const root = fakeRoot();
  renderPractice(root, store);

  const wrong = root.options.find((option) => option.dataset.option !== item.drill.answer);
  assert.ok(wrong);
  wrong.handler();

  renderPractice(root, store);
  const html = root.innerHTML;
  assert.match(html, /feedback-word/);
  assert.ok(html.includes(UNIT_BY_ID[item.drill.answer].label));
  assert.ok(html.includes(`You chose ${UNIT_BY_ID[wrong.dataset.option].label}.`));
  assert.ok(!html.includes('class="phonemes"'));
});

test("opening practice with no session starts one quietly", () => {
  const progress = structuredClone(DEFAULT_PROGRESS);
  ensureProgress(progress, "core");
  const state = { session: null, settings: { sessionLength: 12, modes: ["read", "write", "trace", "drill"], sound: false }, progress, track: "core" };
  let ensured = 0;
  const store = {
    getState: () => state,
    ensureSession: () => {
      ensured += 1;
      state.session = createSession({
        progress,
        track: "core",
        settings: state.settings,
        seed: 5,
      });
      return state.session;
    },
    currentItem: () => state.session.items[state.session.index],
  };
  const root = fakeRoot();
  renderPractice(root, store);

  assert.equal(ensured, 1);
  assert.match(root.innerHTML, /class="practice/);
});

test("write mode keeps the model outline hidden until revealed", () => {
  const { state, store } = setup(37);
  const writeIndex = state.session.items.findIndex((item) => item.mode === "write");
  state.session.index = writeIndex;
  const root = fakeRoot();
  renderPractice(root, store);
  const html = root.innerHTML;
  assert.ok(!html.includes('data-reference'), "write mode should not render the model outline before writing");
  assert.match(html, /Write the outline on paper or below\./);
});
