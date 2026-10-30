// Build the committed practice lexicon from CMUdict + a frequency list.
//
// Sources are fetched once into tools/data/ (see tools/sources.md). The shipped
// app never fetches anything: app/js/data/lexicon.js is an ordinary ES module.
//
// Selection is coverage-balanced rather than pure top-N frequency: start with
// the most common words, then top up any learned unit that is under-represented.
// Real words only. Gregg is phonemic, and an invented spelling asks the learner
// to guess a pronunciation that is not in their vocabulary.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeRecord, syllableCount } from "../app/js/phonemes.js";
import { LEARNED_UNITS, UNIT_BY_ID } from "../app/js/units.js";
import { activePhases } from "../app/js/curriculum.js";
import { resolveUnits } from "../app/js/combinations.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dataDir = path.join(here, "data");
const cmuPath = path.join(dataDir, "cmudict.dict");
const freqPath = path.join(dataDir, "en_50k.txt");

if (!fs.existsSync(cmuPath) || !fs.existsSync(freqPath)) {
  console.error("Missing tools/data sources. Run the download steps in tools/sources.md.");
  process.exit(1);
}

const cmu = new Map();
for (const line of fs.readFileSync(cmuPath, "utf8").split("\n")) {
  const match = line.match(/^([a-z]+)(?:\(\d+\))?\s+(.+)$/);
  if (!match) continue;
  const [, word, phones] = match;
  if (!cmu.has(word)) cmu.set(word, phones.trim().split(/\s+/));
}

const frequency = new Map();
fs.readFileSync(freqPath, "utf8")
  .split("\n")
  .forEach((line, index) => {
    const [word, count] = line.trim().split(/\s+/);
    if (!word || !/^[a-z]+$/.test(word)) return;
    if (!frequency.has(word)) frequency.set(word, { rank: index + 1, count: Number(count) || 0 });
  });

// Keep the practice surface clean. Frequency lists include vulgar terms that a
// learner should not meet in a drill.
const BLOCKED = new Set(
  `ass asses asshole assholes bastard bastards bitch bitches bullshit cock cocks
   crap cunt cunts damn dick dicks fuck fucked fucker fucking goddamn hell piss
   pissed pissing porn pussy sex sexy shit shits shitty slut sluts whore whores`
    .split(/\s+/)
    .filter(Boolean),
);

const tierForRank = (rank) => {
  if (rank <= 500) return 1;
  if (rank <= 1500) return 2;
  if (rank <= 3000) return 3;
  if (rank <= 6000) return 4;
  return 5;
};

function knownUnits(record) {
  return [...record.core, ...record.full].every(
    (unit) => Boolean(UNIT_BY_ID[unit]) || unit === "a" || unit === "e" || unit === "o" || unit === "u",
  );
}

const real = [];
for (const [word, phones] of cmu) {
  const freq = frequency.get(word);
  if (!freq) continue;
  if (BLOCKED.has(word)) continue;
  if (word.length < 2 || word.length > 12) continue;
  const syllables = syllableCount(phones);
  if (syllables < 1 || syllables > 3) continue;
  // Abbreviations in CMUdict (ls, tv, mph) have no vowel letter; no Gregg
  // learner should meet them as a word.
  if (!/[aeiouy]/.test(word)) continue;
  const record = makeRecord(word, phones, { tier: tierForRank(freq.rank) });
  if (!knownUnits(record)) continue;
  if (record.core.length > 14) continue;
  real.push({ record, rank: freq.rank });
}
real.sort((a, b) => a.rank - b.rank);

// Start with the most useful words, then top up rare units so every unit has
// enough practice material. 8,000 words give every phase a deep pool, not just
// the late ones.
const TARGET = 8000;
const MIN_UNIT_WORDS = 12;
const chosen = real.slice(0, TARGET).map(({ record }) => record);
const chosenWords = new Set(chosen.map((record) => record.w));

const unitCounts = () => {
  const counts = new Map();
  for (const record of chosen) {
    for (const unit of new Set([...record.core, ...record.full])) {
      counts.set(unit, (counts.get(unit) || 0) + 1);
    }
  }
  return counts;
};

let counts = unitCounts();
for (const unit of LEARNED_UNITS.map((entry) => entry.id)) {
  let need = MIN_UNIT_WORDS - (counts.get(unit) || 0);
  if (need <= 0) continue;
  for (const { record } of real) {
    if (need <= 0) break;
    if (chosenWords.has(record.w)) continue;
    const units = new Set([...record.core, ...record.full]);
    if (!units.has(unit)) continue;
    chosen.push(record);
    chosenWords.add(record.w);
    for (const u of units) counts.set(u, (counts.get(u) || 0) + 1);
    need -= 1;
  }
}

// Keep the curriculum gates honest: every phase prefix needs at least 20
// eligible words, and every new unit needs 5 words inside its two-phase window.
const MIN_ELIGIBLE = 20;
const MIN_WINDOW_WORDS = 5;
const tracks = [
  { key: "core", seq: "core" },
  { key: "precision", seq: "full" },
];
const phaseUnits = (track, upto) =>
  activePhases(track)
    .filter((phase) => phase.number <= upto)
    .flatMap((phase) => phase.units);
