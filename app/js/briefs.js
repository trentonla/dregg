// Brief forms are memorized whole-word abbreviations, not generated from
// sounds (Ann §23). Each entry stores the strokes the manual prints, so the
// renderer never has to guess a brief from phonemes.
import { resolveUnits } from "./combinations.js";
import { outlineForWord } from "./outline.js";

export const BRIEF_FORMS = [
  { id: "bf_the", words: ["the"], units: ["th"], hint: "The th sign stands for “the”." },
  { id: "bf_and", words: ["and"], units: ["n", "d"], hint: "The n–d blend stands for “and”." },
  { id: "bf_of", words: ["of"], units: ["o1"], hint: "The o sign stands for “of”." },
  { id: "bf_to", words: ["to", "too", "two"], units: ["t", "u3"], hint: "t plus the oo hook stands for “to”." },
];

export function briefById(id) {
  return BRIEF_FORMS.find((brief) => brief.id === id) || null;
}

// A lexicon-shaped record so brief items reuse the normal read/write rendering.
export function briefRecord(brief, { blends = true } = {}) {
  const units = resolveUnits(brief.units, brief.words[0], { blends }).units;
  return { w: brief.words[0], core: units, full: units, tier: 1, brief: brief.id };
}

export function outlineForBrief(brief, track = "core", options = {}) {
  return outlineForWord(briefRecord(brief, options), track, options);
}
