import test from "node:test";
import assert from "node:assert/strict";
import { BRIEF_FORMS, briefRecord, outlineForBrief } from "../app/js/briefs.js";
import { availableBriefs, createBriefSession, ensureProgress } from "../app/js/engine.js";
import { DEFAULT_PROGRESS } from "../app/js/storage.js";
import { gradeRead } from "../app/js/grader.js";
import { LEXICON_BY_WORD } from "../app/js/data/lexicon.js";

function freshProgress() {
  const progress = structuredClone(DEFAULT_PROGRESS);
  ensureProgress(progress, "core");
  return progress;
}

test("every brief form renders and covers real words", () => {
  for (const brief of BRIEF_FORMS) {
    const outline = outlineForBrief(brief, "precision");
    assert.ok(outline.d.length > 0, `${brief.id} should draw`);
    for (const word of brief.words) {
      assert.ok(LEXICON_BY_WORD[word], `${word} should be a real word`);
    }
  }
});

test("brief forms unlock with the strokes they use", () => {
  const progress = freshProgress();
  // n and d are enough for "and"; the others need o, th and the u family.
  assert.deepEqual(availableBriefs(progress, "core").map((brief) => brief.id), ["bf_and"]);

  for (const id of ["o1", "th", "u1", "blend-ent"]) progress.units[id] = { ...(progress.units[id] || {}), unlocked: true };
  assert.equal(availableBriefs(progress, "core").length, BRIEF_FORMS.length);
});

test("a brief session reads then writes each available form", () => {
  const progress = freshProgress();
  const session = createBriefSession({ progress, track: "core", seed: 1 });
  assert.deepEqual(
    session.items.map((item) => `${item.brief}:${item.mode}`),
    ["bf_and:read", "bf_and:write"],
  );
  assert.deepEqual(session.items[0].units, ["n", "d"]);

  for (const id of ["o1", "th", "u1", "blend-ent"]) progress.units[id] = { ...(progress.units[id] || {}), unlocked: true };
  const full = createBriefSession({ progress, track: "core", seed: 2 });
  assert.equal(full.items.length, BRIEF_FORMS.length * 2);
  // "and" uses the nd blend once it is unlocked.
  assert.deepEqual(full.items.find((item) => item.brief === "bf_and").units, ["blend-ent"]);
});

test("read grading accepts every word a brief form covers", () => {
  const item = { brief: "bf_to", word: { w: "to" }, units: ["t", "u3"], track: "core" };
  for (const word of ["to", "too", "two"]) assert.ok(gradeRead(word, item, []).correct, word);
  assert.ok(!gradeRead("do", item, []).correct);
});
