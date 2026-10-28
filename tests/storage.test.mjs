import test from "node:test";
import assert from "node:assert/strict";
import {
  createStorage,
  sanitizeSettings,
  sanitizeProgress,
  migrateProgress,
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  VERSION,
} from "../app/js/storage.js";

function memoryBackend() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    map,
  };
}

test("settings are clamped and validated", () => {
  const settings = sanitizeSettings({
    sessionLength: 900,
    dailyGoal: 7,
    theme: "neon",
    modeMix: "nope",
    sound: "yes",
  });
  assert.equal(settings.sessionLength, 30);
  assert.equal(settings.dailyGoal, DEFAULT_SETTINGS.dailyGoal);
  assert.equal(settings.theme, "system");
  assert.equal(settings.modeMix, "mixed");
  assert.equal(settings.sound, false);
});

test("progress sanitizes unit stats and caps history", () => {
  const raw = {
    version: VERSION,
    units: { t: { attempts: 3, correct: 9, ema: 4 }, "bad id!": { attempts: 1 } },
    sessions: Array.from({ length: 250 }, (_, index) => ({ id: `s${index}`, items: 10, correct: 10 })),
  };
  const progress = sanitizeProgress(raw);
  assert.equal(progress.units.t.correct, 3);
  assert.equal(progress.units.t.ema, 1);
  assert.equal(progress.units["bad id!"], undefined);
  assert.equal(progress.sessions.length, 200);
});

test("v1 progress migrates instead of being discarded", () => {
  const migrated = migrateProgress({
    version: 1,
    units: { t: { seen: 4, correct: 2, unlocked: true } },
    sessions: [],
  });
  assert.equal(migrated.units.t.attempts, 4);
  assert.equal(migrated.units.t.ema, 0.5);
  assert.equal(migrated.units.t.unlocked, true);
});

test("storage round-trips settings and progress", () => {
  const backend = memoryBackend();
  const storage = createStorage(backend);
  const settings = { ...DEFAULT_SETTINGS, onboardingDone: true, sound: true };
  const progress = { ...structuredClone(DEFAULT_PROGRESS), track: "core", units: { t: { attempts: 2, correct: 2 } } };

  assert.equal(storage.writeSettings(settings), true);
  assert.equal(storage.writeProgress(progress), true);
  assert.equal(storage.readSettings().sound, true);
  assert.equal(storage.readProgress().units.t.attempts, 2);
  assert.equal(storage.readHistory().length, 0);
});

test("export and import validate and preserve data", () => {
  const storage = createStorage(memoryBackend());
  const progress = structuredClone(DEFAULT_PROGRESS);
  progress.units.t = { attempts: 5, correct: 4, ema: 0.8 };
  const text = storage.exportJSON(DEFAULT_SETTINGS, progress);
  const { settings, progress: imported, summary } = storage.importJSON(text);
  assert.equal(settings.version, VERSION);
  assert.equal(imported.units.t.attempts, 5);
  assert.equal(summary.units, 1);

  assert.throws(() => storage.importJSON("{not json"), /valid JSON/);
  assert.throws(() => storage.importJSON(JSON.stringify({ version: 99 })), /Unsupported/);
});

test("corrupt local data falls back to defaults", () => {
  const backend = memoryBackend();
  backend.setItem("dregg.v2.progress", "{broken");
  const storage = createStorage(backend);
  assert.deepEqual(storage.readProgress().units, {});
  assert.equal(storage.readSettings().sessionLength, DEFAULT_SETTINGS.sessionLength);
});
