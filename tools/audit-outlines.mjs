// Structural audit of generated outlines against the Anniversary rules and
// the 1929 Gregg Shorthand Dictionary. Report-only: the app still ships the
// approximations this prints. Run with `npm run audit:outlines`.
import { LEXICON, LEXICON_BY_WORD } from "../app/js/data/lexicon.js";
import {
  applyContractions,
  isVowelLike,
  resolveUnits,
  selectJoinVariant,
  selectVariant,
} from "../app/js/combinations.js";
import { renderOutline } from "../app/js/outline.js";

const EXCEPTIONS = new Set([
  "complete",
  "completed",
  "completely",
  "complex",
  "company",
  "compare",
  "compete",
  "keep",
  "kept",
  "baggage",
  "package",
  "packet",
  "pocket",
  "rocket",
]);

const resolved = new Map();
const outlineOf = new Map();
function analysis(record) {
  if (!resolved.has(record.w)) {
    resolved.set(record.w, resolveUnits(record.full, record.w));
    outlineOf.set(record.w, renderOutline(record.full, "precision", { word: record.w }));
  }
  return { ...resolved.get(record.w), outline: outlineOf.get(record.w) };
}

function section(title) {
  console.log(`\n## ${title}`);
}

function row(label, list, example = 5, format = (record) => record.w) {
  console.log(`- ${label}: ${list.length}`);
  for (const record of list.slice(0, example)) console.log(`    ${format(record)}`);
}

// --- wh ------------------------------------------------------------------
section("wh: the h dot");
const wh = LEXICON.filter((record) => record.w.startsWith("wh"));
const whMissing = wh.filter((record) => !record.full.includes("h"));
row("wh words", wh, 3);
row("missing the h dot", whMissing, 8, (record) => `${record.w} (${record.full.join(" ")})`);

// --- x-form --------------------------------------------------------------
section("x: one x sign per ks sound");
const xWords = LEXICON.filter((record) => record.tags?.includes("x-form"));
const xMulti = xWords.filter((record) => record.full.filter((unit) => unit === "s").length > 1);
const extraS = xMulti.reduce(
  (total, record) => total + record.full.filter((unit) => unit === "s").length - 1,
  0,
);
row("x-form words", xWords, 3);
row(`words with more than one s (${extraS} extra s drawn as x)`, xMulti, 8, (record) => {
  const count = record.full.filter((unit) => unit === "s").length;
  return `${record.w}: ${count} s -> ${record.full.join(" ")}`;
});

// --- con / com -----------------------------------------------------------
section("con/com: k for the prefix");
const conCom = LEXICON.filter(
  (record) => /^(con|com)[bcdfghjklmnpqrstvwxyz]/i.test(record.w) && !EXCEPTIONS.has(record.w),
);
const conMiss = conCom.filter(
  (record) => !applyContractions(record.full, record.w).contractions.some((entry) => entry.rule === "con-" || entry.rule === "com-"),
);
row("con/com + consonant (not in the exception list)", conCom, 3);
row("uncontracted", conMiss, 12, (record) => `${record.w} (${record.full.join(" ")})`);

// --- blends --------------------------------------------------------------
section("Blends: adjacent consonants are not always one stroke");
const blendWords = new Map();
for (const record of LEXICON) {
  const { units } = analysis(record);
  for (const unit of units) {
    if (!unit.startsWith("blend-")) continue;
    if (!blendWords.has(unit)) blendWords.set(unit, []);
    blendWords.get(unit).push(record);
  }
}
for (const [blend, list] of [...blendWords].sort((a, b) => b[1].length - a[1].length)) {
  row(blend, list, 6, (record) => `${record.w} (${record.full.join(" ")})`);
}

const tive = blendWords.get("blend-tive") || [];
section("blend-tive: loop should mean a -tive/def syllable");
row("uses", tive, 30, (record) => `${record.w} (${record.full.join(" ")})`);

