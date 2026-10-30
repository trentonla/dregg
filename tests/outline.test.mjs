import test from "node:test";
import assert from "node:assert/strict";
import { UNIT_VIEWBOX, referenceViewBox, renderOutline, outlineForUnit, outlineForWord, outlineSvg } from "../app/js/outline.js";
import { LEXICON, LEXICON_BY_WORD } from "../app/js/data/lexicon.js";
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

test("each diphthong is one continuous stroke", () => {
  for (const id of ["ai", "ow", "oi", "yu"]) {
    const outline = outlineForUnit(id, "precision");
    assert.equal(outline.segments.length, 1, `${id} should be a single segment`);
    assert.equal((outline.d.match(/M/g) || []).length, 1, `${id} should be one continuous path`);
    assert.ok(outline.segments[0].points.length > 20, `${id} should trace a full circle`);
  }
});

test("diphthongs close their circle and leave a tail", () => {
  for (const id of ["ai", "ow", "yu"]) {
    const points = outlineForUnit(id, "precision").segments[0].points;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    assert.ok(width > 0.3, `${id} draws a circle, not a hook`);
    assert.ok(height > width * 0.6, `${id} rises into its tail`);
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
  const diph = outline.segments.find((segment) => segment.unitId === "ow");
  const next = outline.segments.find((segment) => segment.unitId === "t");
  const end = diph.points[diph.points.length - 1];
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

test("unit glyphs share one fixed frame so short and long strokes compare", () => {
  const [fx, fy, fw, fh] = UNIT_VIEWBOX;
  for (const id of Object.keys(UNIT_BY_ID)) {
    const [x, y, w, h] = outlineForUnit(id, "precision").viewBox;
    assert.ok(x >= fx - 1e-6 && y >= fy - 1e-6, `${id} fits the frame's top left`);
    assert.ok(x + w <= fx + fw + 1e-6 && y + h <= fy + fh + 1e-6, `${id} fits the frame's bottom right`);
  }
});

test("word outlines share one fixed frame and never clip", () => {
  const short = referenceViewBox(outlineForUnit("t", "precision"));
  const long = referenceViewBox(outlineForUnit("d", "precision"));
  assert.deepEqual(short.slice(2), long.slice(2), "short and long strokes use the same frame size");
  for (const record of LEXICON) {
    if (!record) continue;
    const outline = outlineForWord(record, "precision");
    const [x, y, w, h] = referenceViewBox(outline);
    const [ox, oy, ow, oh] = outline.viewBox;
    assert.ok(ox >= x - 1e-6 && oy >= y - 1e-6, `${record.w} fits the frame`);
    assert.ok(ox + ow <= x + w + 1e-6 && oy + oh <= y + h + 1e-6, `${record.w} fits the frame`);
  }
});

test("k/g peak right of centre and r/l bottom left of centre", () => {
  const apex = (id) => {
    const points = outlineForUnit(id, "precision").segments.flatMap((segment) => segment.points || []);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const extreme = id === "k" || id === "g" ? Math.min(...ys) : Math.max(...ys);
    const hits = points.filter((point) => Math.abs(point.y - extreme) < 1e-6).map((point) => point.x);
    return (hits.reduce((sum, x) => sum + x, 0) / hits.length - minX) / (maxX - minX);
  };
  assert.ok(apex("k") > 0.55, `k peaks right of centre (${apex("k").toFixed(2)})`);
  assert.ok(apex("g") > 0.55, `g peaks right of centre (${apex("g").toFixed(2)})`);
  assert.ok(apex("r") < 0.45, `r bottoms left of centre (${apex("r").toFixed(2)})`);
  assert.ok(apex("l") < 0.45, `l bottoms left of centre (${apex("l").toFixed(2)})`);
});

test("the a3/e3 tick rises to the right under the sign", () => {
  for (const id of ["a3", "e3"]) {
    const mark = outlineForUnit(id, "precision").segments.find((segment) => segment.kind === "mark");
    const [start, end] = mark.points;
    assert.ok(end.x > start.x, `${id} tick points right`);
    assert.ok(end.y < start.y, `${id} tick points up`);
  }
});

test("nt/nd and mt/md blends cup upward", () => {
  for (const id of ["blend-ten", "blend-ent", "blend-tem", "blend-emt"]) {
    const points = outlineForUnit(id, "precision").segments[0].points;
    const start = points[0];
    const end = points[points.length - 1];
    const mid = points[Math.floor(points.length / 2)];
    const chordY = (start.y + end.y) / 2;
    assert.ok(mid.y > chordY, `${id} sags below the chord (curves up)`);
    assert.ok(end.y < start.y, `${id} rises to the right`);
  }
});
