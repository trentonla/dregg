// Versioned localStorage access. Nothing else in the app touches localStorage.
// Every read is validated; corrupt or partial data falls back to defaults.

export const VERSION = 2;
export const KEYS = {
  settings: "dregg.v2.settings",
  progress: "dregg.v2.progress",
  history: "dregg.v2.history",
};

// The question types the learner can switch on. Order is the cycle order.
export const PRACTICE_MODES = ["read", "write", "trace", "drill"];

export const DEFAULT_SETTINGS = {
  version: VERSION,
  onboardingDone: false,
  sessionLength: 15,
  modes: [...PRACTICE_MODES],
  dailyGoal: 10,
  sound: false,
  theme: "system",
  haptics: true,
  recentWords: [],
  updatedAt: null,
};

export const DEFAULT_PROGRESS = {
  version: VERSION,
  createdAt: null,
  track: "core",
  units: {},
  sessions: [],
  streak: { current: 0, best: 0, lastDay: null },
  recentWords: [],
  recentTrials: [],
};

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const number = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const bool = (value, fallback = false) => (typeof value === "boolean" ? value : fallback);
const oneOf = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const stringOrNull = (value) => (typeof value === "string" && value ? value : null);
const arrayOfStrings = (value, limit = 40) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string").slice(-limit) : [];

export function sanitizeSettings(raw) {
  const input = isObject(raw) ? raw : {};
  // modeMix is the pre-modes shape; map it once so existing backups keep working.
  const legacy = { read: ["read"], write: ["write"], mixed: PRACTICE_MODES }[input.modeMix];
  const modes = Array.isArray(input.modes)
    ? PRACTICE_MODES.filter((mode) => input.modes.includes(mode))
    : legacy || [];
  return {
    version: VERSION,
    onboardingDone: bool(input.onboardingDone, DEFAULT_SETTINGS.onboardingDone),
    sessionLength: clamp(number(input.sessionLength, DEFAULT_SETTINGS.sessionLength), 5, 30),
    modes: modes.length ? modes : [...PRACTICE_MODES],
    dailyGoal: oneOf(number(input.dailyGoal, DEFAULT_SETTINGS.dailyGoal), [5, 10, 15], DEFAULT_SETTINGS.dailyGoal),
    sound: bool(input.sound, DEFAULT_SETTINGS.sound),
    theme: oneOf(input.theme, ["system", "light", "dark"], DEFAULT_SETTINGS.theme),
    haptics: bool(input.haptics, DEFAULT_SETTINGS.haptics),
    recentWords: arrayOfStrings(input.recentWords, 12),
    updatedAt: stringOrNull(input.updatedAt),
  };
}

function sanitizeUnitStat(raw) {
  const input = isObject(raw) ? raw : {};
  const attempts = Math.max(0, Math.round(number(input.attempts)));
  const correct = clamp(Math.round(number(input.correct)), 0, attempts);
  const ema = clamp(number(input.ema, 0.5), 0, 1);
  return {
    attempts,
    correct,
    ema,
    soundEma: clamp(number(input.soundEma, ema), 0, 1),
    formEma: clamp(number(input.formEma, 0.5), 0, 1),
    lastSeen: stringOrNull(input.lastSeen),
    unlocked: bool(input.unlocked),
  };
}

function sanitizeSession(raw) {
  const input = isObject(raw) ? raw : {};
  return {
    id: typeof input.id === "string" ? input.id : "",
    date: typeof input.date === "string" ? input.date : new Date(0).toISOString(),
    track: oneOf(input.track, ["core", "precision"], "core"),
    items: Math.max(0, Math.round(number(input.items))),
    correct: Math.max(0, Math.round(number(input.correct))),
    accuracy: clamp(number(input.accuracy), 0, 1),
    durationMs: Math.max(0, Math.round(number(input.durationMs))),
    focusUnit: stringOrNull(input.focusUnit),
    unlocked: stringOrNull(input.unlocked),
    modes: arrayOfStrings(input.modes, 6),
  };
}

