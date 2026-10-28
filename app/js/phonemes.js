// ARPAbet -> Gregg units, including the special sequences and the A/O split.
import { CORE_ALIAS, VOWEL_BY_FAMILY } from "./units.js";

const CONSONANT_MAP = {
  B: "b",
  CH: "ch",
  D: "d",
  DH: "th",
  F: "f",
  G: "g",
  HH: "h",
  JH: "j",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "ng",
  P: "p",
  R: "r",
  S: "s",
  SH: "sh",
  T: "t",
  TH: "th",
  V: "v",
  W: "w",
  Y: "y",
  Z: "s",
  ZH: "sh",
};

const VOWEL_MAP = {
  AE: "a1",
  AH: "u1",
  AH0: "u1",
  EH: "e2",
  EY: "a3",
  IH: "e1",
  IY: "e3",
  OW: "o3",
  OY: "oi",
  UH: "u2",
  UW: "u3",
  AW: "ow",
  AY: "ai",
  ER: "r",
};

// General American merges art and on. These lists keep the Gregg distinction.
const SHORT_O = new Set(
  `hot dog log rock on not top stop box fox lot dot pot cot cop god nod rod sod sodden
   job rob sob cob mob bob fog hog jog bog clog blog flog smog shop chop crop drop prop
   stock block clock flock shock smock slot plot clot blot knot spot trot what wash
   boss loss moss toss cross gloss frost cost lost soft loft off often long song strong
   wrong along belong body everybody nobody somebody dollar follow model modern office
   offer coffee doctor hospital politics policy profit program problem problems possible
   possibly probably promise project process product provide proper property response
   responsible doctor common mom mommy pop mom rock sock lock dock mock knock cop top
   stopped stopping shopping dropped dropping`
    .split(/\s+/)
    .filter(Boolean),
);

const SHORT_O_PREFIX = /^(pro|con|com|prob|prod|proj|prom|prop|prov|proc|pol|sol|vol|doc|roc|soc|eco|nov|mod)/;

const AW_WORDS = new Set(
  `all call fall ball hall mall tall wall small stall stall talk walk chalk stalk
   water daughter slaughter caught taught naught fought bought brought thought
   law saw raw draw straw claw thaw awe jaw paw`
    .split(/\s+/)
    .filter(Boolean),
);

const ART_WORDS = new Set(
  `art cart dart part start smart chart heart hard card yard barn dark mark park
   farm harm arm car far jar star tar bar scar spar arch march starch large charge
   garden market party army`
    .split(/\s+/)
    .filter(Boolean),
);

const stripStress = (phone) => phone.replace(/\d/g, "");

export function arpabetToUnits(arpabet, word = "") {
  const phones = arpabet.map(stripStress);
  const full = [];
  const tags = [];
  const lower = word.toLowerCase();

  for (let i = 0; i < phones.length; i += 1) {
    const phone = phones[i];
    const next = phones[i + 1];
    const prev = phones[i - 1];

    // Syllabic consonant: AH0 + L/M/N at the end of a syllable loses the schwa.
    if (
      arpabet[i] === "AH0" &&
      (next === "L" || next === "M" || next === "N") &&
      (i + 2 >= phones.length || !isVowelPhone(phones[i + 2]))
    ) {
      tags.push("syllabic");
      continue;
    }

    if (phone === "NG" && next === "K") {
      full.push("nk");
      tags.push("nk");
      i += 1;
      continue;
    }

    if (phone === "K" && next === "S") {
      full.push("s");
      tags.push("x-form");
      i += 1;
      continue;
    }

    if (phone === "K" && next === "W") {
      full.push("k", "w");
      tags.push("medial-w");
      i += 1;
      continue;
    }

    if (phone === "Y" && next === "UW" && i === 0) {
      full.push("yu");
      tags.push("yu");
      i += 1;
      continue;
    }

    if (phone === "AA" || phone === "AO") {
      const unit = splitAO(phone, lower);
      full.push(unit);
      tags.push(unit === "o1" ? "short-o" : "broad-a");
      continue;
    }

    if (phone === "ER") {
      full.push("r");
      tags.push("postvocalic-r");
      continue;
    }

    if (VOWEL_MAP[phone]) {
      full.push(VOWEL_MAP[phone]);
      if (phone === "AH0") tags.push("schwa");
      continue;
    }

    if (CONSONANT_MAP[phone]) {
      full.push(CONSONANT_MAP[phone]);
      continue;
    }

    // Unknown phone: skip rather than emit a broken outline.
    tags.push(`unknown:${phone}`);
  }

  const core = full.map((unit) => CORE_ALIAS[unit] || unit);
  return { core, full, tags };
}

