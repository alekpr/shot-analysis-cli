import test from "node:test";
import assert from "node:assert/strict";
import { finalPrompt, shotsPrompt } from "../src/prompts.js";

test("shot prompt requires production-level action, camera, sound, and continuity detail", () => {
  const prompt = shotsPrompt({ title: "Test", durationSeconds: 30 });
  for (const field of [
    "spatialAnchor",
    "startState",
    "actionBeats",
    "endState",
    "lensMm",
    "syncEffects",
    "continuityIn",
    "continuityOut",
    "negativeConstraints"
  ]) {
    assert.match(prompt, new RegExp(`\\"${field}\\"`));
  }
  assert.match(prompt, /เหตุเกิดก่อนผลเสมอ/);
  assert.match(prompt, /ห้ามเฉลี่ยเวลาเท่ากันโดยไม่มีเหตุผล/);
});

test("final prompt carries production shot details into generation", () => {
  const prompt = finalPrompt({}, { shots: [] });
  assert.match(prompt, /spatialAnchor, startState, actionBeats/);
  assert.match(prompt, /continuityIn\/continuityOut/);
});
