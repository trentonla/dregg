// Pure session engine: eligibility, focus weighting, mastery, unlocks.
// No DOM and no storage here, so the whole learning loop is testable in Node.
import { CORE_ALIAS, UNIT_BY_ID, VOWEL_BY_FAMILY } from "./units.js";
import { resolveUnits } from "./combinations.js";
import { activePhases } from "./curriculum.js";
import { LEXICON } from "./data/lexicon.js";
import { createRng } from "./rng.js";
import { gradeDrill, gradeRead } from "./grader.js";

export const EMA_ALPHA = 0.3;
export const UNLOCK_ATTEMPTS = 8;
export const UNLOCK_MASTERY = 0.9;
export const MASTERY_ATTEMPTS = 8;
export const RECENT_WORDS = 20;

const CANONICAL = { a: "a1", e: "e1", o: "o1", u: "u1" };

export function canonicalUnit(id) {
  return CANONICAL[id] || id;
}

export function wordUnits(record, track = "core") {
  if (!record) return [];
  return track === "core" ? record.core || [] : record.full || record.core || [];
}

// Units actually drawn for a word, after contractions. Blends are drawn only
// when the learner has unlocked them; otherwise the word uses separate strokes.
export function drawnUnits(record, track = "core", blends = false) {
  return resolveUnits(wordUnits(record, track), record?.w || "", { blends }).units;
}

export function unlockedBlends(progress, track = "core") {
  return new Set(
    trackUnits(track).filter((id) => UNIT_BY_ID[id]?.kind === "blend" && isUnitUnlocked(progress, id, track)),
  );
}

