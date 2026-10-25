import assert from "node:assert/strict";
import test from "node:test";
import { describeCameraPlan, normalizeShotListCameras, validateCameraPlan } from "../src/camera.js";

function shot(overrides = {}) {
  return {
    dialogue: [],
    subjects: ["Subject 1"],
    offscreenSubjects: ["Subject 2"],
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
      screenDirectionCode: "frame-right",
      screenDirectionSubject: "Subject 1",
      intent: "Preserve empathy while revealing the doorway"
    },
    cameraContinuity: {
      axis: "camera stays south of the dialogue axis",
      axisId: "dialogue-axis-a",
      cameraSide: "left",
      axisTransition: "initial",
      eyeline: "Subject 1 looks frame-right",
      eyelineMatchId: "subject-door-look",
      eyelineDirection: "frame-right",
      eyelineTransition: "initial",
      entryDirection: "frame-right",
      exitDirection: "frame-right",
      changeMotivation: "establish the initial dialogue geography",
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
  assert.match(validateCameraPlan(value, "Shot 1").join("; "), /pan ต้องใช้ direction ซ้าย\/ขวาเท่านั้น/);
});

test("rejects Thai vertical direction for pan", () => {
  const value = shot();
  value.camera.primaryMovement.direction = "ขึ้น";
  assert.match(validateCameraPlan(value, "Shot 1").join("; "), /pan ต้องใช้ direction ซ้าย\/ขวาเท่านั้น/);
});

test("rejects contradictory locked-off speed and direction", () => {
  const value = shot();
  value.camera.primaryMovement = { type: "locked-off", direction: "right", speed: "fast", motivation: "hold the frame" };
  const errors = validateCameraPlan(value, "Shot 1").join("; ");
  assert.match(errors, /locked-off ต้องใช้ direction=none/);
  assert.match(errors, /locked-off ต้องใช้ speed=static/);
});

test("rejects an unmotivated axis crossing between adjacent shots", () => {
  const previous = shot();
  const current = structuredClone(previous);
  current.cameraContinuity.axisTransition = "preserve";
  current.cameraContinuity.eyelineTransition = "preserve";
  current.cameraContinuity.cameraSide = "right";
  assert.match(validateCameraPlan(current, "Shot 2", previous).join("; "), /เปลี่ยนด้านของ axis/);
});

test("accepts a motivated axis crossing between adjacent shots", () => {
  const previous = shot();
  const current = structuredClone(previous);
  current.cameraContinuity.axisTransition = "motivated-cross";
  current.cameraContinuity.eyelineTransition = "preserve";
  current.cameraContinuity.cameraSide = "right";
  current.cameraContinuity.changeMotivation = "the camera visibly crosses behind Subject 1 during the action";
  assert.deepEqual(validateCameraPlan(current, "Shot 2", previous), []);
});

test("rejects a screen-direction reversal while preserving the axis", () => {
  const previous = shot();
  const current = structuredClone(previous);
  current.cameraContinuity.axisTransition = "preserve";
  current.cameraContinuity.eyelineTransition = "preserve";
  current.camera.screenDirectionCode = "frame-left";
  assert.match(validateCameraPlan(current, "Shot 2", previous).join("; "), /กลับ screen direction/);
});

test("validates reverse-shot eyeline matching", () => {
  const previous = shot();
  const current = structuredClone(previous);
  current.cameraContinuity.axisTransition = "preserve";
  current.cameraContinuity.eyelineTransition = "reverse-match";
  current.cameraContinuity.eyelineDirection = "frame-left";
  assert.deepEqual(validateCameraPlan(current, "Shot 2", previous), []);
  current.cameraContinuity.eyelineDirection = "frame-right";
  assert.match(validateCameraPlan(current, "Shot 2", previous).join("; "), /reverse-match/);
});

test("rejects wide dialogue framing that cannot support lip sync", () => {
  const value = shot({ dialogue: [{ speaker: "Subject 1", language: "English", line: "Hello", performance: "quietly", delivery: "on-camera", lipSync: true }] });
  value.camera.shotSize = "ELS";
  assert.match(validateCameraPlan(value, "Shot 1").join("; "), /เห็นใบหน้า\/ปากไม่ชัดพอ/);
});

test("accepts offscreen dialogue in a wide shot without lip sync", () => {
  const value = shot({ dialogue: [{ speaker: "Subject 2", language: "English", line: "Hello", performance: "from the hallway", delivery: "offscreen", lipSync: false }] });
  value.camera.shotSize = "ELS";
  assert.deepEqual(validateCameraPlan(value, "Shot 1"), []);
});

test("accepts ECU lip sync when focus is the speaking mouth", () => {
  const value = shot({ dialogue: [{ speaker: "Subject 1", language: "English", line: "Hello", performance: "whispers", delivery: "on-camera", lipSync: true }] });
  value.camera.shotSize = "ECU";
  value.camera.focus.subject = "Subject 1's mouth and lips";
  assert.deepEqual(validateCameraPlan(value, "Shot 1"), []);
});

test("normalizes legacy camera strings for old resumable sessions", () => {
  const plan = describeCameraPlan({ lensMm: "35mm", shotSize: "medium", angle: "eye level", position: "front", movement: "slow push in", focus: "face" });
  assert.equal(plan.primaryMovement.type, "dolly-in");
  assert.match(plan.focusDescription, /face/);
  assert.equal(plan.screenDirectionCode, "unspecified");
  assert.equal(plan.continuity.axisId, "unspecified");
  const shotList = normalizeShotListCameras({ shots: [{ camera: { lensMm: "35mm", movement: "locked" } }] });
  assert.equal(shotList.shots[0].camera.primaryMovement.type, "locked-off");
  assert.equal(shotList.shots[0].cameraContinuity.axisId, "unspecified");
});

test("normalization and validation handle malformed nullable model output", () => {
  assert.equal(describeCameraPlan(null, null).lensMm, "unspecified");
  const value = shot({ dialogue: null });
  assert.match(validateCameraPlan(value, "Shot 1").join("; "), /dialogue ต้องเป็น array/);
});
