import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../app/js/store.js";
import { createStorage } from "../app/js/storage.js";

function memoryBackend() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function newStore() {
  const store = createStore({
    storage: createStorage(memoryBackend()),
    now: () => "2026-01-01T00:00:00.000Z",
  });
  store.init();
  return store;
}

test("ensureSession starts a session without navigating or notifying", () => {
  const store = newStore();
  let emits = 0;
  store.subscribe(() => {
    emits += 1;
  });
  const route = store.getState().route;
  const session = store.ensureSession();

  assert.ok(session.items.length, "a session has items");
  assert.equal(store.getState().session, session);
  assert.equal(store.getState().route, route, "route is left alone");
  assert.equal(emits, 0, "nothing is emitted");
  assert.equal(store.ensureSession(), session, "the same session is reused");
});
