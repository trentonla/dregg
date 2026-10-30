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

test("progress stages start at phase 1 and show precision-only phases as skipped", () => {
  const html = render("core");
  assert.match(html, /Phase 1/);
  assert.match(html, /Foundations/);
  assert.match(html, /class="phase-row is-current"/);
  // Unlocking a phase's strokes is not mastery: phase 1 stays current.
  assert.match(html, /Phase 1<\/span>\s*<h3>Foundations<\/h3>\s*<span class="badge">Current/);
  // The precision vowel phases are listed but skipped in core.
  assert.match(html, /Precision I/);
  assert.match(html, /Precision II/);
  assert.match(html, /class="phase-row is-skipped"/);
  assert.match(html, /Phase 10/);
  assert.match(html, /Fluency/);
});

test("precision stages include the vowel-sign phases", () => {
  const html = render("precision");
  assert.match(html, /Precision I/);
  assert.match(html, /Precision II/);
});
