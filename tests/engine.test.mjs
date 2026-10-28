import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PROGRESS } from "../app/js/storage.js";
import {
  ensureProgress,
  eligibleWords,
  createSession,
  recordResult,
  finishSession,
  unlockReady,
  masterySummary,
  nextUnit,
  unitStat,
  isUnitUnlocked,
  canonicalUnit,
  drawnUnits,
  trackUnits,
  unlockedBlends,
} from "../app/js/engine.js";
import { gradeRead, acceptedAnswers } from "../app/js/grader.js";
import { LEXICON, LEXICON_BY_WORD } from "../app/js/data/lexicon.js";

const fresh = () => {
  const progress = structuredClone(DEFAULT_PROGRESS);
  ensureProgress(progress, "core");
  return progress;
};

const masteredPhaseOne = () => {
  const progress = fresh();
  for (const id of ["n", "m", "t", "d", "a", "e"]) {
    const stat = unitStat(progress, id);
    stat.attempts = 10;
    stat.correct = 10;
    stat.ema = 1;
    stat.soundEma = 1;
    stat.formEma = 1;
  }
  progress.recentTrials = [["n"], ["n"]];
  return progress;
};

test("phase one starts with exactly the foundation units", () => {
  const progress = fresh();
  assert.deepEqual(
    ["n", "m", "t", "d", "a", "e"].filter((id) => isUnitUnlocked(progress, id, "core")),
    ["n", "m", "t", "d", "a", "e"],
  );
  assert.equal(isUnitUnlocked(progress, "k", "core"), false);
  assert.equal(nextUnit(progress, "core"), "k");
});

test("eligible words only use unlocked units", () => {
  const progress = fresh();
  const words = eligibleWords(progress, LEXICON, "core");
  assert.ok(words.length >= 20);
  const unlocked = new Set(["n", "m", "t", "d", "a", "e"]);
  for (const word of words) assert.ok(word.core.every((unit) => unlocked.has(unit)));
});

test("sessions are reproducible from a seed", () => {
  const a = createSession({ progress: fresh(), track: "core", settings: { sessionLength: 12 }, seed: 1234 });
  const b = createSession({ progress: fresh(), track: "core", settings: { sessionLength: 12 }, seed: 1234 });
  assert.equal(a.items.length, 12);
  assert.deepEqual(a.items.map((item) => item.word.w), b.items.map((item) => item.word.w));
  assert.deepEqual(a.items.map((item) => item.mode), b.items.map((item) => item.mode));
});

test("read grading accepts Gregg homophones", () => {
  const record = LEXICON.find((word) => word.w === "right");
  const item = { track: "precision", word: record, units: record.full };
  assert.equal(gradeRead("right", item, LEXICON).correct, true);
  assert.equal(gradeRead("write", item, LEXICON).correct, true);
  assert.equal(gradeRead("rite", item, LEXICON).correct, false);
  assert.equal(gradeRead("", item, LEXICON).correct, false);
});

test("read grading resolves homophones with the item's blends", () => {
  const captain = LEXICON_BY_WORD.captain;
  const twin = { w: "captainn", core: ["k", "a", "p", "t", "n"], full: ["k", "a", "p", "t", "n"] };
  const item = { track: "core", word: captain, units: ["k", "a", "p", "blend-ten"] };
  const accepted = acceptedAnswers(item, [captain, twin]);
  assert.ok(accepted.includes("captain"));
  assert.ok(accepted.includes("captainn"));
});

test("read grading accepts manual answer overrides", () => {
  const eddie = LEXICON_BY_WORD.eddie;
  const item = { track: "core", word: eddie, units: eddie.full };
  assert.equal(gradeRead("eddie", item, LEXICON).correct, true);
  assert.equal(gradeRead("eddy", item, LEXICON).correct, true);
  assert.equal(gradeRead("eddy", item, LEXICON, { eddie: ["eddy"] }).correct, true);
});