export function sanitizeProgress(raw) {
  const input = isObject(raw) ? raw : {};
  const units = {};
  if (isObject(input.units)) {
    for (const [id, stat] of Object.entries(input.units)) {
      if (!/^[a-z0-9-]{1,20}$/.test(id)) continue;
      units[id] = sanitizeUnitStat(stat);
    }
  }
  const sessions = Array.isArray(input.sessions)
    ? input.sessions.filter(isObject).map(sanitizeSession).slice(-200)
    : [];
  const streak = isObject(input.streak) ? input.streak : {};
  return {
    version: VERSION,
    createdAt: typeof input.createdAt === "string" ? input.createdAt : null,
    track: oneOf(input.track, ["core", "precision"], "core"),
    units,
    sessions,
    streak: {
      current: Math.max(0, Math.round(number(streak.current))),
      best: Math.max(0, Math.round(number(streak.best))),
      lastDay: stringOrNull(streak.lastDay),
    },
    recentWords: arrayOfStrings(input.recentWords, 20),
    recentTrials: Array.isArray(input.recentTrials)
      ? input.recentTrials
          .filter(Array.isArray)
          .map((trial) => arrayOfStrings(trial, 20))
          .slice(-10)
      : [],
  };
}

// v1 stored a loose { seen, correct } map. Keep it rather than discarding a
// learner's history on the first upgrade.
export function migrateProgress(raw) {
  if (!isObject(raw) || raw.version === VERSION) return sanitizeProgress(raw);
  const units = {};
  if (isObject(raw.units)) {
    for (const [id, old] of Object.entries(raw.units)) {
      if (!isObject(old)) continue;
      const attempts = number(old.attempts, number(old.seen));
      const correct = number(old.correct);
      units[id] = {
        attempts,
        correct,
        ema: attempts > 0 ? clamp(correct / attempts, 0, 1) : 0.5,
        soundEma: attempts > 0 ? clamp(correct / attempts, 0, 1) : 0.5,
        formEma: 0.5,
        lastSeen: stringOrNull(old.lastSeen),
        unlocked: bool(old.unlocked, true),
      };
    }
  }
  return sanitizeProgress({ ...raw, version: VERSION, units });
}

function backendOrNull(backend) {
  if (backend) return backend;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function readJSON(backend, key) {
  if (!backend) return null;
  try {
    const raw = backend.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJSON(backend, key, value) {
  if (!backend) return false;
  try {
    backend.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function createStorage(backend = null) {
  const store = backendOrNull(backend);

  return {
    get available() {
      return Boolean(store);
    },
    readSettings() {
      return sanitizeSettings(readJSON(store, KEYS.settings));
    },
    writeSettings(settings) {
      return writeJSON(store, KEYS.settings, sanitizeSettings(settings));
    },
    readProgress() {
      const raw = readJSON(store, KEYS.progress);
      const progress = migrateProgress(raw);
      if (!progress.sessions.length) {
        const history = readJSON(store, KEYS.history);
        if (Array.isArray(history)) progress.sessions = history.map(sanitizeSession).slice(-200);
      }
      return progress;
    },
    writeProgress(progress) {
      const clean = sanitizeProgress(progress);
      const ok = writeJSON(store, KEYS.progress, clean);
      writeJSON(store, KEYS.history, clean.sessions);
      return ok;
    },
    readHistory() {
      const history = readJSON(store, KEYS.history);
      return Array.isArray(history) ? history.map(sanitizeSession).slice(-200) : [];
    },
    clear() {
      if (!store) return false;
      try {
        for (const key of Object.values(KEYS)) store.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
    exportJSON(settings, progress) {
      return JSON.stringify(
        {
          version: VERSION,
          exportedAt: new Date().toISOString(),
          settings: sanitizeSettings(settings),
          progress: sanitizeProgress(progress),
        },
        null,
        2,
      );
    },
    importJSON(text) {
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error("That file is not valid JSON.");
      }
      if (!isObject(payload)) throw new Error("That file is not a Dregg backup.");
      if (payload.version !== VERSION) {
        throw new Error(`Unsupported backup version: ${payload.version ?? "unknown"}.`);
      }
      const settings = sanitizeSettings(payload.settings);
      const progress = sanitizeProgress(payload.progress);
      const summary = {
        units: Object.keys(progress.units).length,
        sessions: progress.sessions.length,
        track: progress.track,
      };
      return { settings, progress, summary };
    },
  };
}

export { sanitizeSession };