const tem = blendWords.get("blend-tem") || [];
const emt = blendWords.get("blend-emt") || [];
section("tem/emt: review queue (boundary suspects first)");
const mentTem = tem.filter((record) => record.w.endsWith("ment"));
const compoundTem = tem.filter(
  (record) =>
    /^(ad|bat|head|home|mad|night|some|state|treat|invest|apart|depart|commit|excit|compartment)/.test(record.w) &&
    !record.w.endsWith("ment"),
);
row("tem words ending in -ment (t + m across the suffix)", mentTem, 12, (record) => `${record.w} (${record.full.join(" ")})`);
row("tem words with an ad-/compound boundary", compoundTem, 12, (record) => `${record.w} (${record.full.join(" ")})`);
const compoundEmt = emt.filter((record) => /^(home|some)/.test(record.w));
row("emt words across a compound boundary", compoundEmt, 12, (record) => `${record.w} (${record.full.join(" ")})`);

// --- rk ------------------------------------------------------------------
section("rk: the post-vocalic wave");
const rkWords = [];
for (const record of LEXICON) {
  const { units } = analysis(record);
  for (let i = 0; i < units.length - 1; i += 1) {
    if (units[i] === "r" && units[i + 1] === "k" && isVowelLike(units[i - 1])) rkWords.push({ record, index: i });
  }
}
const rkWrong = rkWords.filter(({ record, index }) => {
  const { units } = analysis(record);
  return selectVariant("r", units[index - 1], units[index + 1], record.w) === "circle";
});
row("r + k after a vowel", rkWords, 3, (entry) => entry.record.w);
row("blocked by the r-circle rule (the rk join never fires)", rkWrong, 12, (entry) => entry.record.w);

// --- ld ------------------------------------------------------------------
section("ld: the upward terminal");
const ldWords = LEXICON.filter((record) => {
  const { units } = analysis(record);
  return units.some((unit, index) => unit === "l" && units[index + 1] === "d");
});
row("l + d pairs", ldWords, 3);
console.log("    (the ld variant is selected, but outline.js still draws a separate d stroke)");

// --- tain / mpt ----------------------------------------------------------
section("tain and mpt: rules the generator does not have yet");
const tain = LEXICON.filter((record) => /tain(ed|ing|s)?$/.test(record.w));
const tainMiss = tain.filter((record) => !analysis(record).units.includes("blend-ten"));
row("tain words", tain, 3);
row("not written with ten", tainMiss, 12, (record) => `${record.w} (${record.full.join(" ")})`);
const mpt = LEXICON.filter((record) => record.w.includes("mpt"));
row("mpt words (no mpt blend exists; the manual writes one long curve)", mpt, 12, (record) => `${record.w} (${record.full.join(" ")})`);

// --- -tion ---------------------------------------------------------------
section("-tion / -sion: the sh sign");
const tion = LEXICON.filter((record) => /(tion|sion)$/.test(record.w));
const tionDone = tion.filter((record) =>
  analysis(record).contractions.some((entry) => entry.rule === "-tion"),
);
row("tion/sion words", tion, 3);
row("contracted to sh", tionDone, 3);
row("left with a trailing n", tion.filter((record) => !tionDone.includes(record)), 8, (record) => `${record.w} (${record.full.join(" ")})`);

// --- dictionary checks ---------------------------------------------------
section("Dictionary spot checks");
const checks = [];
function check(name, word, source, predicate, expected) {
  const record = LEXICON_BY_WORD[word];
  if (!record) {
    checks.push({ name, word, source, status: "missing" });
    return;
  }
  const result = analysis(record);
  const pass = predicate(record, result);
  checks.push({ name, word, source, status: pass ? "pass" : "FAIL", actual: result.units.join(" "), expected });
}

const has = (result, unit) => result.units.includes(unit);
const hasNot = (result, unit) => !result.units.includes(unit);

