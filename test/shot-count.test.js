import test from "node:test";
import assert from "node:assert/strict";
import { parseShotCountPreference, selectShotCount, shotCountRecommendation } from "../src/shot-count.js";

test("accepts an explicit shot count or blank recommendation mode", () => {
  assert.equal(parseShotCountPreference("8"), 8);
  assert.equal(parseShotCountPreference(""), null);
  assert.throws(() => parseShotCountPreference("2.5"), /จำนวนเต็ม/);
  assert.throws(() => parseShotCountPreference("101"), /1 ถึง 100/);
});

test("uses the LLM recommendation as the interactive default", async () => {
  const analysis = {
    durationSeconds: 30,
    shotCountRecommendation: { minimum: 6, recommended: 8, maximum: 10, rationale: "Eight distinct beats." }
  };
  const terminal = { ask: async (_question, defaultValue) => defaultValue };
  assert.equal(await selectShotCount(terminal, analysis, null), 8);
});

test("keeps an explicit user count while still exposing the recommendation", async () => {
  const analysis = { shotCountRecommendation: { minimum: 4, recommended: 6, maximum: 8, rationale: "Six beats." } };
  const terminal = { ask: async () => { throw new Error("should not ask again"); } };
  assert.equal(await selectShotCount(terminal, analysis, 5), 5);
  assert.deepEqual(shotCountRecommendation(analysis), {
    minimum: 4,
    recommended: 6,
    maximum: 8,
    rationale: "Six beats."
  });
});