const blendsIn = (ids) => new Set(ids.filter((id) => UNIT_BY_ID[id]?.kind === "blend"));
const drawn = (record, seq, allowed) => resolveUnits(record[seq], record.w, { blends: allowed }).units;
const addWord = (record) => {
  if (chosenWords.has(record.w)) return false;
  chosen.push(record);
  chosenWords.add(record.w);
  for (const unit of new Set([...record.core, ...record.full])) {
    counts.set(unit, (counts.get(unit) || 0) + 1);
  }
  return true;
};
const addFor = (seq, predicate) => {
  for (const { record } of real) {
    if (chosenWords.has(record.w)) continue;
    if (predicate(record)) return addWord(record);
  }
  return false;
};

for (let pass = 0; pass < 3; pass += 1) {
  for (const { key: track, seq } of tracks) {
    const phases = activePhases(track);
    for (const phase of phases) {
      const unlocked = new Set(phaseUnits(track, phase.number));
      const allowed = blendsIn([...unlocked]);
      const fits = (word) => {
        const units = drawn(word, seq, allowed);
        return units.length > 0 && units.every((unit) => unlocked.has(unit));
      };
      let eligible = chosen.filter(fits).length;
      while (eligible < MIN_ELIGIBLE) {
        if (!addFor(seq, fits)) break;
        eligible += 1;
      }

      const window = new Set(phaseUnits(track, Math.min(phase.number + 2, phases[phases.length - 1].number)));
      const windowBlends = blendsIn([...window]);
      for (const unit of phase.units) {
        const seenBy = (word) => {
          const units = drawn(word, seq, windowBlends);
          return units.includes(unit) && units.every((u) => window.has(u));
        };
        let seen = chosen.filter(seenBy).length;
        while (seen < MIN_WINDOW_WORDS) {
          if (!addFor(seq, seenBy)) break;
          seen += 1;
        }
      }
    }
  }
}

chosen.sort((a, b) => a.w.localeCompare(b.w));

// Gregg writes one outline for several spellings, and Core merges vowel sounds
// that Precision separates. Keep those spellings per track so read grading does
// not demand a distinction the outline cannot show. `real` is rank-ordered, so
// the commonest spelling comes first.
const spellingsBy = { core: new Map(), full: new Map() };
for (const { record } of real) {
  for (const seq of ["core", "full"]) {
    const key = record[seq].join(" ");
    const list = spellingsBy[seq].get(key);
    if (list) list.push(record.w);
    else spellingsBy[seq].set(key, [record.w]);
  }
}
const aliases = {};
for (const record of chosen) {
  const entry = {};
  for (const seq of ["core", "full"]) {
    const list = (spellingsBy[seq].get(record[seq].join(" ")) || []).filter((word) => word !== record.w);
    if (list.length) entry[seq] = list;
  }
  if (Object.keys(entry).length) aliases[record.w] = entry;
}

const outDir = path.join(root, "app", "js", "data");
fs.mkdirSync(outDir, { recursive: true });
const header = `// Generated by tools/build-lexicon.mjs from CMUdict (BSD-2-Clause) and a
// frequency list. Do not edit by hand. Regenerate with: node tools/build-lexicon.mjs
// Real words only; selected for frequency and per-unit coverage.
`;
fs.writeFileSync(
  path.join(outDir, "lexicon.js"),
  `${header}export const LEXICON = ${JSON.stringify(chosen)};\nexport const LEXICON_BY_WORD = Object.fromEntries(LEXICON.map((word) => [word.w, word]));\n`,
);
fs.writeFileSync(
  path.join(outDir, "aliases.js"),
  `// Generated by tools/build-lexicon.mjs. Do not edit by hand.
// Other real spellings that draw the same outline in each track, so read
// grading accepts them instead of demanding the exact source word.
export const ALIASES = ${JSON.stringify(aliases)};
`,
);

const csv = [
  "word,arpabet,core,full,tier,tags",
  ...chosen.map((record) =>
    [
      record.w,
      record.arpabet.join(" "),
      record.core.join(" "),
      record.full.join(" "),
      record.tier,
      (record.tags || []).join(" "),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  ),
].join("\n");
fs.writeFileSync(path.join(here, "lexicon-audit.csv"), `${csv}\n`);

counts = unitCounts();
const missing = LEARNED_UNITS.map((unit) => unit.id).filter((unit) => (counts.get(unit) || 0) < 5);
const tiers = new Map();
for (const record of chosen) tiers.set(record.tier, (tiers.get(record.tier) || 0) + 1);
console.log(`real candidates: ${real.length}`);
console.log(`chosen: ${chosen.length}`);
console.log(`tiers: ${[...tiers.entries()].sort((a, b) => a[0] - b[0]).map(([tier, n]) => `${tier}:${n}`).join(" ")}`);
console.log(`units below 5 words: ${missing.length ? missing.join(", ") : "none"}`);
if (missing.length) process.exitCode = 1;
