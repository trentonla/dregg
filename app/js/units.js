// Unit dictionary for Gregg Anniversary, in the Core-first presentation used by Dregg.
// Geometry is authored in "u" units: 1u is a short stroke, 2u a long stroke.
// SVG coordinates: x grows right, y grows down. Angles are clockwise from +x.

const line = (length, angle = 0, extra = {}) => ({ type: "line", length, angle, ...extra });
const curve = (length, angle = 0, bulge = 0.18, extra = {}) => ({
  type: "curve",
  length,
  angle,
  bulge,
  ...extra,
});
const ellipse = (rx, ry) => ({ type: "ellipse", rx, ry });
const hook = (length = 0.45, angle = -20, bulge = 0.18, open = "up") => ({
  type: "hook",
  length,
  angle,
  bulge,
  open,
});
// The o/oo hooks are the lower/upper half of the small ellipse, not a generic curve.
const halfEllipse = (rx = 0.22, ry = 0.18, open = "up", angle = -20) => ({
  type: "half-ellipse",
  rx,
  ry,
  open,
  angle,
});
const dot = (r = 0.06) => ({ type: "dot", r });
const dash = (length = 0.3, angle = 0) => ({ type: "dash", length, angle });
// A diphthong is one continuous stroke; outline.js draws the shape.
const diph = (shape) => ({ type: "diphthong", shape });

const C = (id, phonemes, label, glyph, description, examples, extra = {}) => ({
  id,
  kind: "consonant",
  phonemes,
  label,
  glyph,
  description,
  examples,
  ...extra,
});

const V = (id, family, mark, phonemes, label, glyph, description, examples, extra = {}) => ({
  id,
  kind: "vowel",
  phonemes,
  label,
  family,
  mark,
  glyph,
  description,
  examples,
  ...extra,
});

const D = (id, phonemes, label, glyph, description, examples) => ({
  id,
  kind: "diphthong",
  phonemes,
  label,
  glyph,
  description,
  examples,
});

const G = (id, phonemes, label, glyph, variants, description, examples) => ({
  id,
  kind: "glide",
  phonemes,
  label,
  glyph,
  variants,
  description,
  examples,
});

const B = (id, label, glyph, description, examples) => ({
  id,
  kind: "blend",
  phonemes: [],
  label,
  glyph,
  description,
  examples,
});

