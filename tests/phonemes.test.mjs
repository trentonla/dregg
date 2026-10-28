import test from "node:test";
import assert from "node:assert/strict";
import { makeRecord, heuristicRecord, arpabetToUnits, syllableCount } from "../app/js/phonemes.js";

test("ARPAbet maps to the taught units", () => {
  assert.deepEqual(makeRecord("it", ["IH1", "T"]).full, ["e1", "t"]);
  assert.deepEqual(makeRecord("at", ["AE1", "T"]).full, ["a1", "t"]);
  assert.deepEqual(makeRecord("team", ["T", "IY1", "M"]).full, ["t", "e3", "m"]);
  assert.deepEqual(makeRecord("think", ["TH", "IH1", "NG", "K"]).full, ["th", "e1", "nk"]);
  assert.deepEqual(makeRecord("use", ["Y", "UW1", "S"]).full, ["yu", "s"]);
  assert.deepEqual(makeRecord("boy", ["B", "OY1"]).full, ["b", "oi"]);
});

test("core records use family aliases", () => {
  const team = makeRecord("team", ["T", "IY1", "M"]);
  assert.deepEqual(team.core, ["t", "e", "m"]);
  const use = makeRecord("use", ["Y", "UW1", "S"]);
  assert.deepEqual(use.core, ["yu", "s"]);
});

test("A/O split keeps art and on distinct", () => {
  assert.deepEqual(makeRecord("art", ["AA1", "R", "T"]).full, ["a2", "r", "t"]);
  assert.deepEqual(makeRecord("on", ["AA1", "N"]).full, ["o1", "n"]);
  assert.deepEqual(makeRecord("hot", ["HH", "AA1", "T"]).full, ["h", "o1", "t"]);
  assert.deepEqual(makeRecord("dog", ["D", "AO1", "G"]).full, ["d", "o1", "g"]);
});

test("schwa and syllabic consonants follow the policy", () => {
  assert.deepEqual(makeRecord("up", ["AH1", "P"]).full, ["u1", "p"]);
  assert.deepEqual(makeRecord("people", ["P", "IY1", "P", "AH0", "L"]).full, ["p", "e3", "p", "l"]);
});

test("syllable count and heuristic records", () => {
  assert.equal(syllableCount(["T", "IY1", "M"]), 1);
  assert.equal(syllableCount(["B", "Y", "UW1", "T", "AH0", "F", "AH0", "L"]), 3);
  const record = heuristicRecord("team");
  assert.equal(record.unverified, true);
  assert.equal(record.w, "team");
  assert.ok(record.full.length > 0);
});

test("unknown phonemes are skipped rather than invented", () => {
  assert.deepEqual(arpabetToUnits(["T", "ZZZ", "M"]).full, ["t", "m"]);
});
