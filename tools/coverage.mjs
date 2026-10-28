// Curriculum coverage gates. Prints a table; exits non-zero if a gate fails.
//
// Gates (SPEC §7.3, PLAN §4.3):
//   - every phase prefix has at least 20 eligible words
//   - every unit introduced in a phase appears in at least 5 eligible words
//     inside that phase or the next two
//   - every learned unit appears in at least 5 words overall
//
// Eligibility uses the drawn units (contractions and unlocked blends), not the
// raw phoneme sequence, so a word only counts once its actual outline is legal.

import { LEXICON } from "../app/js/data/lexicon.js";
import { activePhases } from "../app/js/curriculum.js";
import { resolveUnits } from "../app/js/combinations.js";
import { LEARNED_UNITS, UNIT_BY_ID } from "../app/js/units.js";
import { pathToFileURL } from "node:url";

export const MIN_ELIGIBLE = 20;
export const MIN_WINDOW_WORDS = 5;
export const MIN_UNIT_WORDS = 5;

const TRACKS = [
  { track: "core", seq: "core" },
  { track: "precision", seq: "full" },
];

const unitSet = (ids) => new Set(ids);

const blendsIn = (ids) =>
  new Set(ids.filter((id) => UNIT_BY_ID[id]?.kind === "blend"));

const drawn = (record, seq, allowed) => resolveUnits(record[seq], record.w, { blends: allowed }).units;

export function coverageReport(lexicon = LEXICON) {
  const rows = [];
  const failures = [];
  const unitCounts = new Map();
  for (const record of lexicon) {
    for (const unit of new Set([...record.core, ...record.full])) {
      unitCounts.set(unit, (unitCounts.get(unit) || 0) + 1);
    }
  }

  for (const unit of LEARNED_UNITS.map((entry) => entry.id)) {
    const count = unitCounts.get(unit) || 0;
    if (count < MIN_UNIT_WORDS) failures.push(`unit ${unit} has only ${count} words`);
  }

  for (const { track, seq } of TRACKS) {
    const phases = activePhases(track);
    for (const phase of phases) {
      const unlocked = unitSet(phases.filter((entry) => entry.number <= phase.number).flatMap((entry) => entry.units));
      const allowed = blendsIn([...unlocked]);
      const eligible = lexicon.filter((record) => {
        if (!record[seq].length) return false;
        const units = drawn(record, seq, allowed);
        return units.length > 0 && units.every((unit) => unlocked.has(unit));
      });
      const last = phases[phases.length - 1].number;
      const window = unitSet(
        phases
          .filter((entry) => entry.number <= Math.min(phase.number + 2, last))
          .flatMap((entry) => entry.units),
      );
      const windowBlends = blendsIn([...window]);
      const exposureCounts = new Map(phase.units.map((unit) => [unit, 0]));
      for (const record of lexicon) {
        if (!record[seq].length) continue;
        const units = drawn(record, seq, windowBlends);
        if (!units.every((unit) => window.has(unit))) continue;
        for (const unit of new Set(units)) {
          if (exposureCounts.has(unit)) exposureCounts.set(unit, exposureCounts.get(unit) + 1);
        }
      }
      const exposures = phase.units.map((unit) => ({ unit, count: exposureCounts.get(unit) }));
      rows.push({ track, phase: phase.number, unlocked: unlocked.size, eligible: eligible.length, exposures });
      if (eligible.length < MIN_ELIGIBLE) {
        failures.push(`${track} phase ${phase.number}: only ${eligible.length} eligible words`);
      }
      for (const exposure of exposures) {
        if (exposure.count < MIN_WINDOW_WORDS) {
          failures.push(
            `${track} phase ${phase.number}: ${exposure.unit} appears in only ${exposure.count} window words`,
          );
        }
      }
    }
  }

  return { rows, failures, unitCounts };
}

function main() {
  const report = coverageReport();
  console.log(`lexicon: ${LEXICON.length} words`);
  for (const row of report.rows) {
    const exposures = row.exposures.map((entry) => `${entry.unit}:${entry.count}`).join(" ");
    console.log(`${row.track.padEnd(9)} P${row.phase}  eligible ${String(row.eligible).padStart(4)}  ${exposures}`);
  }
  if (report.failures.length) {
    console.error(`\n${report.failures.length} gate(s) failed:`);
    for (const failure of report.failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log("\nall coverage gates pass");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
