export const CAMERA_ANGLES = ["eye-level", "high-angle", "low-angle", "worms-eye", "top-down", "dutch-angle", "ground-level"];
export const CAMERA_PERSPECTIVES = ["objective", "ots", "pov"];
export const CAMERA_HEIGHTS = ["ground", "low", "waist", "chest", "shoulder", "eye", "high", "overhead"];
export const SHOT_SIZES = ["ECU", "CU", "MCU", "MS", "MLS", "LS", "ELS"];
export const CAMERA_MOVEMENTS = ["locked-off", "pan", "tilt", "dolly-in", "dolly-out", "zoom-in", "zoom-out", "tracking", "trucking", "crane", "jib", "dolly-zoom", "handheld", "steadicam", "gimbal", "arc", "orbit"];
export const CAMERA_SPEEDS = ["static", "very-slow", "slow", "moderate", "fast"];
export const FOCUS_DEPTHS = ["deep", "moderate", "shallow"];
export const FOCUS_TRANSITIONS = ["none", "rack-focus"];

function text(value, fallback = "unspecified") {
  return String(value || "").trim() || fallback;
}

function inferMovement(value) {
  const raw = text(value, "locked-off").toLowerCase();
  return CAMERA_MOVEMENTS.find((item) => raw.includes(item))
    || (raw.includes("push") ? "dolly-in" : raw.includes("pull") ? "dolly-out" : raw.includes("locked") || raw.includes("static") ? "locked-off" : "custom");
}

export function normalizeCameraPlan(camera = {}, continuity = {}) {
  const movement = camera.primaryMovement && typeof camera.primaryMovement === "object"
    ? camera.primaryMovement
    : {
        type: inferMovement(camera.movement),
        direction: text(camera.movement, "none"),
        speed: "unspecified",
        motivation: text(camera.movement, "preserve the approved framing")
      };
  const focus = camera.focus && typeof camera.focus === "object"
    ? camera.focus
    : { subject: text(camera.focus), depth: "unspecified", transition: "none" };
  return {
    lensMm: text(camera.lensMm),
    shotSize: text(camera.shotSize),
    angle: text(camera.angle),
    perspective: text(camera.perspective, "objective"),
    height: text(camera.height),
    position: text(camera.position),
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
    screenDirection: text(camera.screenDirection),
    intent: text(camera.intent),
    continuity: {
      axis: text(continuity.axis),
      eyeline: text(continuity.eyeline),
      entryDirection: text(continuity.entryDirection),
      previousShotBridge: text(continuity.previousShotBridge)
    }
  };
}

function requireEnum(errors, label, value, allowed) {
  if (!allowed.includes(value)) errors.push(`${label} ต้องเป็น ${allowed.join("|")}`);
}

export function validateCameraPlan(shot, shotLabel) {
  const errors = [];
  const camera = shot?.camera;
  const continuity = shot?.cameraContinuity;
  if (!camera || typeof camera !== "object") return [`${shotLabel} camera ต้องเป็น object`];

  for (const key of ["lensMm", "position", "screenDirection", "intent"]) {
    if (!text(camera[key], "")) errors.push(`${shotLabel} camera ไม่มี ${key}`);
  }
  requireEnum(errors, `${shotLabel} camera.shotSize`, camera.shotSize, SHOT_SIZES);
  requireEnum(errors, `${shotLabel} camera.angle`, camera.angle, CAMERA_ANGLES);
  requireEnum(errors, `${shotLabel} camera.perspective`, camera.perspective, CAMERA_PERSPECTIVES);
  requireEnum(errors, `${shotLabel} camera.height`, camera.height, CAMERA_HEIGHTS);

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
    if (movement.type === "pan" && /\b(up|down|ขึ้น|ลง)\b/i.test(direction)) errors.push(`${shotLabel} pan ต้องใช้ทิศซ้าย/ขวา; การขึ้น/ลงต้องใช้ tilt`);
    if (movement.type === "tilt" && /\b(left|right|ซ้าย|ขวา)\b/i.test(direction)) errors.push(`${shotLabel} tilt ต้องใช้ทิศขึ้น/ลง; การซ้าย/ขวาต้องใช้ pan`);
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
    for (const key of ["axis", "eyeline", "entryDirection", "previousShotBridge"]) {
      if (!text(continuity[key], "")) errors.push(`${shotLabel} cameraContinuity ไม่มี ${key}`);
    }
  }

  if ((shot.dialogue || []).length && !["CU", "MCU", "MS", "MLS"].includes(camera.shotSize)) {
    errors.push(`${shotLabel} มีบทพูดแต่ shotSize ${camera.shotSize || "ไม่ระบุ"} ไม่เห็นใบหน้า/ปากชัดพอสำหรับ lip-sync`);
  }
  return errors;
}

export function describeCameraPlan(camera, continuity) {
  const plan = normalizeCameraPlan(camera, continuity);
  const movement = `${plan.primaryMovement.type}; direction ${plan.primaryMovement.direction}; speed ${plan.primaryMovement.speed}; motivation ${plan.primaryMovement.motivation}`;
  const focus = `${plan.focus.subject}; ${plan.focus.depth} depth; transition ${plan.focus.transition}`;
  return { ...plan, movement, focusDescription: focus };
}
