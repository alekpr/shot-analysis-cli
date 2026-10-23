import assert from "node:assert/strict";
import test from "node:test";
import { estimateTokens, splitShotBatches } from "../src/prompt-sizing.js";

test("estimates prompt size conservatively by characters", () => {
  assert.equal(estimateTokens("12345678"), 2);
});

test("splits large shot lists while preserving shot order", () => {
  const shots = { durationSeconds: 30, shots: Array.from({ length: 23 }, (_, index) => ({ number: index + 1 })) };
  const batches = splitShotBatches(shots, 10);
  assert.deepEqual(batches.map((batch) => batch.shots.length), [10, 10, 3]);
  assert.deepEqual(batches.flatMap((batch) => batch.shots.map((shot) => shot.number)), Array.from({ length: 23 }, (_, index) => index + 1));
});
