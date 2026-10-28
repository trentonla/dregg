import test from "node:test";
import assert from "node:assert/strict";
import { coverageReport } from "../tools/coverage.mjs";
import { LEXICON } from "../app/js/data/lexicon.js";
import { LEARNED_UNITS } from "../app/js/units.js";

test("the shipped lexicon passes every coverage gate", () => {
  const report = coverageReport(LEXICON);
  assert.deepEqual(report.failures, []);
  for (const row of report.rows) {
    assert.ok(row.eligible >= 20, `${row.track} phase ${row.phase}`);
    for (const exposure of row.exposures) assert.ok(exposure.count >= 5, `${row.track} ${exposure.unit}`);
  }
});

test("every learned unit has practice material", () => {
  const counts = new Map();
  for (const record of LEXICON) {
    for (const unit of new Set([...record.core, ...record.full])) {
      counts.set(unit, (counts.get(unit) || 0) + 1);
    }
  }
  for (const unit of LEARNED_UNITS) assert.ok((counts.get(unit.id) || 0) >= 5, unit.id);
});

test("the lexicon is real words only", () => {
  assert.ok(LEXICON.length >= 1500);
  assert.equal(new Set(LEXICON.map((record) => record.w)).size, LEXICON.length);
  for (const record of LEXICON) {
    assert.match(record.w, /^[a-z]{2,12}$/);
    assert.ok(!record.synthetic);
    assert.ok(!record.unverified);
    assert.ok(record.arpabet.length > 0);
    assert.ok(record.core.length > 0 && record.full.length > 0);
  }
});
