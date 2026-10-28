// Audit the committed lexicon. Read-only; prints counts and flags.
import { LEXICON } from "../app/js/data/lexicon.js";
import { UNIT_BY_ID } from "../app/js/units.js";
import { coverageReport } from "./coverage.mjs";

const known = (unit) => Boolean(UNIT_BY_ID[unit]) || unit === "a" || unit === "e" || unit === "o" || unit === "u";
const problems = [];
const seen = new Set();
const tiers = new Map();
let tagged = 0;

for (const record of LEXICON) {
  if (seen.has(record.w)) problems.push(`duplicate word: ${record.w}`);
  seen.add(record.w);
  if (!/^[a-z]{2,12}$/.test(record.w)) problems.push(`bad spelling: ${record.w}`);
  if (!record.arpabet?.length) problems.push(`no pronunciation: ${record.w}`);
  if (record.synthetic) problems.push(`synthetic entry: ${record.w}`);
  for (const unit of [...record.core, ...record.full]) {
    if (!known(unit)) problems.push(`${record.w}: unknown unit ${unit}`);
  }
  if (record.tags?.length) tagged += 1;
  tiers.set(record.tier, (tiers.get(record.tier) || 0) + 1);
}

const report = coverageReport(LEXICON);
problems.push(...report.failures);

console.log(`words: ${LEXICON.length}`);
console.log(`tiers: ${[...tiers.entries()].sort((a, b) => a[0] - b[0]).map(([tier, n]) => `${tier}:${n}`).join(" ")}`);
console.log(`tagged: ${tagged}`);
console.log(`phases: ${report.rows.length} (core + precision)`);
console.log(`units below 5 words: ${[...report.unitCounts.entries()].filter(([, count]) => count < 5).map(([unit]) => unit).join(", ") || "none"}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 40)) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log("\nlexicon audit passes");