check("wh writes the h dot", "when", "Ann p69 §98", (record, result) => has(result, "h"), "w h e2 n");
check("wh writes the h dot", "white", "Ann p69 §98", (record, result) => has(result, "h"), "w h ai t");
check("x is one sign", "six", "Ann ch2 §57", (record) => {
  const s = record.full.map((unit, index) => ({ unit, index })).filter((entry) => entry.unit === "s");
  return s.filter((entry) => selectVariant("s", record.full[entry.index - 1], record.full[entry.index + 1], record.w) === "x").length === 1;
}, "s + x (one x sign)");
check("x is one sign", "exercise", "Ann ch2 §57", (record, result) => {
  const s = record.full.map((unit, index) => ({ unit, index })).filter((entry) => entry.unit === "s");
  return s.filter((entry) => selectVariant("s", record.full[entry.index - 1], record.full[entry.index + 1], record.w) === "x").length === 1;
}, "one x sign, not three");
check("con- is k", "convention", "Ann §80", (record, result) => result.units[0] === "k" && result.units[1] !== "n", "k + v...");
check("com- is k", "computer", "Ann §80", (record, result) => result.units[0] === "k" && result.units[1] !== "m", "k + p...");
check("tive is a syllable", "advantage", "Dictionary p6", (record, result) => hasNot(result, "blend-tive"), "a d v a n t...");
check("tive is a syllable", "advice", "Dictionary p6", (record, result) => hasNot(result, "blend-tive"), "a d v ai s");
check("tem is a syllable", "atmosphere", "Dictionary p15", (record, result) => hasNot(result, "blend-tem"), "a t m...");
check("tem is a syllable", "apartment", "Dictionary p11", (record, result) => hasNot(result, "blend-tem"), "a p a r t m...");
check("emt is a syllable", "hometown", "compound", (record, result) => hasNot(result, "blend-emt"), "h o3 m t...");
check("ent/end is correct", "plenty", "Ann p89 §135", (record, result) => has(result, "blend-ent"), "p l e2 + ent + e3");
check("ent/end is correct", "prevent", "Ann p89 §135", (record, result) => has(result, "blend-ent"), "p r e1 v e2 + ent");
check("tem is correct", "item", "Ann p101 §154", (record, result) => has(result, "blend-tem"), "ai + tem");
check("tem is correct", "victim", "Ann p101 §154", (record, result) => has(result, "blend-tem"), "v e1 k + tem");
check("pent is correct", "agent", "Ann p101 §154", (record, result) => has(result, "blend-pent"), "a3 + pent");
check("pent is correct", "happened", "Ann p89 §135", (record, result) => has(result, "blend-pent"), "h a1 + pent");
check("pent is correct", "spend", "Ann p89 §135", (record, result) => has(result, "blend-pent"), "s p e2 + pent");
check("pent is correct", "gentle", "Ann p89 §135", (record, result) => has(result, "blend-pent"), "j e2 + pent + l");
check("rk is a wave", "ark", "Ann p25 §21", (record, result) => result.outline.segments.some((segment) => segment.unitId === "r" && segment.kind === "stroke"), "a2 + rk wave");
check("rk is a wave", "dark", "Ann p25 §21", (record, result) => result.outline.segments.some((segment) => segment.unitId === "r" && segment.kind === "stroke"), "d a2 + rk wave");
check("tain is ten", "contain", "Ann §155", (record, result) => has(result, "blend-ten"), "k + ten");
check("tain is ten", "maintain", "Ann §155", (record, result) => has(result, "blend-ten"), "m a3 + ten");
check("tain is ten", "obtain", "Ann §155", (record, result) => has(result, "blend-ten"), "u1 b + ten");
check("-tion is sh", "nation", "Ann §58", (record, result) => result.units.at(-1) === "sh", "n a3 sh");
check("-ing is a dot", "running", "Ann §3", (record, result) => result.contractions.some((entry) => entry.rule === "-ing"), "r u1 n + ng + dot");
check("-ly is a circle", "quickly", "Ann §80", (record, result) => result.contractions.some((entry) => entry.rule === "-ly"), "k w e1 k l + circle");

for (const entry of checks) {
  const detail = entry.status === "pass" ? "ok" : `${entry.actual || "missing"} (want ${entry.expected})`;
  console.log(`- [${entry.status}] ${entry.name}: ${entry.word} — ${detail}  [${entry.source}]`);
}

const failed = checks.filter((entry) => entry.status === "FAIL").length;
const missing = checks.filter((entry) => entry.status === "missing").length;
console.log(`\n${checks.length - failed - missing}/${checks.length} dictionary checks pass; ${failed} fail; ${missing} missing from the lexicon.`);