export const CONSONANTS = [
  C("p", ["P"], "P", curve(1, 90, -0.2), "Short downward curve, bowing left.", ["put", "up"], {
    direction: "downward",
    length: "short",
    phase: 4,
    variants: { pr: curve(1, 90, -0.34), pl: curve(1, 90, -0.44) },
  }),
  C("b", ["B"], "B", curve(2, 90, -0.2), "Long downward curve, bowing left.", ["be", "by"], {
    direction: "downward",
    length: "long",
    phase: 4,
    variants: { br: curve(2, 90, -0.34), bl: curve(2, 90, -0.44) },
  }),
  C("t", ["T"], "T", line(1, -30), "Short straight stroke, rising to the right.", ["it", "at"], {
    direction: "forward",
    length: "short",
    phase: 1,
  }),
  C("d", ["D"], "D", line(2, -30), "Long straight stroke, rising to the right.", ["do", "day"], {
    direction: "forward",
    length: "long",
    phase: 1,
  }),
  C("ch", ["CH"], "CH", line(1, 135), "Short straight stroke, down and to the left.", ["which", "each"], {
    direction: "downward",
    length: "short",
    phase: 5,
  }),
  C("j", ["JH"], "J", line(2, 135), "Long straight stroke, down and to the left.", ["just", "age"], {
    direction: "downward",
    length: "long",
    phase: 5,
  }),
  C("k", ["K"], "K", curve(1, 0, 0.18, { apex: 0.62 }), "Shallow arch, bowing up, peak to the right.", ["can", "key"], {
    direction: "forward",
    length: "short",
    phase: 2,
    variants: { kr: curve(1, 0, 0.1, { apex: 0.62 }), kl: curve(1, 0, 0.26, { apex: 0.62 }) },
  }),
  C("g", ["G"], "G", curve(2, 0, 0.18, { apex: 0.62 }), "Long shallow arch, bowing up, peak to the right.", ["go", "good"], {
    direction: "forward",
    length: "long",
    phase: 2,
    variants: { gr: curve(2, 0, 0.1, { apex: 0.62 }), gl: curve(2, 0, 0.26, { apex: 0.62 }) },
  }),
  C("f", ["F"], "F", curve(1, 90, 0.2), "Short downward curve, bowing right.", ["for", "if"], {
    direction: "downward",
    length: "short",
    phase: 4,
    variants: { fr: curve(1, 90, 0.1), fl: curve(1, 90, 0.28) },
  }),
  C("v", ["V"], "V", curve(2, 90, 0.2), "Long downward curve, bowing right.", ["have", "very"], {
    direction: "downward",
    length: "long",
    phase: 4,
  }),
  C(
    "th",
    ["TH", "DH"],
    "TH",
    curve(1, -30, 0.1),
    "Shallow rising curve; left- and right-motion forms.",
    ["think", "the"],
    {
      direction: "forward",
      length: "short",
      phase: 5,
      variants: {
        left: curve(1, -30, -0.1),
        right: curve(1, -30, 0.1),
      },
    },
  ),
  C(
    "s",
    ["S", "Z"],
    "S",
    curve(0.5, 90, 0.12, { sCurve: true }),
    "Small curve; left and right join forms.",
    ["is", "so"],
    {
      direction: "downward",
      length: "short",
      phase: 3,
      variants: {
        left: curve(0.5, 90, 0.12, { sCurve: true, mirror: true }),
        right: curve(0.5, 90, 0.12, { sCurve: true }),
        x: curve(0.5, 60, 0.12, { sCurve: true, mirror: true }),
      },
    },
  ),
  C("sh", ["SH", "ZH"], "SH", line(0.6, 115), "Very short straight stroke, steeply down-left.", ["shall", "she"], {
    direction: "downward",
    length: "short",
    phase: 5,
  }),
  C(
    "l",
    ["L"],
    "L",
    curve(2, 0, -0.14, { apex: 0.38 }),
    "Long shallow cup, bowing down, low point to the left.",
    ["look", "all"],
    {
      direction: "forward",
      length: "long",
      phase: 2,
      variants: { ld: curve(2, 0, -0.14, { ld: true, apex: 0.38 }), lk: curve(2, 0, -0.06, { apex: 0.38 }) },
    },
  ),
  C(
    "r",
    ["R", "ER"],
    "R",
    curve(1, 0, -0.14, { apex: 0.38 }),
    "Short shallow cup before a vowel, low point to the left; a small circle after one.",
    ["run", "are"],
    {
      direction: "forward",
      length: "short",
      phase: 2,
      variants: { circle: ellipse(0.16, 0.14), rk: curve(1, 0, -0.06, { apex: 0.38 }) },
    },
  ),
  C("m", ["M"], "M", line(2, 0), "Long horizontal line.", ["me", "am"], {
    direction: "forward",
    length: "long",
    phase: 1,
  }),
  C("n", ["N"], "N", line(1, 0), "Short horizontal line.", ["no", "in"], {
    direction: "forward",
    length: "short",
    phase: 1,
  }),
  C("ng", ["NG"], "NG", line(1, 20), "Shallow down-right stroke.", ["sing", "long"], {
    direction: "downward",
    length: "short",
    phase: 6,
  }),
  C("nk", ["NG", "K"], "NK", line(2, 20), "Long shallow down-right stroke.", ["think", "bank"], {
    direction: "downward",
    length: "long",
    phase: 6,
  }),
  C("h", ["HH"], "H", dot(0.06), "A dot placed at the vowel.", ["he", "have"], {
    direction: "none",
    length: "none",
    phase: 3,
  }),
];

