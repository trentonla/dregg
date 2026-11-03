import test from "node:test";
import assert from "node:assert/strict";
import {
  applyContractions,
  detectBlend,
  resolveUnits,
  selectGlideVariant,
  selectJoinVariant,
  selectVariant,
} from "../app/js/combinations.js";
import { LEXICON_BY_WORD } from "../app/js/data/lexicon.js";
import { outlineForWord, renderOutline } from "../app/js/outline.js";
import { xFormOrdinal } from "../app/js/phonemes.js";

test("-tion and -ing contract before layout", () => {
  const tion = applyContractions(["sh", "u1", "n"], "nation");
  assert.deepEqual(tion.units, ["sh"]);
  assert.equal(tion.contractions[0].rule, "-tion");

  const ing = applyContractions(["r", "u1", "n", "e1", "ng"], "running");
  assert.deepEqual(ing.units, ["r", "u1", "n", "ng"]);
  assert.equal(ing.contractions[0].rule, "-ing");

  const ly = applyContractions(["l", "e3"], "quickly");
  assert.deepEqual(ly.units, ["l"]);
});

test("contractions respect the exception list", () => {
  assert.deepEqual(applyContractions(["sh", "u1", "n"], "nation").units, ["sh"]);
  assert.deepEqual(applyContractions(["k", "u1", "m", "p", "l", "e1", "t"], "complete").units, [
    "k",
    "u1",
    "m",
    "p",
    "l",
    "e1",
    "t",
  ]);
  assert.deepEqual(applyContractions(["k", "u1", "m", "p", "n", "e1"], "company").units, [
    "k",
    "u1",
    "m",
    "p",
    "n",
    "e1",
  ]);
});

test("con- and com- use k", () => {
  assert.deepEqual(applyContractions(["k", "u1", "n", "v"], "convention").units, ["k", "v"]);
  assert.deepEqual(applyContractions(["k", "u1", "m", "p", "a", "k", "t"], "compact").units, [
    "k",
    "p",
    "a",
    "k",
    "t",
  ]);
});

test("join variants are selected from the next unit", () => {
  assert.equal(selectJoinVariant("p", "r"), "pr");
  assert.equal(selectJoinVariant("p", "l"), "pl");
  assert.equal(selectJoinVariant("p", "t"), null);
  assert.equal(detectBlend("t", "n"), "blend-ten");
  assert.equal(detectBlend("p", "r"), null);
});

test("th allograph follows the documented distribution", () => {
  assert.ok(selectVariant("th", "o", "t", "both"));
  assert.ok(selectVariant("th", "a", null, "that"));
  assert.notEqual(selectVariant("th", "o", "t", "both"), selectVariant("th", "a", null, "that"));
});

test("glide variants follow the documented placement", () => {
  assert.equal(selectGlideVariant("w", 0, 2, null, "a3"), "initial");
  assert.equal(selectGlideVariant("w", 0, 3, null, "t"), "initial");
  assert.equal(selectGlideVariant("w", 1, 4, "k", "i"), "medial");
  // After s before a circle vowel the hook is preferred: swim, sweet, swell, swift.
  assert.equal(selectGlideVariant("w", 1, 4, "s", "e3"), "final");
  assert.equal(selectGlideVariant("w", 2, 6, "o", "e3"), "medial");
});

test("medial w draws a dash under the following vowel", () => {
  const outline = renderOutline(["k", "w", "e1", "n"], "precision", { word: "queen" });
  const dash = outline.segments.find((segment) => segment.kind === "dash");
  assert.ok(dash, "medial w should draw a dash");
  assert.equal(dash.unitId, "w");
  // Anniversary p69 §99: the dash sits beneath the vowel, not across it.
  const vowel = outline.segments.find((segment) => segment.unitId === "e1");
  const vowelBottom = Math.max(...vowel.points.map((point) => point.y));
  assert.ok(Math.min(...dash.points.map((point) => point.y)) > vowelBottom);
  assert.ok(outline.placements.some((placement) => placement.unitId === "w" && placement.rule === "medial"));

  // A vowel that carries a final r still gets its dash.
  const beware = renderOutline(["b", "e1", "w", "e2", "r"], "precision", { word: "beware" });
  assert.ok(beware.segments.some((segment) => segment.kind === "dash"), "dash should survive the r loop");
});

