import test from "node:test";
import assert from "node:assert/strict";
import { finalPrompt, SHOT_LIST_FRAMEWORK, shotsPrompt, storyboardPrompt, SYSTEM_PROMPT } from "../src/prompts.js";

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
    "visualPayoff",
    "offscreenSubjects",
    "continuityBridge",
    "causalLink",
    "startOffset",
    "endOffset"
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

test("Seedance target uses reference mapping and timecoded beats", () => {
  const prompt = finalPrompt({}, { shots: [] }, "DY,", {}, {}, "seedance-2.5");
  assert.match(prompt, /Seedance 2\.5/);
  assert.match(prompt, /REFERENCE_MAPPING:/);
  assert.match(prompt, /TIMECODED_BEATS:/);
  assert.match(prompt, /GLOBAL_CONSTRAINTS:/);
  assert.doesNotMatch(prompt, /บรรทัดแรกต้องเริ่มด้วย DY,subject_definitions/);
});

test("storyboard prompt requests one still panel per shot in one contact sheet", () => {
  const prompt = storyboardPrompt({}, { shots: [{}, {}, {}, {}, {}, {}, {}, {}] }, {}, "9:16");
  assert.match(prompt, /storyboard key image แบบ contact sheet/);
  assert.match(prompt, /"columns":4/);
  assert.match(prompt, /"rows":2/);
  assert.match(prompt, /still keyframe เพียงหนึ่งขณะ/);
  assert.match(prompt, /หนึ่งภาพ/);
  assert.match(prompt, /ห้ามสร้าง title, subtitle/);
});

test("shot and system prompts prevent motion resets and repeated actions", () => {
  assert.match(SHOT_LIST_FRAMEWORK, /startState และ endState ต้องอธิบายเฉพาะสิ่งที่มองเห็น/);
  assert.match(SHOT_LIST_FRAMEWORK, /ห้ามย้อนกลับไปเริ่มเอื้อมมือใหม่/);
  assert.match(SHOT_LIST_FRAMEWORK, /ภาษาภาพยนตร์ที่ดึงสายตา/);
  assert.match(SHOT_LIST_FRAMEWORK, /ภาพที่ทรงพลังที่สุดไว้ให้ climax\/payoff/);
  assert.match(SHOT_LIST_FRAMEWORK, /ห้ามรวมวัตถุคนละชนิด/);
  assert.match(shotsPrompt({}, ""), /referenceNeeds/);
  assert.match(SYSTEM_PROMPT, /ห้ามบรรยาย motion, action beat หรือบทพูดเดิมซ้ำ/);
});
