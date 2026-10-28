// Contextual allographs, blends, and productive contractions.
import { isDiphthong, isGlide, isVowel, UNIT_BY_ID } from "./units.js";

const LEFT_S_BEFORE_AFTER = new Set(["p", "b", "r", "l"]);
const LEFT_S_AFTER = new Set(["t", "d", "n", "m", "o", "o1", "o2", "o3"]);
const LEFT_TH = new Set(["o", "r", "l", "o1", "o2", "o3"]);

const FALSE_CONTRACTIONS = new Set([
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

export function isVowelLike(id) {
  return isVowel(id) || isDiphthong(id) || isGlide(id);
}

export function selectVariant(unitId, prev, next, word = "") {
  if (unitId === "s") {
    if (word.includes("x") && !word.startsWith("x")) return "x";
    if (LEFT_S_BEFORE_AFTER.has(prev) || LEFT_S_BEFORE_AFTER.has(next)) return "left";
    if (LEFT_S_AFTER.has(prev)) return "left";
    return "right";
  }
  if (unitId === "th") {
    if (LEFT_TH.has(prev) || LEFT_TH.has(next)) return "left";
    return "right";
  }
  if (unitId === "r" && isVowelLike(prev)) return "circle";
  if (unitId === "l" && next === "d") return "ld";
  return null;
}

export function selectGlideVariant(unitId, index, total, prev, next) {
  if (unitId === "w") {
    // After s before a circle vowel the hook is preferred to the dash: swim, sweet, swell, swift.
    if (prev === "s" && isVowelLike(next)) return "final";
    if (index === 0 || index === total - 1) return "initial";
    return "medial";
  }
  if (unitId === "y") {
    if (next === "e1" || next === "e2" || next === "e3") return "ye";
    if (next === "a1" || next === "a2" || next === "a3") return "ya";
    return "initial";
  }
  return null;
}

// Join variants are selected by the following unit; the glyph is precomputed in units.js.
const JOIN_VARIANTS = {
  p: { r: "pr", l: "pl" },
  b: { r: "br", l: "bl" },
  f: { r: "fr", l: "fl" },
  k: { r: "kr", l: "kl" },
  g: { r: "gr", l: "gl" },
  r: { k: "rk" },
  l: { k: "lk", d: "ld" },
};

export function selectJoinVariant(unitId, next) {
  return JOIN_VARIANTS[unitId]?.[next] || null;
}

export function detectBlend(prev, next) {
  if ((prev === "t" || prev === "d") && next === "n") return "blend-ten";
  if (prev === "n" && (next === "t" || next === "d")) return "blend-ent";
  if ((prev === "t" || prev === "d") && next === "m") return "blend-tem";
  if (prev === "m" && (next === "t" || next === "d")) return "blend-emt";
  if ((prev === "t" || prev === "d") && (next === "f" || next === "v")) return "blend-tive";
  return null;
}

export function detectLongBlend(units, index) {
  const a = units[index];
  const b = units[index + 1];
  const c = units[index + 2];
  if ((a === "p" || a === "j") && b === "n" && (c === "t" || c === "d")) return "blend-pent";
  return null;
}

// The units actually drawn: contractions first, then consonant blends. Callers
// that check eligibility must use this, not the raw phoneme sequence. `blends`
// is a boolean or the Set of blend ids the learner has unlocked; a locked blend
// falls back to its separate strokes.
export function resolveUnits(unitIds, word = "", { contractions = true, blends = true } = {}) {
  const allowed = (id) => blends === true || (blends instanceof Set && blends.has(id));
  const result = contractions ? applyContractions(unitIds, word) : { units: [...unitIds], contractions: [] };
  const units = [];
  for (let i = 0; i < result.units.length; i += 1) {
    const id = result.units[i];
    const longBlend = detectLongBlend(result.units, i);
    if (longBlend && allowed(longBlend)) {
      units.push(longBlend);
      i += 2;
      continue;
    }
    const blend = detectBlend(id, result.units[i + 1]);
    if (blend && allowed(blend)) {
      units.push(blend);
      i += 1;
      continue;
    }
    units.push(id);
  }
  return { units, contractions: result.contractions };
}

export function applyContractions(units, word = "") {
  const lower = word.toLowerCase();
  let out = [...units];
  const contractions = [];

  if (!FALSE_CONTRACTIONS.has(lower)) {
    if (lower.startsWith("con") && out.length > 3) {
      const head = out.slice(0, 3).join(" ");
      if (head === "k u1 n" || head === "k u n") {
        out = ["k", ...out.slice(3)];
        contractions.push({ rule: "con-", from: head, to: "k", note: "con- is written with k." });
      }
    }
    if (lower.startsWith("com") && out.length > 3) {
      const head = out.slice(0, 3).join(" ");
      if (head === "k u1 m" || head === "k u m") {
        out = ["k", ...out.slice(3)];
        contractions.push({ rule: "com-", from: head, to: "k", note: "com- is written with k." });
      }
    }
    if (lower.endsWith("tion") && out.length >= 3) {
      const tail = out.slice(-3).join(" ");
      if (tail === "sh u1 n" || tail === "sh u n") {
        out = [...out.slice(0, -3), "sh"];
        contractions.push({ rule: "-tion", from: tail, to: "sh", note: "-tion is written with sh." });
      }
    }
    if (lower.endsWith("ing") && out.length >= 2) {
      const tail = out.slice(-2).join(" ");
      if (tail === "e1 ng" || tail === "e ng") {
        out = [...out.slice(0, -2), "ng"];
        contractions.push({ rule: "-ing", from: tail, to: "ng", note: "-ing is written with ng and a dot." });
      }
    }
    if (lower.endsWith("ly") && out.length >= 2) {
      const tail = out.slice(-2).join(" ");
      if (tail === "l e3" || tail === "l e") {
        out = [...out.slice(0, -2), "l"];
        contractions.push({ rule: "-ly", from: tail, to: "l", note: "-ly is written with l and a small circle." });
      }
    }
  }

  return { units: out, contractions };
}

export function contractionSegments(contractions, at) {
  const segments = [];
  for (const contraction of contractions) {
    if (contraction.rule === "-ing") {
      segments.push({ kind: "dot", at: { ...at }, note: "dot for -ing" });
    }
    if (contraction.rule === "-ly") {
      segments.push({ kind: "small-circle", at: { ...at }, note: "circle for -ly" });
    }
  }
  return segments;
}

export function unitLabel(id) {
  return UNIT_BY_ID[id]?.label || id;
}
