import test from "node:test";
import assert from "node:assert/strict";
import { finalPrompt, SHOT_LIST_FRAMEWORK, shotsPrompt, SYSTEM_PROMPT } from "../src/prompts.js";

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
    "negativeConstraints",
    "cinematicIntent",
    "attentionFocus",
    "visualPayoff"
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
  assert.match(prompt, /ย่อหน้า production prompt ภาษาอังกฤษแบบละเอียดและต่อเนื่อง/);
  assert.match(prompt, /micro-expression/);
  assert.match(prompt, /ภาพสุดท้าย/);
  assert.match(prompt, /sound bridge/);
});

test("shot and system prompts prevent motion resets and repeated actions", () => {
  assert.match(SHOT_LIST_FRAMEWORK, /endState ของ shot ก่อนต้องเป็น startState ของ shot ถัดไปแบบคำต่อคำ/);
  assert.match(SHOT_LIST_FRAMEWORK, /ห้ามย้อนกลับไปเริ่มเอื้อมมือใหม่/);
  assert.match(SHOT_LIST_FRAMEWORK, /ภาษาภาพยนตร์ที่ดึงสายตา/);
  assert.match(SHOT_LIST_FRAMEWORK, /ภาพที่ทรงพลังที่สุดไว้ให้ climax\/payoff/);
  assert.match(SYSTEM_PROMPT, /ห้ามบรรยาย motion, action beat หรือบทพูดเดิมซ้ำ/);
});
