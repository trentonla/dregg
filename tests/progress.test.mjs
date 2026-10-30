import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PROGRESS } from "../app/js/storage.js";
import { ensureProgress, masterySummary } from "../app/js/engine.js";
import { renderProgress } from "../app/js/ui/progress.js";

function fakeRoot() {
  return {
    innerHTML: "",
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

function render(track) {
  const progress = structuredClone(DEFAULT_PROGRESS);
  ensureProgress(progress, track);
  const state = {
    track,
    progress,
    storage: { available: true, persistent: true, lastSaved: null },
  };
  const store = {
    getState: () => state,
    mastery: () => masterySummary(progress, track),
    practiceUnit() {},
    exportBackup: () => "{}",
    importBackup: () => ({ units: 0, sessions: 0 }),
    resetProgress() {},
    toast() {},
  };
  const root = fakeRoot();
  renderProgress(root, store);
  return root.innerHTML;
}

test("progress stages list the curriculum in order and mark the current phase", () => {
  const html = render("core");
  assert.match(html, /Phase 1/);
  assert.match(html, /Foundations/);
  assert.match(html, /class="phase-row is-current"/);
  // Core skips the two Precision vowel phases.
  assert.doesNotMatch(html, /Precision I/);
  assert.doesNotMatch(html, /Precision II/);
  assert.match(html, /Phase 10/);
  assert.match(html, /Fluency/);
});

test("precision stages include the vowel-sign phases", () => {
  const html = render("precision");
  assert.match(html, /Precision I/);
  assert.match(html, /Precision II/);
});
