import test from "node:test";
import assert from "node:assert/strict";
import { renderOutline, outlineForUnit, outlineForWord, outlineSvg } from "../app/js/outline.js";
import { LEXICON_BY_WORD } from "../app/js/data/lexicon.js";
import { UNIT_BY_ID } from "../app/js/units.js";

test("outline output is finite and deterministic", () => {
  const a = renderOutline(["t", "e3", "m"], "precision", { word: "team" });
  const b = renderOutline(["t", "e3", "m"], "precision", { word: "team" });
  assert.equal(a.d, b.d);
  assert.ok(a.d.startsWith("M"));
  assert.ok(a.segments.length >= 3);
  assert.equal(a.viewBox.length, 4);
  for (const value of a.viewBox) assert.ok(Number.isFinite(value));
  assert.ok(!/NaN|Infinity/.test(a.d));
});

test("unknown units are skipped without breaking the path", () => {
  const outline = renderOutline(["t", "not-a-unit", "m"], "core");
  assert.ok(outline.d.length > 0);
  assert.ok(!/NaN|Infinity/.test(outline.d));
});

test("word outlines use the requested track", () => {
  const team = LEXICON_BY_WORD.team;
  assert.ok(outlineForWord(team, "core").d.length > 0);
  assert.ok(outlineForWord(team, "precision").d.length > 0);
  assert.ok(outlineForUnit("a1", "precision").d.length > 0);
});

test("SVG serialization escapes labels", () => {
  const svg = outlineSvg(outlineForUnit("t"), { label: 'a "quote" & <tag>' });
  assert.match(svg, /&quot;quote&quot;/);
  assert.match(svg, /&amp;/);
  assert.match(svg, /&lt;tag&gt;/);
});

test("contractions show up in the rendered outline metadata", () => {
  const outline = renderOutline(["sh", "u1", "n"], "precision", { word: "nation" });
  assert.equal(outline.contractions.length, 1);
  assert.equal(outline.contractions[0].rule, "-tion");
});

test("meant draws both the n and the t", () => {
  const outline = outlineForWord(LEXICON_BY_WORD.meant, "core", { blends: false });
  const ids = outline.segments.map((segment) => segment.unitId);
  assert.ok(ids.includes("n"));
  assert.ok(ids.includes("t"));
});

test("an unlocked blend replaces its separate strokes", () => {
  const captain = LEXICON_BY_WORD.captain;
  const plain = outlineForWord(captain, "core", { blends: false });
  const blended = outlineForWord(captain, "core", { blends: new Set(["blend-ten"]) });
  assert.ok(plain.segments.some((segment) => segment.unitId === "t"));
  assert.ok(!blended.segments.some((segment) => segment.unitId === "t"));
  assert.ok(blended.placements.some((placement) => placement.rule === "blend"));
  assert.notEqual(plain.d, blended.d);
});

test("an empty unlocked-blend set keeps separate strokes", () => {
  const captain = LEXICON_BY_WORD.captain;
  const locked = outlineForWord(captain, "core", { blends: new Set() });
  assert.ok(locked.segments.some((segment) => segment.unitId === "t"));
  assert.ok(!locked.segments.some((segment) => segment.unitId === "blend-ten"));
});

test("SVG serialization accepts a viewBox override", () => {
  const svg = outlineSvg(outlineForUnit("t"), { viewBox: [-1, -2, 3, 4] });
  assert.match(svg, /viewBox="-1 -2 3 4"/);
});

test("precision vowel marks are drawn below the sign", () => {
  for (const id of ["a2", "a3", "e2", "e3", "o2", "o3", "u2", "u3"]) {
    const outline = outlineForUnit(id, "precision");
    const sign = outline.segments.find((segment) => segment.kind === "circle" || segment.kind === "hook");
    const mark = outline.segments.find((segment) => segment.kind === "mark");
    assert.ok(mark, `${id} should draw its mark`);
    const signBottom = Math.max(...sign.points.map((point) => point.y));
    assert.ok(Math.min(...mark.points.map((point) => point.y)) > signBottom, `${id} mark should sit below the sign`);
  }
});

