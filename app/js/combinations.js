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
    if (LEFT_S_BEFORE_AFTER.has(prev) || LEFT_S_BEFORE_AFTER.has(next)) return "left";
    if (LEFT_S_AFTER.has(prev)) return "left";
    return "right";
  }
  if (unitId === "th") {
    if (LEFT_TH.has(prev) || LEFT_TH.has(next)) return "left";
    return "right";
  }
  if (unitId === "r") {
    // Ann §71–72: the circle is r after a vowel, and the obscure ur before a
    // consonant or at the end. r + k stays the rk wave (§21), and a lone r
    // (the chart glyph) stays the stroke.
    if (next === "k") return null;
    if (isVowelLike(prev)) return "circle";
    if (next != null && !isVowelLike(next)) return "circle";
    if (prev != null && next == null && !isVowelLike(prev)) return "circle";
  }
  if (unitId === "l" && next === "d") return "ld";
  return null;
}

export function selectGlideVariant(unitId, index, total, prev, next) {
  if (unitId === "w") {
    // After s before a circle vowel the hook is preferred to the dash: swim, sweet, swell, swift.
    if (prev === "s" && isVowelLike(next)) return "final";
    // A leading h is the wh dot, not a stroke, so w is still initial: when, white.
    if (index === 0 || (index === 1 && prev === "h") || index === total - 1) return "initial";
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

export function detectBlend(prev, next, word = "") {
  if ((prev === "t" || prev === "d") && next === "n") return "blend-ten";
  if (prev === "n" && (next === "t" || next === "d")) return "blend-ent";
  // Ann p101: tem is the weak final syllable (item, victim), not a prefix or
  // suffix boundary (ad-mit, apart-ment). emt is the -med/-mt ending.
  if ((prev === "t" || prev === "d") && next === "m") {
    return /m[ns]*$/i.test(word) && !/^(madam|adam)/i.test(word) ? "blend-tem" : null;
  }
  if (prev === "m" && (next === "t" || next === "d")) {
    return /m(ed|t)$/i.test(word) ? "blend-emt" : null;
  }
  // The t-v loop is only the -tive suffix (Ann p101), not every t + f/v.
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
  // Ann p69 §98: wh is h + w, but CMUdict drops the h.
  const source = /^wh/i.test(word) && unitIds[0] === "w" && unitIds[1] !== "h" ? ["h", ...unitIds] : unitIds;
  const result = contractions ? applyContractions(source, word) : { units: [...source], contractions: [] };
  // Ann §155: -tain is written ten, with no vowel between t and n. Rewrite
  // before the blends so the n + t is not taken as ent.
  if (allowed("blend-ten") && /tain/i.test(word)) {
    for (let i = result.units.length - 2; i >= 0; i -= 1) {
      if (result.units[i] !== "t") continue;
      const at = isVowel(result.units[i + 1]) ? i + 2 : i + 1;
      if (result.units[at] !== "n") continue;
      result.units = [...result.units.slice(0, i), "blend-ten", ...result.units.slice(at + 1)];
      break;
    }
  }
  // Ann p101: the t-v loop spells the -tive suffix, where the vowel is not written.
  if (allowed("blend-tive") && /tives?$/i.test(word)) {
    const at = result.units.length - (word.endsWith("s") ? 4 : 3);
    if (result.units[at] === "t" && isVowel(result.units[at + 1]) && result.units[at + 2] === "v") {
      result.units = [...result.units.slice(0, at), "blend-tive", ...result.units.slice(at + 3)];
    }
  }
  const units = [];
  for (let i = 0; i < result.units.length; i += 1) {
    const id = result.units[i];
    const longBlend = detectLongBlend(result.units, i);
    if (longBlend && allowed(longBlend)) {
      units.push(longBlend);
      i += 2;
      continue;
    }
    const blend = detectBlend(id, result.units[i + 1], word);
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
    // Ann §80–81: con/com + consonant is k; comm/conn keep one nasal; con/com
    // before a vowel, r or l keeps the nasal. Decide from the spelling, because
    // the syllabic rule may already have dropped the prefix vowel.
    const prefix = lower.slice(0, 3);
    if ((prefix === "con" || prefix === "com") && out[0] === "k" && out.length > 1) {
      const rest = lower.slice(3);
      const keepNasal = rest === "" || /^[aeiouylrmn]/.test(rest);
      let end = 1;
      if (isVowel(out[end])) end += 1;
      const nasal = out[end];
      if (nasal === "m" || nasal === "n") {
        const from = out.slice(0, end + 1).join(" ");
        out = [...(keepNasal ? ["k", nasal] : ["k"]), ...out.slice(end + 1)];
        contractions.push({ rule: `${prefix}-`, from, to: keepNasal ? `k ${nasal}` : "k", note: `${prefix}- is written with k.` });
      } else if ((nasal === "ng" || nasal === "nk") && end > 1) {
        const from = out.slice(0, end).join(" ");
        out = ["k", ...out.slice(end)];
        contractions.push({ rule: `${prefix}-`, from, to: "k", note: `${prefix}- is written with k.` });
      }
    }
    if (/(tion|sion)$/.test(lower) && out.length >= 2) {
      // The syllabic rule usually leaves the tail as sh + n.
      const tail2 = out.slice(-2).join(" ");
      const tail3 = out.slice(-3).join(" ");
      if (tail2 === "sh n") {
        out = [...out.slice(0, -2), "sh"];
        contractions.push({ rule: "-tion", from: tail2, to: "sh", note: "-tion is written with sh." });
      } else if (tail3 === "sh u1 n" || tail3 === "sh u n") {
        out = [...out.slice(0, -3), "sh"];
        contractions.push({ rule: "-tion", from: tail3, to: "sh", note: "-tion is written with sh." });
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
