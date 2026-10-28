import test from "node:test";
import assert from "node:assert/strict";
import {
  UNITS,
  LEARNED_UNITS,
  CONSONANTS,
  VOWELS,
  DIPHTHONGS,
  GLIDES,
  BLENDS,
  UNIT_BY_ID,
  PHASES,
  VOWEL_BY_FAMILY,
  CORE_ALIAS,
  unitFor,
} from "../app/js/units.js";
import { activePhases } from "../app/js/curriculum.js";
import { unitLabel } from "../app/js/ui/components.js";

test("unit ids are unique and every glyph is defined", () => {
  const ids = UNITS.map((unit) => unit.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const unit of UNITS) {
    assert.ok(unit.label, `${unit.id} has a label`);
    assert.ok(unit.glyph, `${unit.id} has a glyph`);
  }
});

test("inventory matches the taught system", () => {
  assert.equal(CONSONANTS.length + VOWELS.length + DIPHTHONGS.length + GLIDES.length, LEARNED_UNITS.length);
  assert.equal(VOWELS.length, 12);
  assert.equal(DIPHTHONGS.length, 4);
  assert.equal(BLENDS.length, 6);
  assert.equal(Object.keys(VOWEL_BY_FAMILY).length, 4);
  for (const signs of Object.values(VOWEL_BY_FAMILY)) assert.equal(signs.length, 3);
  assert.equal(Object.keys(CORE_ALIAS).length, 12);
});

test("every learned unit belongs to a phase", () => {
  const phased = new Set(PHASES.flatMap((phase) => phase.units));
  for (const unit of LEARNED_UNITS) assert.ok(phased.has(unit.id), `${unit.id} is in a phase`);
});

test("blends are a final fluency phase for both tracks", () => {
  assert.deepEqual(
    activePhases("core").map((phase) => phase.number),
    [1, 2, 3, 4, 5, 6, 7, 10],
  );
  assert.deepEqual(
    activePhases("precision").map((phase) => phase.number),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  const fluency = activePhases("core").at(-1);
  assert.equal(fluency.name, "Fluency");
  assert.deepEqual(fluency.units, BLENDS.map((unit) => unit.id));
});

test("core aliases collapse to family shapes", () => {
  assert.equal(CORE_ALIAS.a1, "a");
  assert.equal(CORE_ALIAS.e3, "e");
  assert.equal(CORE_ALIAS.o2, "o");
  assert.equal(CORE_ALIAS.u1, "u");
  assert.equal(UNIT_BY_ID.blend, undefined);
});

test("bare core vowel ids resolve to a real unit and label", () => {
  assert.equal(unitFor("a").id, "a1");
  assert.equal(unitFor("e").id, "e1");
  assert.equal(unitFor("o").id, "o1");
  assert.equal(unitFor("u").id, "u1");
  assert.equal(unitFor("not-a-unit"), null);
  assert.equal(unitLabel("a"), UNIT_BY_ID.a1.label);
  assert.equal(unitLabel("not-a-unit"), "not-a-unit");
});