test("diphthong hooks attach to the preceding circle's rim", () => {
  for (const id of ["ow", "yu"]) {
    const outline = outlineForUnit(id, "precision");
    const [circle, hook] = outline.segments;
    assert.equal(circle.kind, "circle");
    assert.equal(hook.kind, "hook");
    const xs = circle.points.map((point) => point.x);
    const ys = circle.points.map((point) => point.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const rx = (Math.max(...xs) - Math.min(...xs)) / 2;
    const ry = (Math.max(...ys) - Math.min(...ys)) / 2;
    const start = hook.points[0];
    const onRim = ((start.x - cx) / rx) ** 2 + ((start.y - cy) / ry) ** 2;
    assert.ok(Math.abs(onRim - 1) < 0.02, `${id} hook should start on the circle rim`);
  }
});

test("s after a final r circle becomes one loop", () => {
  for (const track of ["core", "precision"]) {
    const outline = outlineForWord(LEXICON_BY_WORD.tears, track);
    assert.ok(!outline.segments.some((segment) => segment.unitId === "s"), `${track}: s should be folded into the r loop`);
    const loop = outline.segments.find((segment) => segment.kind === "circle" && segment.liftBefore === false);
    assert.ok(loop, `${track}: vowel + r + s loop should exist`);
    assert.ok(outline.placements.some((entry) => /carries the r/.test(entry.note)), `${track}: loop rule should be recorded`);
  }
});

test("the stroke after a diphthong starts at the diphthong's end", () => {
  const outline = renderOutline(["ow", "t"], "precision", { word: "" });
  const hook = outline.segments.find((segment) => segment.unitId === "ow" && segment.kind === "hook");
  const next = outline.segments.find((segment) => segment.unitId === "t");
  const end = hook.points[hook.points.length - 1];
  const start = next.points[0];
  assert.ok(Math.hypot(end.x - start.x, end.y - start.y) < 1e-6, "next stroke should continue from the diphthong end");
});

test("r after a circle vowel is written as one loop", () => {
  const outline = renderOutline(["a2", "r", "t"], "precision", { word: "art" });
  assert.ok(!outline.segments.some((segment) => segment.unitId === "r"), "r should merge into the vowel loop");
  assert.ok(
    outline.segments.some((segment) => segment.unitId === "a2" && segment.kind === "circle" && segment.liftBefore === false),
    "the vowel should be the loop",
  );
});

test("final r after a circle vowel is a closed circle, not an open loop", () => {
  const outline = renderOutline(["k", "a1", "r"], "precision", { word: "car" });
  const loop = outline.segments.find((segment) => segment.unitId === "a1");
  assert.equal(loop.kind, "circle");
  assert.equal(loop.liftBefore, true, "final r circle should close back on the stroke");
  assert.ok(outline.placements.some((entry) => entry.unitId === "a1" && entry.rule === "final"));
});

test("the post-vocalic r circle hangs above after p or b and below otherwise", () => {
  const side = (seq) => renderOutline(seq, "precision", { word: "" }).placements.find((entry) => entry.unitId === "r").side;
  assert.equal(side(["p", "o1", "r", "t"]), "above");
  assert.equal(side(["b", "o1", "r", "t"]), "above");
  assert.equal(side(["m", "o1", "r", "t"]), "below");
  assert.equal(side(["t", "o1", "r", "t"]), "below");
});

test("every outline stays finite and inside its viewBox", () => {
  const samples = [...Object.keys(UNIT_BY_ID).map((id) => [id, outlineForUnit(id, "precision")])];
  for (const word of ["team", "running", "people", "machine", "think", "boy", "use", "we", "yes", "hot"]) {
    samples.push([word, outlineForWord(LEXICON_BY_WORD[word], "precision")]);
  }
  for (const [name, outline] of samples) {
    const [x, y, w, h] = outline.viewBox;
    assert.ok([x, y, w, h].every(Number.isFinite), `${name} viewBox is finite`);
    assert.ok(!/NaN|Infinity/.test(outline.d), `${name} path is finite`);
    for (const segment of outline.segments) {
      for (const point of segment.points || []) {
        assert.ok(point.x >= x - 1e-6 && point.x <= x + w + 1e-6, `${name} point x in viewBox`);
        assert.ok(point.y >= y - 1e-6 && point.y <= y + h + 1e-6, `${name} point y in viewBox`);
      }
    }
  }
});
