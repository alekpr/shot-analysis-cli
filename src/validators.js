const REQUIRED_FINAL_SECTIONS = [
  "subject_definitions:",
  "summary:",
  "retention_analysis:",
  "detailed_description:",
  "overall_soundscape:",
  "non_diegetic_music:"
];

export function validateAnalysis(value) {
  const errors = [];
  if (!value || typeof value !== "object") errors.push("analysis ต้องเป็น object");
  if (!value?.title) errors.push("analysis ไม่มี title");
  if (!Number.isFinite(Number(value?.durationSeconds)) || Number(value.durationSeconds) <= 0) {
    errors.push("durationSeconds ต้องมากกว่า 0");
  }
  if (!Array.isArray(value?.clarificationQuestions)) errors.push("clarificationQuestions ต้องเป็น array");
  if (!value?.visualDirection || !["explicit", "missing"].includes(value.visualDirection.source)) {
    errors.push("analysis ต้องมี visualDirection.source เป็น explicit หรือ missing");
  }
  return errors;
}

export function validateStory(value) {
  const errors = [];
  for (const key of ["title", "logline", "hook", "climax", "ending"]) {
    if (!value?.[key]) errors.push(`story ไม่มี ${key}`);
  }
  if (!Array.isArray(value?.characters) || value.characters.length === 0) errors.push("story ต้องมี characters");
  if (!value?.visualDirection?.label) errors.push("story ต้องมี visualDirection");
  return errors;
}

export function validateShots(value) {
  const errors = [];
  const shots = value?.shots;
  if (!Array.isArray(shots) || shots.length === 0) return ["shot list ไม่มี shots"];
  let expectedStart = 0;
  shots.forEach((shot, index) => {
    const start = Number(shot.startTime);
    const end = Number(shot.endTime);
    const duration = Number(shot.duration);
    if (Math.abs(start - expectedStart) > 0.01) errors.push(`Shot ${index + 1} เริ่มที่ ${start} แต่ควรเริ่มที่ ${expectedStart}`);
    if (!(end > start)) errors.push(`Shot ${index + 1} มีช่วงเวลาไม่ถูกต้อง`);
    if (Math.abs(end - start - duration) > 0.02) errors.push(`Shot ${index + 1} duration ไม่ตรงกับ start/end`);
    expectedStart = end;
  });
  const target = Number(value.durationSeconds);
  if (Math.abs(expectedStart - target) > 0.02) errors.push(`เวลารวม ${expectedStart} ไม่ตรงกับ durationSeconds ${target}`);
  return errors;
}

export function validateFinalPrompt(value, prefix = "DY,", expectedShotCount = 0, visualDirection) {
  const errors = [];
  if (!value.trimStart().startsWith(`${prefix}subject_definitions:`)) {
    errors.push(`prompt ต้องเริ่มด้วย ${prefix}subject_definitions:`);
  }
  let previous = -1;
  for (const section of REQUIRED_FINAL_SECTIONS) {
    const index = value.indexOf(section);
    if (index < 0) errors.push(`prompt ไม่มี ${section}`);
    if (index >= 0 && index < previous) errors.push(`ลำดับ ${section} ไม่ถูกต้อง`);
    if (index >= 0) previous = index;
  }
  if (/<Environment\s+\d+>/i.test(value)) {
    errors.push("ต้องนิยามสภาพแวดล้อมเป็น <Subject N> ห้ามใช้ <Environment N>");
  }
  for (let number = 1; number <= expectedShotCount; number += 1) {
    if (!value.includes(`[Shot ${number}]`)) errors.push(`prompt ไม่มี [Shot ${number}]`);
    if (number >= 2) {
      const timestamp = new RegExp(`\\[Shot ${number}\\]\\s+At\\s+\\d{2}:\\d{2}\\.\\d{3}`);
      if (!timestamp.test(value)) errors.push(`[Shot ${number}] ไม่มีเวลาเริ่มรูปแบบ At 00:00.000`);
    }
  }
  if (visualDirection?.label && !value.toLocaleLowerCase().includes(visualDirection.label.toLocaleLowerCase())) {
    errors.push(`prompt ไม่มี Visual direction: ${visualDirection.label}`);
  }
  if (visualDirection?.mood && !value.toLocaleLowerCase().includes(visualDirection.mood.toLocaleLowerCase())) {
    errors.push(`prompt ไม่มี Mood: ${visualDirection.mood}`);
  }
  return errors;
}
