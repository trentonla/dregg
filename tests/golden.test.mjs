import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { goldenSamples } from "../tools/golden.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

test("committed golden snapshots match the current outline engine", () => {
  for (const sample of goldenSamples()) {
    const file = path.join(here, "golden", `${sample.name}.svg`);
    assert.ok(fs.existsSync(file), `missing snapshot ${sample.name}; run node tools/golden.mjs --update`);
    assert.equal(fs.readFileSync(file, "utf8"), `${sample.svg}\n`, `stale snapshot ${sample.name}`);
  }
});
