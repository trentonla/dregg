import test from "node:test";
import assert from "node:assert/strict";
import { applyContractions, selectVariant, selectJoinVariant, selectGlideVariant, detectBlend } from "../app/js/combinations.js";
import { renderOutline } from "../app/js/outline.js";

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