function splitAO(phone, word) {
  const cvcO = /^[b-df-hj-np-tv-z]*o[b-df-hj-np-tv-z]*$/.test(word);
  const shortO = SHORT_O.has(word) || SHORT_O_PREFIX.test(word);
  if (phone === "AO") {
    if (word.includes("or") || word.includes("aw") || word.endsWith("all") || AW_WORDS.has(word)) return "o2";
    if (cvcO || shortO) return "o1";
    return "o2";
  }
  if (ART_WORDS.has(word) || word.includes("ar")) return "a2";
  if (cvcO || shortO) return "o1";
  return "a2";
}

function isVowelPhone(phone) {
  return Boolean(VOWEL_MAP[phone]) || phone === "AA" || phone === "AO" || phone === "ER";
}

export function syllableCount(arpabet) {
  return arpabet.map(stripStress).filter(isVowelPhone).length;
}

export function unitsForTrack(record, track = "core") {
  return track === "core" ? record.core : record.full;
}

export function makeRecord(word, arpabet, { tier = 3, synthetic = false } = {}) {
  const { core, full, tags } = arpabetToUnits(arpabet, word);
  return {
    w: word,
    arpabet,
    core,
    full,
    tier,
    ...(tags.length ? { tags: [...new Set(tags)] } : {}),
    ...(synthetic ? { synthetic: true } : {}),
  };
}

// Explorer fallback: a rough, explicitly unverified grapheme -> unit outline.
const LETTER_UNITS = {
  a: "a",
  b: "b",
  c: "k",
  d: "d",
  e: "e",
  f: "f",
  g: "g",
  h: "h",
  i: "e",
  j: "j",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  o: "o",
  p: "p",
  q: "k",
  r: "r",
  s: "s",
  t: "t",
  u: "u",
  v: "v",
  w: "w",
  x: "s",
  y: "y",
  z: "s",
};

const LETTER_DIGRAPHS = [
  ["tch", "ch"],
  ["ch", "ch"],
  ["sh", "sh"],
  ["th", "th"],
  ["ph", "f"],
  ["wh", "w"],
  ["ck", "k"],
  ["ng", "ng"],
  ["nk", "nk"],
  ["qu", "k"],
  ["oo", "u"],
  ["ee", "e"],
  ["ea", "e"],
  ["ai", "ai"],
  ["ay", "ai"],
  ["oi", "oi"],
  ["oy", "oi"],
  ["ou", "ow"],
  ["ow", "ow"],
];

export function heuristicRecord(word) {
  const lower = word.toLowerCase().replace(/[^a-z]/g, "");
  const units = [];
  for (let i = 0; i < lower.length; i += 1) {
    const two = lower.slice(i, i + 2);
    const three = lower.slice(i, i + 3);
    const match = LETTER_DIGRAPHS.find(([grapheme]) => three === grapheme || two === grapheme);
    if (match) {
      units.push(match[1]);
      i += match[0].length - 1;
      continue;
    }
    if (LETTER_UNITS[lower[i]]) units.push(LETTER_UNITS[lower[i]]);
  }
  return {
    w: lower,
    arpabet: [],
    core: units,
    full: units,
    tier: 5,
    tags: ["heuristic"],
    unverified: true,
  };
}

export function vowelFamilyFor(unit) {
  for (const [family, signs] of Object.entries(VOWEL_BY_FAMILY)) {
    if (signs.includes(unit)) return family;
  }
  return CORE_ALIAS[unit] || null;
}