export const VOWELS = [
  V("a1", "a", "none", ["AE"], "A (at)", ellipse(0.42, 0.36), "Large circle, plain.", ["at", "man"], {
    phase: 1,
    length: "short",
  }),
  V("a2", "a", "dot", ["AA"], "A (art)", ellipse(0.42, 0.36), "Large circle with a dot below.", ["art", "car"], {
    phase: 9,
    length: "broad",
  }),
  V("a3", "a", "tick", ["EY"], "A (ale)", ellipse(0.42, 0.36), "Large circle with a tick below.", ["ale", "make"], {
    phase: 8,
    length: "long",
  }),
  V("e1", "e", "none", ["IH"], "E (it)", ellipse(0.2, 0.18), "Small circle, plain.", ["it", "sit"], {
    phase: 1,
    length: "short",
  }),
  V("e2", "e", "dot", ["EH"], "E (bet)", ellipse(0.2, 0.18), "Small circle with a dot below.", ["bet", "bed"], {
    phase: 9,
    length: "broad",
  }),
  V("e3", "e", "tick", ["IY"], "E (eat)", ellipse(0.2, 0.18), "Small circle with a tick below.", ["eat", "team"], {
    phase: 8,
    length: "long",
  }),
  V("o1", "o", "none", ["AA", "AO"], "O (on)", halfEllipse(0.22, 0.18, "up", -20), "Small hook, opening up.", ["on", "dog"], {
    phase: 2,
    length: "short",
  }),
  V("o2", "o", "dot", ["AO"], "O (all)", halfEllipse(0.22, 0.18, "up", -20), "Small hook with a dot below.", ["all", "call"], {
    phase: 9,
    length: "broad",
  }),
  V("o3", "o", "tick", ["OW"], "O (old)", halfEllipse(0.22, 0.18, "up", -20), "Small hook with a tick below.", ["old", "home"], {
    phase: 8,
    length: "long",
  }),
  V("u1", "u", "none", ["AH", "AH0"], "U (up)", halfEllipse(0.22, 0.18, "down", 20), "Small hook, opening down.", ["up", "sun"], {
    phase: 3,
    length: "short",
  }),
  V("u2", "u", "dot", ["UH"], "U (book)", halfEllipse(0.22, 0.18, "down", 20), "Small hook with a dot below.", ["book", "put"], {
    phase: 9,
    length: "broad",
  }),
  V("u3", "u", "tick", ["UW"], "U (food)", halfEllipse(0.22, 0.18, "down", 20), "Small hook with a tick below.", ["food", "do"], {
    phase: 8,
    length: "long",
  }),
];

export const DIPHTHONGS = [
  D(
    "ai",
    ["AY"],
    "AI (isle)",
    diph("ai"),
    "Large circle flowing into a small closing loop at its upper right.",
    ["isle", "my"],
  ),
  D(
    "ow",
    ["AW"],
    "OW (owl)",
    diph("ow"),
    "Large circle sweeping up into the OO hook at its upper right.",
    ["owl", "how"],
  ),
  D(
    "oi",
    ["OY"],
    "OI (oil)",
    diph("oi"),
    "O hook sweeping up into a small closing loop at its upper right.",
    ["oil", "boy"],
  ),
  D(
    "yu",
    ["Y", "UW"],
    "YU (unit)",
    diph("yu"),
    "Small circle sweeping up into the OO hook at its upper right.",
    ["unit", "you"],
  ),
];

export const GLIDES = [
  G(
    "w",
    ["W"],
    "W",
    hook(0.45, -30, 0.18, "up"),
    { initial: hook(0.45, -30, 0.18, "up"), final: hook(0.45, -30, 0.18, "up"), medial: dash(0.35, 0) },
    "Oo-hook initially and finally; a dash under the following vowel medially.",
    ["we", "way"],
  ),
  G(
    "y",
    ["Y"],
    "Y",
    ellipse(0.18, 0.16),
    {
      initial: ellipse(0.18, 0.16),
      ye: hook(0.32, -40, 0.14, "up"),
      ya: hook(0.42, -20, 0.2, "up"),
    },
    "Small circle before a hook vowel; small loop for ye, large loop for ya.",
    ["yes", "you"],
  ),
];

export const BLENDS = [
  // The -nt/-nd and -mt/-md blends are upward curves like f/v: a cup that rises
  // from the bottom of the preceding circle (p89 §133-134).
  B("blend-ten", "T/D + N", curve(1, -40, -0.2), "Short upward curve, as in ten and den.", ["ten", "den"]),
  B("blend-ent", "N + T/D", curve(1.1, -45, -0.22), "Short upward curve, as in ent and end.", ["ent", "end"]),
  B("blend-tem", "T/D + M", curve(2, -40, -0.2), "Long upward curve, as in tem and dem.", ["stem", "dem"]),
  B("blend-emt", "M + T/D", curve(2.1, -45, -0.22), "Long upward curve, as in emt and emd.", ["empt", "emd"]),
  B("blend-tive", "T/D + F/V", { type: "loop", rx: 0.26, ry: 0.42 }, "Large loop blend, as in tive and def-v.", ["active", "tive"]),
  B("blend-pent", "P/J + NT/D", { type: "loop", rx: 0.22, ry: 0.3 }, "Small loop blend, as in pent-d and jent-d.", ["spend", "gent"]),
];

