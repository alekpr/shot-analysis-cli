export const CAMERA_ANGLES = ["eye-level", "high-angle", "low-angle", "worms-eye", "top-down", "dutch-angle", "ground-level"];
export const CAMERA_PERSPECTIVES = ["objective", "ots", "pov"];
export const CAMERA_HEIGHTS = ["ground", "low", "waist", "chest", "shoulder", "eye", "high", "overhead"];
export const SHOT_SIZES = ["ECU", "CU", "MCU", "MS", "MLS", "LS", "ELS"];
export const CAMERA_MOVEMENTS = ["locked-off", "pan", "tilt", "dolly-in", "dolly-out", "zoom-in", "zoom-out", "tracking", "trucking", "crane", "jib", "dolly-zoom", "handheld", "steadicam", "gimbal", "arc", "orbit"];
export const CAMERA_SPEEDS = ["static", "very-slow", "slow", "moderate", "fast"];
export const FOCUS_DEPTHS = ["deep", "moderate", "shallow"];
export const FOCUS_TRANSITIONS = ["none", "rack-focus"];
export const SCREEN_DIRECTIONS = ["frame-left", "frame-right", "stationary", "toward-camera", "away-from-camera", "none"];
export const CAMERA_SIDES = ["left", "right", "on-axis", "none"];
export const AXIS_TRANSITIONS = ["initial", "preserve", "motivated-cross", "new-axis"];
export const EYELINE_DIRECTIONS = ["frame-left", "frame-right", "camera", "away", "none"];
export const EYELINE_TRANSITIONS = ["initial", "preserve", "reverse-match", "new-eyeline"];

function text(value, fallback = "unspecified") {
  return String(value || "").trim() || fallback;
}

function inferMovement(value) {
  const raw = text(value, "locked-off").toLowerCase();
  return CAMERA_MOVEMENTS.find((item) => raw.includes(item))
    || (raw.includes("push") ? "dolly-in" : raw.includes("pull") ? "dolly-out" : raw.includes("locked") || raw.includes("static") ? "locked-off" : "custom");
}

export function normalizeCameraPlan(camera = {}, continuity = {}) {
  const sourceCamera = camera && typeof camera === "object" ? camera : {};
  const sourceContinuity = continuity && typeof continuity === "object" ? continuity : {};
  const movement = sourceCamera.primaryMovement && typeof sourceCamera.primaryMovement === "object"
    ? sourceCamera.primaryMovement
    : {
        type: inferMovement(sourceCamera.movement),
        direction: text(sourceCamera.movement, "none"),
        speed: "unspecified",
        motivation: text(sourceCamera.movement, "preserve the approved framing")
      };
  const focus = sourceCamera.focus && typeof sourceCamera.focus === "object"
    ? sourceCamera.focus
    : { subject: text(sourceCamera.focus), depth: "unspecified", transition: "none" };
  return {
    lensMm: text(sourceCamera.lensMm),
    shotSize: text(sourceCamera.shotSize),
    angle: text(sourceCamera.angle),
    perspective: text(sourceCamera.perspective, "objective"),
    height: text(sourceCamera.height),
    position: text(sourceCamera.position),
    primaryMovement: {
      type: text(movement.type),
      direction: text(movement.direction, movement.type === "locked-off" ? "none" : "unspecified"),
      speed: text(movement.speed),
      motivation: text(movement.motivation)
    },
    focus: {
      subject: text(focus.subject),
      depth: text(focus.depth),
      transition: text(focus.transition, "none")
    },
    screenDirection: text(sourceCamera.screenDirection),
    screenDirectionCode: text(sourceCamera.screenDirectionCode),
    screenDirectionSubject: text(sourceCamera.screenDirectionSubject),
    intent: text(sourceCamera.intent),
    continuity: {
      axis: text(sourceContinuity.axis),
      axisId: text(sourceContinuity.axisId),
      cameraSide: text(sourceContinuity.cameraSide),
      axisTransition: text(sourceContinuity.axisTransition),
      eyeline: text(sourceContinuity.eyeline),
      eyelineMatchId: text(sourceContinuity.eyelineMatchId),
      eyelineDirection: text(sourceContinuity.eyelineDirection),
      eyelineTransition: text(sourceContinuity.eyelineTransition),
      entryDirection: text(sourceContinuity.entryDirection),
      exitDirection: text(sourceContinuity.exitDirection),
      changeMotivation: text(sourceContinuity.changeMotivation),
      previousShotBridge: text(sourceContinuity.previousShotBridge)
    }
  };
}

