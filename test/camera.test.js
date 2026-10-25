import assert from "node:assert/strict";
import test from "node:test";
import { describeCameraPlan, validateCameraPlan } from "../src/camera.js";

function shot(overrides = {}) {
  return {
    dialogue: [],
    camera: {
      lensMm: "50mm",
      shotSize: "MCU",
      angle: "eye-level",
      perspective: "objective",
      height: "eye",
      position: "two metres in front of Subject 1",
      primaryMovement: { type: "pan", direction: "right", speed: "slow", motivation: "follow the subject reveal" },
      focus: { subject: "Subject 1's eyes", depth: "shallow", transition: "none" },
      screenDirection: "Subject 1 moves frame-left to frame-right",
      intent: "Preserve empathy while revealing the doorway"
    },
    cameraContinuity: {
      axis: "camera stays south of the dialogue axis",
      eyeline: "Subject 1 looks frame-right",
      entryDirection: "Subject 1 enters frame-left",
      previousShotBridge: "continues the prior frame-right movement"
    },
    ...overrides
  };
}

test("accepts a complete structured camera plan", () => {
  assert.deepEqual(validateCameraPlan(shot(), "Shot 1"), []);
});

test("rejects pan with vertical direction", () => {
  const value = shot();
  value.camera.primaryMovement.direction = "up";
  assert.match(validateCameraPlan(value, "Shot 1").join("; "), /pan ต้องใช้ทิศซ้าย\/ขวา/);
});

test("rejects wide dialogue framing that cannot support lip sync", () => {
  const value = shot({ dialogue: [{ speaker: "Subject 1", line: "Hello" }] });
  value.camera.shotSize = "ELS";
  assert.match(validateCameraPlan(value, "Shot 1").join("; "), /ไม่เห็นใบหน้า\/ปากชัดพอ/);
});

test("normalizes legacy camera strings for old resumable sessions", () => {
  const plan = describeCameraPlan({ lensMm: "35mm", shotSize: "medium", angle: "eye level", position: "front", movement: "slow push in", focus: "face" });
  assert.equal(plan.primaryMovement.type, "dolly-in");
  assert.match(plan.focusDescription, /face/);
});
