// Curriculum phases, track projection, and unlock order.
import { CORE_ALIAS, PHASES, UNIT_BY_ID, VOWEL_BY_FAMILY } from "./units.js";

// Fluency (phase 10) is shared: blends are taught once the track's own phases are done.
const TRACK_PHASES = {
  core: [1, 2, 3, 4, 5, 6, 7, 10],
  precision: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

function phasesFor(track = "core") {
  const numbers = TRACK_PHASES[track] || TRACK_PHASES.core;
  return PHASES.filter((phase) => numbers.includes(phase.number));
}

export function projectUnit(id, track = "core") {
  if (track === "core" && CORE_ALIAS[id]) return CORE_ALIAS[id];
  return id;
}

export function unitForTrack(id, track = "core") {
  return projectUnit(id, track);
}

export function trackUnitIds(track = "core") {
  const ids = [];
  for (const phase of phasesFor(track)) {
    for (const id of phase.units) {
      const projected = projectUnit(id, track);
      if (!ids.includes(projected)) ids.push(projected);
    }
  }
  return ids;
}

export function activePhases(track = "core") {
  return phasesFor(track).map((phase) => ({
    ...phase,
    units: phase.units.map((id) => projectUnit(id, track)),
  }));
}

export function initialUnlocked(track = "core") {
  return activePhases(track)[0].units;
}

export function unlockOrder(track = "core") {
  return trackUnitIds(track);
}

export function phaseOfUnit(id, track = "core") {
  for (const phase of activePhases(track)) {
    if (phase.units.includes(id)) return phase.number;
  }
  return null;
}

export function unitIdsForPhase(number, track = "core") {
  const phase = activePhases(track).find((entry) => entry.number === number);
  return phase ? phase.units : [];
}

export function isPrecisionUnit(id) {
  const unit = UNIT_BY_ID[id];
  return Boolean(unit?.family && unit.mark !== "none");
}

export function vowelSignsForFamily(family) {
  return VOWEL_BY_FAMILY[family] || [];
}

export function curriculumFor(track = "core") {
  return activePhases(track);
}