export function normalizeShotListCameras(shotList = {}) {
  return {
    ...shotList,
    shots: (shotList.shots || []).map((shot) => {
      const plan = normalizeCameraPlan(shot.camera, shot.cameraContinuity);
      const { continuity, ...camera } = plan;
      return { ...shot, camera, cameraContinuity: continuity };
    })
  };
}

function requireEnum(errors, label, value, allowed) {
  if (!allowed.includes(value)) errors.push(`${label} ต้องเป็น ${allowed.join("|")}`);
}

function isOppositeDirection(first, second) {
  return (first === "frame-left" && second === "frame-right") || (first === "frame-right" && second === "frame-left");
}

function validateCrossShotContinuity(errors, shot, previousShot, shotLabel) {
  const current = shot.cameraContinuity;
  const previous = previousShot?.cameraContinuity;
  if (!previous) return;

  if (current.axisId === previous.axisId) {
    if (current.cameraSide === previous.cameraSide && current.axisTransition !== "preserve") {
      errors.push(`${shotLabel} อยู่ด้านเดิมของ axis แต่ axisTransition ต้องเป็น preserve`);
    }
    if (current.cameraSide !== previous.cameraSide && current.axisTransition !== "motivated-cross") {
      errors.push(`${shotLabel} เปลี่ยนด้านของ axis โดยไม่มี axisTransition=motivated-cross`);
    }
  } else if (current.axisTransition !== "new-axis") {
    errors.push(`${shotLabel} เปลี่ยน axisId แต่ axisTransition ต้องเป็น new-axis`);
  }

  const previousSubject = previousShot.camera?.screenDirectionSubject;
  const currentSubject = shot.camera?.screenDirectionSubject;
  if (previousSubject && previousSubject !== "none" && previousSubject === currentSubject && current.axisTransition === "preserve") {
    const previousDirection = previousShot.camera?.screenDirectionCode;
    const currentDirection = shot.camera?.screenDirectionCode;
    if (["frame-left", "frame-right"].includes(previousDirection) && ["frame-left", "frame-right"].includes(currentDirection) && previousDirection !== currentDirection) {
      errors.push(`${shotLabel} กลับ screen direction ของ ${currentSubject} ทั้งที่ยัง preserve axis`);
    }
    if (["frame-left", "frame-right"].includes(previous.exitDirection) && ["frame-left", "frame-right"].includes(current.entryDirection) && previous.exitDirection !== current.entryDirection) {
      errors.push(`${shotLabel} entryDirection ไม่ต่อกับ exitDirection ของ shot ก่อนสำหรับ ${currentSubject}`);
    }
  }

  if (current.eyelineMatchId === previous.eyelineMatchId) {
    if (!["preserve", "reverse-match"].includes(current.eyelineTransition)) {
      errors.push(`${shotLabel} ใช้ eyelineMatchId เดิมจึงต้องใช้ eyelineTransition=preserve หรือ reverse-match`);
    }
    if (current.eyelineTransition === "preserve" && current.eyelineDirection !== previous.eyelineDirection) {
      errors.push(`${shotLabel} เปลี่ยน eyelineDirection ทั้งที่ eyelineTransition=preserve`);
    }
    if (current.eyelineTransition === "reverse-match" && !isOppositeDirection(previous.eyelineDirection, current.eyelineDirection)) {
      errors.push(`${shotLabel} reverse-match ต้องใช้ eyelineDirection ฝั่งตรงข้ามกับ shot ก่อน`);
    }
  } else if (current.eyelineTransition !== "new-eyeline") {
    errors.push(`${shotLabel} เปลี่ยน eyelineMatchId แต่ eyelineTransition ต้องเป็น new-eyeline`);
  }
}