export function trackUnits(track = "core") {
  const seen = new Set();
  const out = [];
  for (const phase of activePhases(track)) {
    for (const id of phase.units) {
      const key = canonicalUnit(id);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

export function unitStat(progress, id) {
  const key = canonicalUnit(id);
  if (!progress.units[key]) {
    progress.units[key] = {
      attempts: 0,
      correct: 0,
      ema: 0.5,
      soundEma: 0.5,
      formEma: 0.5,
      lastSeen: null,
      unlocked: false,
    };
  }
  return progress.units[key];
}

export function isUnitUnlocked(progress, id, track = "core") {
  const key = canonicalUnit(id);
  if (progress.units[key]?.unlocked) return true;
  if (track === "core") {
    const family = UNIT_BY_ID[key]?.family;
    return Boolean(family && progress.units[CANONICAL[family]]?.unlocked);
  }
  return false;
}

export function ensureProgress(progress, track = progress.track || "core") {
  if (!progress.createdAt) progress.createdAt = new Date().toISOString();
  if (!progress.streak) progress.streak = { current: 0, best: 0, lastDay: null };
  if (!Array.isArray(progress.recentWords)) progress.recentWords = [];
  if (!Array.isArray(progress.recentTrials)) progress.recentTrials = [];

  const unlocked = trackUnits(track).some((id) => isUnitUnlocked(progress, id, track));
  if (!unlocked) {
    const first = activePhases(track)[0];
    for (const id of first?.units || []) {
      unitStat(progress, id).unlocked = true;
    }
  }
  return progress;
}

export function unitMastery(progress, id, track = "core") {
  const key = canonicalUnit(id);
  const stat = progress.units[key];
  if (!stat) return 0;
  const family = UNIT_BY_ID[key]?.family;
  const base = family ? (track === "core" ? stat.soundEma : stat.formEma) : stat.ema;
  return Math.max(0, Math.min(1, base * Math.min(1, stat.attempts / MASTERY_ATTEMPTS)));
}

export function masterySummary(progress, track = "core") {
  const rows = trackUnits(track).map((id) => {
    const stat = progress.units[id] || null;
    return {
      id,
      label: UNIT_BY_ID[id]?.label || id,
      kind: UNIT_BY_ID[id]?.kind || "consonant",
      family: UNIT_BY_ID[id]?.family || null,
      unlocked: isUnitUnlocked(progress, id, track),
      attempts: stat?.attempts || 0,
      correct: stat?.correct || 0,
      mastery: unitMastery(progress, id, track),
    };
  });
  const unlocked = rows.filter((row) => row.unlocked);
  return {
    rows,
    total: rows.length,
    unlocked: unlocked.length,
    mastered: unlocked.filter((row) => row.mastery >= UNLOCK_MASTERY && row.attempts >= UNLOCK_ATTEMPTS).length,
    average: unlocked.length ? unlocked.reduce((sum, row) => sum + row.mastery, 0) / unlocked.length : 0,
  };
}

export function weakestUnits(progress, track = "core", count = 3) {
  return masterySummary(progress, track)
    .rows.filter((row) => row.unlocked)
    .sort((a, b) => a.mastery - b.mastery || b.attempts - a.attempts)
    .slice(0, count);
}

export function nextUnit(progress, track = "core") {
  return trackUnits(track).find((id) => !isUnitUnlocked(progress, id, track)) || null;
}

export function unlockReady(progress, track = "core") {
  const rows = masterySummary(progress, track).rows.filter((row) => row.unlocked);
  if (!rows.length) return null;
  const candidate = nextUnit(progress, track);
  if (!candidate) return null;
  if (!rows.every((row) => row.attempts >= UNLOCK_ATTEMPTS && row.mastery >= UNLOCK_MASTERY)) return null;
  const weakest = rows.slice().sort((a, b) => a.mastery - b.mastery)[0];
  const recent = (progress.recentTrials || []).slice(-10);
  const seen = recent.filter((trial) => trial.map(canonicalUnit).includes(weakest.id)).length;
  if (seen < 2) return null;
  return candidate;
}

export function eligibleWords(
  progress,
  lexicon = LEXICON,
  track = "core",
  { blends = unlockedBlends(progress, track) } = {},
) {
  const unlocked = new Set(trackUnits(track).filter((id) => isUnitUnlocked(progress, id, track)));
  return lexicon.filter((record) => {
    if (!record || record.unverified) return false;
    const units = drawnUnits(record, track, blends).map(canonicalUnit);
    return Boolean(units.length) && units.every((unit) => unlocked.has(unit));
  });
}

function creditUnits(progress, units, track, correct, now) {
  const stamp = correct ? 1 : 0;
  for (const unit of new Set(units.map(canonicalUnit))) {
    const stat = unitStat(progress, unit);
    stat.attempts += 1;
    if (correct) stat.correct += 1;
    stat.lastSeen = now;
    const family = UNIT_BY_ID[unit]?.family;
    if (family) {
      stat.soundEma = EMA_ALPHA * stamp + (1 - EMA_ALPHA) * stat.soundEma;
      stat.ema = stat.soundEma;
      if (track === "precision") {
        stat.formEma = EMA_ALPHA * stamp + (1 - EMA_ALPHA) * stat.formEma;
      }
      // Core practice teaches the family sound; Precision still has to earn
      // the exact mark through formEma and its own attempts.
      if (track === "core") {
        for (const variant of VOWEL_BY_FAMILY[family] || []) {
          if (variant === unit) continue;
          const sibling = unitStat(progress, variant);
          sibling.soundEma = EMA_ALPHA * stamp + (1 - EMA_ALPHA) * sibling.soundEma;
          sibling.ema = sibling.soundEma;
        }
      }
    } else {
      stat.ema = EMA_ALPHA * stamp + (1 - EMA_ALPHA) * stat.ema;
    }
  }
  progress.recentTrials.push([...new Set(units.map(canonicalUnit))]);
  progress.recentTrials = progress.recentTrials.slice(-10);
}

function chooseDrill(progress, track, focus, rng) {
  const options = trackUnits(track).filter((id) => isUnitUnlocked(progress, id, track));
  const distractors = rng.shuffle(options.filter((id) => id !== focus)).slice(0, 3);
  return {
    answer: focus,
    options: rng.shuffle([focus, ...distractors]).map((id) => ({
      id,
      label: UNIT_BY_ID[id]?.label || id,
    })),
  };
}

const modeCycle = {
  read: ["read"],
  write: ["write"],
  mixed: ["read", "write", "drill", "read", "trace"],
};

export function createSession({
  progress,
  lexicon = LEXICON,
  track = progress.track || "core",
  settings = {},
  seed = Date.now(),
  now = new Date().toISOString(),
  focusUnit = null,
} = {}) {
  ensureProgress(progress, track);
  const rng = createRng(seed);
  const length = Math.max(5, Math.min(30, Math.round(settings.sessionLength || 15)));
  const blends = unlockedBlends(progress, track);
  const eligible = eligibleWords(progress, lexicon, track, { blends });
  const unlocked = trackUnits(track).filter((id) => isUnitUnlocked(progress, id, track));
  const requested = focusUnit ? canonicalUnit(focusUnit) : null;
  const focus =
    (requested && unlocked.includes(requested) ? requested : null) ||
    weakestUnits(progress, track, 1)[0]?.id ||
    unlocked[0] ||
    null;

  const modes = modeCycle[settings.modeMix] || modeCycle.mixed;
  const items = [];
  const recent = [...(progress.recentWords || [])];
  const recentSet = new Set(recent);
  const focusMatches = (record) => drawnUnits(record, track, blends).map(canonicalUnit).includes(focus);

  for (let index = 0; index < length; index += 1) {
    if (!eligible.length) break;
    const mode = modes[index % modes.length];
    let pool = eligible.filter((record) => !recentSet.has(record.w));
    if (pool.length < 5) pool = eligible;
    const focusPool = pool.filter(focusMatches);
    const forceFocus = index % 3 === 2 && focusPool.length > 0;
    const source = forceFocus ? focusPool : pool;
    const record = rng.weighted(source, (word) => {
      const units = drawnUnits(word, track, blends).map(canonicalUnit);
      const focusBonus = units.includes(focus) ? 5 : 0;
      const tierBonus = word.tier <= 2 ? 1.5 : word.tier === 3 ? 0.5 : 0;
      const lengthBonus = units.length <= 6 ? 0.75 : 0;
      const weakest = Math.min(...units.map((unit) => unitMastery(progress, unit, track)));
      return 1 + focusBonus + tierBonus + lengthBonus + (1 - weakest) * 0.5;
    });

    const units = drawnUnits(record, track, blends);
    const item = {
      id: `${seed}-${index}`,
      index,
      word: record,
      mode,
      track,
      focusUnit: focus,
      units: mode === "drill" ? [focus] : units,
      ...(mode === "drill" ? { drill: chooseDrill(progress, track, focus, rng) } : {}),
    };
    items.push(item);
    recent.push(record.w);
    recentSet.add(record.w);
    if (recent.length > RECENT_WORDS) recentSet.delete(recent.shift());
  }

  return {
    id: `s-${seed}`,
    seed,
    track,
    blends: [...blends],
    items,
    index: 0,
    results: [],
    startedAt: now,
    focusUnit: focus,
    unlockCandidate: unlockReady(progress, track),
    finished: false,
  };
}

export function recordResult(progress, session, result, { now = new Date().toISOString() } = {}) {
  const item = session.items[session.index];
  if (!item) return null;
  const correct = Boolean(result?.correct);
  creditUnits(progress, item.units, session.track, correct, now);
  progress.recentWords.push(item.word.w);
  progress.recentWords = progress.recentWords.slice(-RECENT_WORDS);
  const entry = {
    itemId: item.id,
    // A drill is about one stroke, not the word it was attached to.
    word: item.mode === "drill" ? item.drill?.answer || item.word.w : item.word.w,
    mode: item.mode,
    correct,
    answer: result?.answer ?? "",
    score: Number.isFinite(result?.score) ? result.score : null,
    at: now,
  };
  session.results.push(entry);
  return entry;
}

export function advanceSession(session) {
  if (session.index < session.items.length) session.index += 1;
  return session.index;
}

export function sessionAccuracy(session) {
  if (!session.results.length) return 0;
  return session.results.filter((result) => result.correct).length / session.results.length;
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function updateStreak(progress, now) {
  const today = dayKey(now);
  const streak = progress.streak;
  if (streak.lastDay === today) return;
  const yesterday = dayKey(new Date(new Date(now).getTime() - 86400000));
  streak.current = streak.lastDay === yesterday ? streak.current + 1 : 1;
  streak.best = Math.max(streak.best, streak.current);
  streak.lastDay = today;
}

export function finishSession(progress, session, { now = new Date().toISOString() } = {}) {
  if (session.finished) return session.summary || null;
  session.finished = true;
  const accuracy = sessionAccuracy(session);
  const candidate = unlockReady(progress, session.track);
  let unlocked = null;
  if (candidate && accuracy >= 0.8) {
    unitStat(progress, candidate).unlocked = true;
    unlocked = candidate;
  }
  const summary = {
    id: session.id,
    date: now,
    track: session.track,
    items: session.results.length,
    correct: session.results.filter((result) => result.correct).length,
    accuracy,
    durationMs: Math.max(0, new Date(now).getTime() - new Date(session.startedAt).getTime()),
    focusUnit: session.focusUnit,
    unlocked,
    modes: [...new Set(session.results.map((result) => result.mode))],
  };
  updateStreak(progress, now);
  progress.sessions.push(summary);
  progress.sessions = progress.sessions.slice(-200);
  session.summary = summary;
  return summary;
}

export function gradeItem(item, answer, lexicon = LEXICON, overrides = {}) {
  if (item.mode === "read") return gradeRead(answer, item, lexicon, overrides);
  if (item.mode === "drill") return gradeDrill(answer, item);
  return { correct: Boolean(answer?.correct), expected: item.word?.w || "" };
}

export function recommendation(summary, progress, track = "core") {
  if (!summary) return "";
  if (summary.unlocked) {
    const unit = UNIT_BY_ID[summary.unlocked];
    return `New stroke: ${unit?.label || summary.unlocked}. ${unit?.description || ""}`.trim();
  }
  if (summary.accuracy < 0.7) return "Try a shorter session, and reveal the outline when you are unsure.";
  const weakest = weakestUnits(progress, track, 1)[0];
  if (weakest) return `Keep going. Your weakest stroke is ${weakest.label}.`;
  return "Keep going.";
}

export { CORE_ALIAS };