test("Anniversary fixes: wh, -tive, -tain, rk, ld", () => {
  // Ann p69 §98: wh is h + w even though CMUdict drops the h.
  assert.deepEqual(resolveUnits(["w", "e1", "n"], "when").units, ["h", "w", "e1", "n"]);
  // Ann p101: the t-v loop is only the -tive suffix.
  assert.deepEqual(resolveUnits(["a1", "k", "t", "e1", "v"], "active").units, ["a1", "k", "blend-tive"]);
  assert.deepEqual(resolveUnits(["u1", "d", "v", "a1", "n", "s"], "advance").units, ["u1", "d", "v", "a1", "n", "s"]);
  // Ann §155: -tain is ten with no vowel between t and n.
  assert.deepEqual(resolveUnits(["k", "n", "t", "a3", "n"], "contain").units, ["k", "blend-ten"]);
  assert.deepEqual(resolveUnits(["m", "a3", "n", "t", "a3", "n"], "maintain").units, ["m", "a3", "n", "blend-ten"]);
  // r before k keeps the wave, not the r circle.
  assert.equal(selectVariant("r", "a2", "k", "dark"), null);
  assert.equal(selectVariant("r", "a2", null, "car"), "circle");
  // Ann §71–72: obscure ur is the circle alone, including r before a consonant
  // (her, church, hurt, earn, turn, learn, first) but never before k (work).
  assert.equal(selectVariant("r", "h", null, "her"), "circle");
  assert.equal(selectVariant("r", "ch", "ch", "church"), "circle");
  assert.equal(selectVariant("r", "h", "t", "hurt"), "circle");
  assert.equal(selectVariant("r", null, "n", "earn"), "circle");
  assert.equal(selectVariant("r", "t", "n", "turn"), "circle");
  assert.equal(selectVariant("r", "l", "n", "learn"), "circle");
  assert.equal(selectVariant("r", "f", "s", "first"), "circle");
  assert.equal(selectVariant("r", "w", "k", "work"), null);
  assert.equal(selectVariant("r", null, null, "r"), null);
  // l + d is one l stroke with an upward turn, so no separate d is drawn.
  const old = outlineForWord(LEXICON_BY_WORD.old, "precision");
  assert.equal(old.placements.find((placement) => placement.unitId === "l").rule, "blend");
  assert.ok(!old.segments.some((segment) => segment.unitId === "d" && segment.kind === "stroke"));
});

test("tem and emt only blend at the word ending", () => {
  assert.equal(detectBlend("t", "m", "item"), "blend-tem");
  assert.equal(detectBlend("t", "m", "admit"), null);
  assert.equal(detectBlend("t", "m", "apartment"), null);
  assert.equal(detectBlend("m", "t", "dreamt"), "blend-emt");
  assert.equal(detectBlend("m", "t", "hometown"), null);
});

test("x is one s sign per ks sound", () => {
  assert.equal(xFormOrdinal(["S", "IH1", "K", "S"]), 2);
  assert.equal(xFormOrdinal(["EH1", "K", "S", "ER0", "S", "AY2", "Z"]), 1);
  assert.equal(xFormOrdinal(["IH0", "G", "Z", "AE1", "K", "T"]), 0);
  // nk already carries the k, so its plural s is not x.
  assert.equal(xFormOrdinal(["B", "AE1", "NG", "K", "S"]), 0);
  const signs = (word) =>
    outlineForWord(LEXICON_BY_WORD[word], "precision").placements.filter((placement) => placement.variant === "x").length;
  assert.equal(signs("six"), 1);
  assert.equal(signs("exercise"), 1);
  assert.equal(signs("exact"), 0);
  assert.equal(signs("banks"), 0);
});