test("results update mastery and recent trials", () => {
  const progress = fresh();
  const session = createSession({ progress, track: "core", settings: { sessionLength: 6 }, seed: 7 });
  const item = session.items[0];
  recordResult(progress, session, { correct: true, answer: item.word.w });
  const row = masterySummary(progress, "core").rows.find((entry) => entry.id === canonicalUnit(item.units[0]));
  assert.ok(row.attempts >= 1);
  assert.equal(progress.recentTrials.at(-1)[0], canonicalUnit(item.units[0]));
});

test("unlock requires mastery, attempts, recent exposure, and accuracy", () => {
  const progress = masteredPhaseOne();
  assert.equal(unlockReady(progress, "core"), "k");

  const session = {
    id: "s-test",
    track: "core",
    startedAt: new Date().toISOString(),
    focusUnit: "n",
    results: Array.from({ length: 10 }, (_, index) => ({ itemId: `i${index}`, mode: "read", correct: true })),
  };
  const summary = finishSession(progress, session);
  assert.equal(summary.unlocked, "k");
  assert.equal(isUnitUnlocked(progress, "k", "core"), true);
});

test("a weak session does not unlock", () => {
  const progress = masteredPhaseOne();
  const session = {
    id: "s-weak",
    track: "core",
    startedAt: new Date().toISOString(),
    focusUnit: "n",
    results: Array.from({ length: 10 }, (_, index) => ({ itemId: `i${index}`, mode: "read", correct: index < 4 })),
  };
  const summary = finishSession(progress, session);
  assert.equal(summary.unlocked, null);
  assert.equal(isUnitUnlocked(progress, "k", "core"), false);
});

test("practice never draws a locked stroke", () => {
  const progress = fresh();
  const session = createSession({ progress, track: "core", settings: { sessionLength: 12, modeMix: "mixed" }, seed: 11 });
  for (const item of session.items) {
    for (const id of item.units) assert.ok(isUnitUnlocked(progress, id, "core"), `${item.mode} drew locked ${id}`);
    if (item.drill) assert.ok(isUnitUnlocked(progress, item.drill.answer, "core"));
  }
});

test("blends unlock last and replace separate strokes only once taught", () => {
  const progress = fresh();
  assert.deepEqual(trackUnits("core").slice(-6), [
    "blend-ten",
    "blend-ent",
    "blend-tem",
    "blend-emt",
    "blend-tive",
    "blend-pent",
  ]);
  assert.equal(isUnitUnlocked(progress, "blend-ten", "core"), false);

  const captain = LEXICON_BY_WORD.captain;
  assert.deepEqual(drawnUnits(captain, "core"), ["k", "a", "p", "t", "n"]);
  unitStat(progress, "blend-ten").unlocked = true;
  assert.deepEqual(drawnUnits(captain, "core", unlockedBlends(progress, "core")), ["k", "a", "p", "blend-ten"]);
});

test("a blend word stays practiceable before its blend is taught", () => {
  const progress = fresh();
  const words = eligibleWords(progress, LEXICON, "core").map((word) => word.w);
  assert.ok(words.includes("madame"), "madame is eligible with separate strokes");
  const session = createSession({ progress, track: "core", settings: { sessionLength: 8, modeMix: "read" }, seed: 3 });
  assert.deepEqual(session.blends, []);
  for (const item of session.items) {
    for (const id of item.units) assert.ok(!id.startsWith("blend-"), `drew locked ${id}`);
  }
});

test("sessions remember which blends are unlocked", () => {
  const progress = fresh();
  unitStat(progress, "blend-ten").unlocked = true;
  const session = createSession({ progress, track: "core", settings: { sessionLength: 6 }, seed: 5 });
  assert.deepEqual(session.blends, ["blend-ten"]);
});

test("drill results record the stroke, not the word", () => {
  const progress = fresh();
  const session = createSession({ progress, track: "core", settings: { sessionLength: 12, modeMix: "mixed" }, seed: 11 });
  const index = session.items.findIndex((item) => item.mode === "drill");
  assert.ok(index >= 0);
  session.index = index;
  const entry = recordResult(progress, session, { correct: false, answer: "" });
  assert.equal(entry.word, session.items[index].drill.answer);
});