export function validateCameraPlan(shot, shotLabel, previousShot) {
  const errors = [];
  const camera = shot?.camera;
  const continuity = shot?.cameraContinuity;
  if (!camera || typeof camera !== "object") return [`${shotLabel} camera ต้องเป็น object`];

  for (const key of ["lensMm", "position", "screenDirection", "screenDirectionSubject", "intent"]) {
    if (!text(camera[key], "")) errors.push(`${shotLabel} camera ไม่มี ${key}`);
  }
  if (camera.lensMm && !/^\d{1,3}(?:\.\d+)?mm$/i.test(camera.lensMm)) errors.push(`${shotLabel} camera.lensMm ต้องอยู่ในรูปตัวเลข เช่น 35mm`);
  requireEnum(errors, `${shotLabel} camera.shotSize`, camera.shotSize, SHOT_SIZES);
  requireEnum(errors, `${shotLabel} camera.angle`, camera.angle, CAMERA_ANGLES);
  requireEnum(errors, `${shotLabel} camera.perspective`, camera.perspective, CAMERA_PERSPECTIVES);
  requireEnum(errors, `${shotLabel} camera.height`, camera.height, CAMERA_HEIGHTS);
  requireEnum(errors, `${shotLabel} camera.screenDirectionCode`, camera.screenDirectionCode, SCREEN_DIRECTIONS);
  if (camera.screenDirectionSubject !== "none" && !(shot.subjects || []).includes(camera.screenDirectionSubject)) {
    errors.push(`${shotLabel} camera.screenDirectionSubject ต้องเป็น Subject ที่มองเห็นใน shot หรือ none`);
  }
  if (camera.screenDirectionSubject === "none" && !["none", "stationary"].includes(camera.screenDirectionCode)) {
    errors.push(`${shotLabel} screenDirectionSubject=none ต้องใช้ screenDirectionCode เป็น none หรือ stationary`);
  }

  const movement = camera.primaryMovement;
  if (!movement || typeof movement !== "object") {
    errors.push(`${shotLabel} camera ไม่มี primaryMovement แบบ object`);
  } else {
    requireEnum(errors, `${shotLabel} camera.primaryMovement.type`, movement.type, CAMERA_MOVEMENTS);
    for (const key of ["direction", "speed", "motivation"]) {
      if (!text(movement[key], "")) errors.push(`${shotLabel} camera.primaryMovement ไม่มี ${key}`);
    }
    requireEnum(errors, `${shotLabel} camera.primaryMovement.speed`, movement.speed, CAMERA_SPEEDS);
    const direction = text(movement.direction, "").toLowerCase();
    if (movement.type === "locked-off") {
      if (direction !== "none") errors.push(`${shotLabel} locked-off ต้องใช้ direction=none`);
      if (movement.speed !== "static") errors.push(`${shotLabel} locked-off ต้องใช้ speed=static`);
    } else if (movement.speed === "static") {
      errors.push(`${shotLabel} ${movement.type || "camera movement"} ห้ามใช้ speed=static`);
    }
    if (movement.type === "pan" && !/^(left|right|ซ้าย|ขวา)$/iu.test(direction)) errors.push(`${shotLabel} pan ต้องใช้ direction ซ้าย/ขวาเท่านั้น`);
    if (movement.type === "tilt" && !/^(up|down|ขึ้น|ลง)$/iu.test(direction)) errors.push(`${shotLabel} tilt ต้องใช้ direction ขึ้น/ลงเท่านั้น`);
    if (["tracking", "trucking"].includes(movement.type) && ["", "unspecified", "none"].includes(direction)) errors.push(`${shotLabel} ${movement.type} ต้องระบุทิศทางสัมพันธ์กับ subject`);
    if (["dutch-angle", "worms-eye", "top-down"].includes(camera.angle) || movement.type === "dolly-zoom") {
      if (text(movement.motivation, "").length < 12) errors.push(`${shotLabel} เทคนิคมุม/กล้องเด่นต้องมี motivation ที่อธิบายหน้าที่ต่อเรื่อง`);
    }
  }

  const focus = camera.focus;
  if (!focus || typeof focus !== "object") {
    errors.push(`${shotLabel} camera.focus ต้องเป็น object`);
  } else {
    if (!text(focus.subject, "")) errors.push(`${shotLabel} camera.focus ไม่มี subject`);
    requireEnum(errors, `${shotLabel} camera.focus.depth`, focus.depth, FOCUS_DEPTHS);
    requireEnum(errors, `${shotLabel} camera.focus.transition`, focus.transition, FOCUS_TRANSITIONS);
  }

  if (!continuity || typeof continuity !== "object") {
    errors.push(`${shotLabel} ไม่มี cameraContinuity`);
  } else {
    for (const key of ["axis", "axisId", "eyeline", "eyelineMatchId", "changeMotivation", "previousShotBridge"]) {
      if (!text(continuity[key], "")) errors.push(`${shotLabel} cameraContinuity ไม่มี ${key}`);
    }
    requireEnum(errors, `${shotLabel} cameraContinuity.cameraSide`, continuity.cameraSide, CAMERA_SIDES);
    requireEnum(errors, `${shotLabel} cameraContinuity.axisTransition`, continuity.axisTransition, AXIS_TRANSITIONS);
    requireEnum(errors, `${shotLabel} cameraContinuity.eyelineDirection`, continuity.eyelineDirection, EYELINE_DIRECTIONS);
    requireEnum(errors, `${shotLabel} cameraContinuity.eyelineTransition`, continuity.eyelineTransition, EYELINE_TRANSITIONS);
    requireEnum(errors, `${shotLabel} cameraContinuity.entryDirection`, continuity.entryDirection, SCREEN_DIRECTIONS);
    requireEnum(errors, `${shotLabel} cameraContinuity.exitDirection`, continuity.exitDirection, SCREEN_DIRECTIONS);
    if (!previousShot) {
      if (continuity.axisTransition !== "initial" || continuity.eyelineTransition !== "initial") errors.push(`${shotLabel} แรกต้องใช้ axisTransition และ eyelineTransition เป็น initial`);
    } else {
      if (["motivated-cross", "new-axis"].includes(continuity.axisTransition) && text(continuity.changeMotivation, "").length < 12) errors.push(`${shotLabel} การเปลี่ยน axis ต้องมี changeMotivation ที่ชัดเจน`);
      if (continuity.eyelineTransition === "new-eyeline" && text(continuity.changeMotivation, "").length < 12) errors.push(`${shotLabel} การเปลี่ยน eyeline ต้องมี changeMotivation ที่ชัดเจน`);
      validateCrossShotContinuity(errors, shot, previousShot, shotLabel);
    }
  }

  const dialogueItems = Array.isArray(shot.dialogue) ? shot.dialogue : [];
  if (!Array.isArray(shot.dialogue)) errors.push(`${shotLabel} dialogue ต้องเป็น array`);
  for (const dialogue of dialogueItems) {
    if (!dialogue.speaker || !dialogue.language || !dialogue.line || !dialogue.performance) errors.push(`${shotLabel} dialogue ต้องมี speaker/language/line/performance`);
    if (!["on-camera", "offscreen", "voice-over"].includes(dialogue.delivery)) errors.push(`${shotLabel} dialogue.delivery ต้องเป็น on-camera|offscreen|voice-over`);
    if (typeof dialogue.lipSync !== "boolean") errors.push(`${shotLabel} dialogue.lipSync ต้องเป็น boolean`);
    if (dialogue.delivery === "on-camera" && !(shot.subjects || []).includes(dialogue.speaker)) errors.push(`${shotLabel} ผู้พูดแบบ on-camera ต้องอยู่ใน subjects`);
    if (dialogue.delivery === "offscreen" && !(shot.offscreenSubjects || []).includes(dialogue.speaker)) errors.push(`${shotLabel} ผู้พูดแบบ offscreen ต้องอยู่ใน offscreenSubjects`);
    if (dialogue.delivery !== "on-camera" && dialogue.lipSync === true) errors.push(`${shotLabel} dialogue นอกเฟรม/voice-over ต้องใช้ lipSync=false`);
    if (dialogue.delivery === "on-camera" && dialogue.lipSync === true) {
      if (!(shot.subjects || []).includes(dialogue.speaker)) errors.push(`${shotLabel} ผู้พูดที่ lip-sync ต้องอยู่ใน subjects`);
      if (!["ECU", "CU", "MCU", "MS", "MLS"].includes(camera.shotSize)) errors.push(`${shotLabel} lip-sync ใช้ shotSize ${camera.shotSize || "ไม่ระบุ"} ซึ่งเห็นใบหน้า/ปากไม่ชัดพอ`);
      if (camera.shotSize === "ECU" && !/(mouth|face|lip|ปาก|ใบหน้า)/iu.test(text(camera.focus?.subject, ""))) errors.push(`${shotLabel} ECU สำหรับ lip-sync ต้อง focus ที่ใบหน้าหรือปาก`);
    }
  }
  return errors;
}

export function describeCameraPlan(camera, continuity) {
  const plan = normalizeCameraPlan(camera, continuity);
  const movement = `${plan.primaryMovement.type}; direction ${plan.primaryMovement.direction}; speed ${plan.primaryMovement.speed}; motivation ${plan.primaryMovement.motivation}`;
  const focus = `${plan.focus.subject}; ${plan.focus.depth} depth; transition ${plan.focus.transition}`;
  return { ...plan, movement, focusDescription: focus };
}