const withPhase = (units, phase, prerequisites = []) =>
  units.map((unit) => ({ ...unit, phase, prerequisites }));

const phases = [
  ["n", "m", "t", "d", "a1", "e1"],
  ["k", "g", "r", "l", "o1"],
  ["s", "u1", "h"],
  ["p", "b", "f", "v"],
  ["ch", "j", "sh", "th"],
  ["ng", "nk", "w", "y"],
  ["ai", "ow", "oi", "yu"],
  ["a3", "e3", "o3", "u3"],
  ["a2", "e2", "o2", "u2"],
  BLENDS.map((unit) => unit.id),
];

// Phase and prerequisite metadata, applied once so definitions stay terse.
const byId = new Map(
  [...CONSONANTS, ...VOWELS, ...DIPHTHONGS, ...GLIDES, ...BLENDS].map((unit) => [unit.id, unit]),
);
phases.forEach((ids, index) => {
  const phase = index + 1;
  const previous = index === 0 ? [] : phases[index - 1];
  ids.forEach((id) => {
    const unit = byId.get(id);
    if (!unit) throw new Error(`Unknown unit in curriculum: ${id}`);
    unit.phase = phase;
    unit.prerequisites = previous;
  });
});

export const LEARNED_UNITS = [...CONSONANTS, ...VOWELS, ...DIPHTHONGS, ...GLIDES];

export const UNITS = [...LEARNED_UNITS, ...BLENDS];

export const UNIT_BY_ID = Object.fromEntries(UNITS.map((unit) => [unit.id, unit]));

// Core mode uses family shapes; the precise sign still travels in the word record.
export const CORE_ALIAS = {
  a1: "a",
  a2: "a",
  a3: "a",
  e1: "e",
  e2: "e",
  e3: "e",
  o1: "o",
  o2: "o",
  o3: "o",
  u1: "u",
  u2: "u",
  u3: "u",
};

export const CORE_VOWEL_BY_FAMILY = { a: "a1", e: "e1", o: "o1", u: "u1" };

export const VOWEL_BY_FAMILY = {
  a: ["a1", "a2", "a3"],
  e: ["e1", "e2", "e3"],
  o: ["o1", "o2", "o3"],
  u: ["u1", "u2", "u3"],
};

// Core word records use bare family ids for vowels; resolve them to a real sign.
export function unitFor(id) {
  return UNIT_BY_ID[id] || UNIT_BY_ID[CORE_VOWEL_BY_FAMILY[id]] || null;
}

export const PHASES = phases.map((ids, index) => ({
  number: index + 1,
  name: [
    "Foundations",
    "Core expansion",
    "Sibilants & H",
    "Labials",
    "Affricates",
    "Nasals & glides",
    "Diphthongs",
    "Precision I — long vowels",
    "Precision II — broad/short vowels",
    "Fluency",
  ][index],
  units: ids,
}));

export function isVowel(id) {
  return id === "a" || id === "e" || id === "o" || id === "u" || Boolean(UNIT_BY_ID[id]?.family);
}

export function isDiphthong(id) {
  return UNIT_BY_ID[id]?.kind === "diphthong";
}

export function isGlide(id) {
  return UNIT_BY_ID[id]?.kind === "glide";
}

export function isConsonant(id) {
  return UNIT_BY_ID[id]?.kind === "consonant";
}

export function isOrnament(id) {
  return isVowel(id) || isDiphthong(id) || isGlide(id);
}

export function displayUnit(id, track = "core") {
  if (track === "core" && CORE_ALIAS[id]) return CORE_ALIAS[id];
  return id;
}

export function glyphFor(id, variant) {
  const unit = UNIT_BY_ID[id];
  if (!unit) return null;
  if (variant && unit.variants && unit.variants[variant]) return unit.variants[variant];
  return unit.glyph;
}

export function familyOf(id) {
  return UNIT_BY_ID[id]?.family || (CORE_VOWEL_BY_FAMILY[id] ? id : null);
}
