// App state, persistence, and the actions screens call. Screens render state;
// the engine owns the learning rules.
import {
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  createStorage,
  sanitizeProgress,
  sanitizeSettings,
} from "./storage.js";
import {
  createSession,
  canonicalUnit,
  ensureProgress,
  finishSession,
  isUnitUnlocked,
  masterySummary,
  nextUnit,
  recordResult,
  trackUnits,
  unitStat,
  unlockReady,
  weakestUnits,
} from "./engine.js";
import { LEXICON } from "./data/lexicon.js";
import { UNIT_BY_ID } from "./units.js";
import { createAudio } from "./audio.js";

const ROUTES = ["onboarding", "today", "practice", "chart", "explorer", "progress", "settings"];

export function createStore({ storage = createStorage(), lexicon = LEXICON, now = () => new Date().toISOString() } = {}) {
  const listeners = new Set();
  const audio = createAudio();

  const state = {
    route: "today",
    track: "core",
    settings: { ...DEFAULT_SETTINGS },
    progress: { ...DEFAULT_PROGRESS },
    session: null,
    toast: null,
    storage: { available: storage.available, persistent: null, lastSaved: null },
    offline: { ready: false, updateReady: false },
    ready: false,
  };

  const emit = () => {
    for (const listener of listeners) listener(state);
  };

  const save = () => {
    const okSettings = storage.writeSettings(state.settings);
    const okProgress = storage.writeProgress(state.progress);
    if (okSettings && okProgress) state.storage.lastSaved = now();
    state.storage.available = storage.available;
  };

  const api = {
    audio,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(patch) {
      Object.assign(state, patch);
      emit();
    },
    init() {
      state.settings = storage.readSettings();
      state.progress = storage.readProgress();
      state.track = state.progress.track === "precision" ? "precision" : "core";
      ensureProgress(state.progress, state.track);
      if (!state.progress.createdAt) state.progress.createdAt = now();
      state.route = state.settings.onboardingDone ? "today" : "onboarding";
      state.ready = true;
      save();
      emit();
      return state;
    },
    navigate(route) {
      const next = ROUTES.includes(route) ? route : "today";
      if (state.route === next && state.ready) {
        emit();
        return;
      }
      state.route = next;
      if (typeof location !== "undefined") {
        const hash = `#/${next}`;
        if (location.hash !== hash) location.hash = hash;
      }
      emit();
    },
    setRoute(route) {
      if (!ROUTES.includes(route)) return;
      state.route = route;
      emit();
    },
    setSettings(patch) {
      state.settings = sanitizeSettings({ ...state.settings, ...patch });
      save();
      emit();
    },
    markOnboardingDone(goal) {
      state.settings = sanitizeSettings({
        ...state.settings,
        onboardingDone: true,
        dailyGoal: goal || state.settings.dailyGoal,
      });
      state.progress.track = state.track;
      save();
      api.navigate("today");
    },
    isPrecisionAvailable() {
      // Blends are Fluency, which comes after the precision vowel phases; they
      // must not gate the Core → Precision switch.
      const units = trackUnits("core").filter((id) => UNIT_BY_ID[id]?.kind !== "blend");
      return units.length > 0 && units.every((id) => isUnitUnlocked(state.progress, id, "core"));
    },
    setTrack(track) {
      if (!["core", "precision"].includes(track)) return false;
      if (track === "precision" && !api.isPrecisionAvailable()) {
        api.toast("Finish Core to unlock Precision.");
        return false;
      }
      state.track = track;
      state.progress.track = track;
      ensureProgress(state.progress, track);
      state.session = null;
      save();
      emit();
      return true;
    },
    mastery(track = state.track) {
      return masterySummary(state.progress, track);
    },
    weakest(count = 3) {
      return weakestUnits(state.progress, state.track, count);
    },
    nextUnit() {
      return nextUnit(state.progress, state.track);
    },
    unlockReady() {
      return unlockReady(state.progress, state.track);
    },
    currentItem() {
      return state.session?.items?.[state.session.index] || null;
    },
    startSession({ focusUnit = null } = {}) {
      const session = createSession({
        progress: state.progress,
        lexicon,
        track: state.track,
        settings: state.settings,
        seed: Date.now(),
        now: now(),
        focusUnit,
      });
      if (!session.items.length) {
        api.toast("No eligible words yet. Try another track.");
        return null;
      }
      state.session = session;
      state.route = "practice";
      if (typeof location !== "undefined") location.hash = "#/practice";
      save();
      emit();
      return session;
    },
    resumeSession() {
      if (state.session && !state.session.finished && state.session.items.length) {
        api.navigate("practice");
        return true;
      }
      return false;
    },
    practiceUnit(unitId) {
      if (!isUnitUnlocked(state.progress, unitId, state.track)) {
        api.toast("That stroke is still locked.");
        return false;
      }
      return Boolean(api.startSession({ focusUnit: unitId }));
    },
    submitResult(result) {
      const session = state.session;
      const item = api.currentItem();
      if (!session || !item) return null;
      if (session.results.some((entry) => entry.itemId === item.id)) return null;
      const entry = recordResult(state.progress, session, result, { now: now() });
      if (state.settings.haptics && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(result.correct ? 8 : [12, 40, 12]);
      }
      save();
      emit();
      return entry;
    },
    overrideResult(correct) {
      const session = state.session;
      const item = api.currentItem();
      if (!session || !item) return null;
      const entry = [...session.results].reverse().find((e) => e.itemId === item.id);
      if (!entry) return null;
      if (entry.correct === Boolean(correct)) return entry;
      const old = entry.correct;
      entry.correct = Boolean(correct);
      // Keep the recorded mastery count consistent with the override.
      // (Approximate: EMA is not reversed; only the correct-count is.)
      for (const unit of new Set((item.units || []).map(canonicalUnit))) {
        const stat = unitStat(state.progress, unit);
        if (old && !correct) stat.correct = Math.max(0, stat.correct - 1);
        if (!old && correct) stat.correct += 1;
      }
      save();
      emit();
      return entry;
    },
    next() {
      const session = state.session;
      if (!session) return;
      if (session.index >= session.items.length - 1) {
        api.finish();
        return;
      }
      session.index += 1;
      emit();
    },
    finish() {
      if (!state.session) return null;
      const summary = finishSession(state.progress, state.session, { now: now() });
      save();
      emit();
      return summary;
    },
    exitSession() {
      if (state.session && !state.session.finished && state.session.results.length) api.finish();
      api.navigate("today");
    },
    resetProgress(scope = "all") {
      if (scope === "all") {
        state.progress = sanitizeProgress({ ...DEFAULT_PROGRESS, track: state.track, createdAt: now() });
      } else {
        for (const unit of trackUnits(state.track)) {
          const stat = unitStat(state.progress, unit);
          stat.attempts = 0;
          stat.correct = 0;
          stat.ema = 0.5;
          stat.soundEma = 0.5;
          stat.formEma = 0.5;
          stat.lastSeen = null;
          stat.unlocked = false;
        }
      }
      ensureProgress(state.progress, state.track);
      state.session = null;
      save();
      emit();
    },
    exportBackup() {
      return storage.exportJSON(state.settings, state.progress);
    },
    importBackup(text) {
      const { settings, progress, summary } = storage.importJSON(text);
      state.settings = settings;
      state.progress = progress;
      state.track = progress.track === "precision" ? "precision" : "core";
      ensureProgress(state.progress, state.track);
      state.session = null;
      save();
      emit();
      return summary;
    },
    setOffline(patch) {
      state.offline = { ...state.offline, ...patch };
      emit();
    },
    setStorage(patch) {
      state.storage = { ...state.storage, ...patch };
      emit();
    },
    toast(message) {
      state.toast = message ? { message, at: now() } : null;
      emit();
      if (message && typeof setTimeout !== "undefined") {
        setTimeout(() => {
          if (state.toast?.message === message) {
            state.toast = null;
            emit();
          }
        }, 4000);
      }
    },
    save,
  };

  return api;
}
