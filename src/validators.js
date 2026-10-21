import { secondsToTime } from "./utils.js";

const REQUIRED_FINAL_SECTIONS = [
  "subject_definitions:",
  "summary:",
  "retention_analysis:",
  "detailed_description:",
  "overall_soundscape:",
  "non_diegetic_music:"
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeFinalPrompt(value, prefix = "DY,", visualDirection) {
  let normalized = String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^```(?:text|plaintext|markdown)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const escapedPrefix = escapeRegExp(prefix.trim());
  const firstSection = new RegExp(`(?:${escapedPrefix}\\s*)?subject_definitions\\s*:`, "i");
  const match = firstSection.exec(normalized);
  if (match) {
    normalized = normalized.slice(match.index);
    normalized = normalized.replace(firstSection, `${prefix}subject_definitions:`);
  }

  for (const section of REQUIRED_FINAL_SECTIONS.slice(1)) {
    const name = section.slice(0, -1);
    const heading = new RegExp(`^\\s*(?:#{1,6}\\s*)?(?:\\*{1,2})?${name}(?:\\*{1,2})?\\s*:`, "gim");
    normalized = normalized.replace(heading, `${section}`);
  }

  const metadata = [];
  const normalizedLower = normalized.toLocaleLowerCase();
  if (visualDirection?.label && !normalizedLower.includes(visualDirection.label.toLocaleLowerCase())) {
    metadata.push(`Visual direction: ${visualDirection.label}`);
  }
  if (visualDirection?.mood && !normalizedLower.includes(visualDirection.mood.toLocaleLowerCase())) {
    metadata.push(`Mood: ${visualDirection.mood}`);
  }
  if (metadata.length) {
    normalized = normalized.replace(/^summary:[ \t]*(?:\r?\n)?/m, `summary:\n${metadata.join("\n")}\n`);
  }
  return normalized.trim();
}

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

export function validateShots(value, expectedDuration) {
  const errors = [];
  const shots = value?.shots;
  if (!Array.isArray(shots) || shots.length === 0) return ["shot list ไม่มี shots"];
  let expectedStart = 0;
  shots.forEach((shot, index) => {
    const shotLabel = `Shot ${index + 1}`;
    const start = Number(shot.startTime);
    const end = Number(shot.endTime);
    const duration = Number(shot.duration);
    if (Number(shot.number) !== index + 1) errors.push(`${shotLabel} มี number ไม่ต่อเนื่อง`);
    if (![start, end, duration].every(Number.isFinite)) {
      errors.push(`${shotLabel} ต้องมี startTime/endTime/duration เป็นตัวเลข`);
    } else {
      if (Math.abs(start - expectedStart) > 0.01) errors.push(`${shotLabel} เริ่มที่ ${start} แต่ควรเริ่มที่ ${expectedStart}`);
      if (!(end > start)) errors.push(`${shotLabel} มีช่วงเวลาไม่ถูกต้อง`);
      if (Math.abs(end - start - duration) > 0.02) errors.push(`${shotLabel} duration ไม่ตรงกับ start/end`);
    }
    for (const key of ["beat", "storyPhase", "objective", "setting", "spatialAnchor", "startState", "action", "endState", "composition", "lighting"]) {
      if (!String(shot[key] || "").trim()) errors.push(`${shotLabel} ไม่มี ${key}`);
    }
    if (shot.storyPhase && !["hook", "setup", "escalation", "turn", "climax", "resolution", "tease"].includes(shot.storyPhase)) {
      errors.push(`${shotLabel} มี storyPhase ไม่ถูกต้อง`);
    }
    if (index === 0 && shot.storyPhase !== "hook") errors.push("Shot 1 ต้องมี storyPhase เป็น hook");
    if (!Array.isArray(shot.subjects)) errors.push(`${shotLabel} ต้องมี subjects เป็น array`);
    if (!Array.isArray(shot.actionBeats) || shot.actionBeats.length === 0) {
      errors.push(`${shotLabel} ต้องมี actionBeats`);
    } else {
      shot.actionBeats.forEach((beat, beatIndex) => {
        if (Number(beat.order) !== beatIndex + 1 || !beat.action || !beat.result) {
          errors.push(`${shotLabel} actionBeats ต้องเรียง order และมี action/result`);
        }
      });
    }
    for (const key of ["lensMm", "shotSize", "angle", "position", "movement", "focus"]) {
      if (!String(shot.camera?.[key] || "").trim()) errors.push(`${shotLabel} camera ไม่มี ${key}`);
    }
    if (!shot.sound || !Array.isArray(shot.sound.syncEffects)) errors.push(`${shotLabel} ต้องมี sound และ syncEffects`);
    if (!shot.transition?.type || !shot.transition?.motivation) errors.push(`${shotLabel} ต้องมี transition type/motivation`);
    if (!Array.isArray(shot.continuityIn) || !Array.isArray(shot.continuityOut)) errors.push(`${shotLabel} ต้องมี continuityIn/continuityOut`);
    if (!shot.emotion?.start || !shot.emotion?.end || !shot.emotion?.visibleCue) errors.push(`${shotLabel} ต้องมี emotion start/end/visibleCue`);
    if (!Array.isArray(shot.negativeConstraints)) errors.push(`${shotLabel} ต้องมี negativeConstraints เป็น array`);
    if (Number.isFinite(end)) expectedStart = end;
  });
  const target = Number(value.durationSeconds);
  const totalDuration = Number(value.totalDuration);
  if (!Number.isFinite(target) || target <= 0) errors.push("durationSeconds ต้องเป็นตัวเลขมากกว่า 0");
  if (Number.isFinite(target) && Math.abs(expectedStart - target) > 0.02) errors.push(`เวลารวม ${expectedStart} ไม่ตรงกับ durationSeconds ${target}`);
  if (!Number.isFinite(totalDuration) || !Number.isFinite(target) || Math.abs(totalDuration - target) > 0.02) errors.push("totalDuration ไม่ตรงกับ durationSeconds");
  if (expectedDuration !== undefined && Number.isFinite(target) && Math.abs(target - Number(expectedDuration)) > 0.02) {
    errors.push(`durationSeconds ${target} ไม่ตรงกับ STORY ${Number(expectedDuration)}`);
  }
  if (!Array.isArray(value.continuityChecklist) || value.continuityChecklist.length === 0) {
    errors.push("shot list ต้องมี continuityChecklist");
  }
  return errors;
}

export function validateReferencePrompts(value, existingReferenceLabels = []) {
  const errors = [];
  if (!value || typeof value !== "object") return ["reference prompts ต้องเป็น object"];
  if (!value.globalStyle?.visualDirection) errors.push("reference prompts ไม่มี globalStyle.visualDirection");
  if (!Array.isArray(value.assets) || value.assets.length === 0) return [...errors, "reference prompts ไม่มี assets"];

  const normalizePictureId = (item) => String(item || "").trim().replace(/^<|>$/g, "").toLowerCase();
  const existing = new Set(existingReferenceLabels.map(normalizePictureId));
  const existingNumbers = existingReferenceLabels
    .map((item) => Number(String(item).replace(/^<|>$/g, "").match(/^Picture (\d+)$/i)?.[1]))
    .filter(Number.isFinite);
  const firstNewPictureNumber = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;
  const returnedExisting = new Set((value.existingReferences || []).map((item) => normalizePictureId(item.pictureId)));
  for (const expected of existing) {
    if (!returnedExisting.has(expected)) errors.push(`existingReferences ไม่มี ${expected}`);
  }
  const seen = new Set();
  let hasCharacter = false;
  let hasLocation = false;
  value.assets.forEach((asset, index) => {
    const label = String(asset.pictureId || "").trim();
    const normalized = normalizePictureId(label);
    if (!/^Picture \d+$/.test(label)) errors.push(`asset ${index + 1} มี pictureId ไม่ถูกต้อง`);
    if (label !== `Picture ${firstNewPictureNumber + index}`) {
      errors.push(`asset ${index + 1} ต้องใช้ Picture ${firstNewPictureNumber + index}`);
    }
    if (existing.has(normalized)) errors.push(`${label} ซ้ำกับ reference ที่มีอยู่แล้ว`);
    if (seen.has(normalized)) errors.push(`${label} ซ้ำใน assets`);
    seen.add(normalized);
    if (!["character", "location", "object"].includes(asset.assetType)) errors.push(`${label || `asset ${index + 1}`} มี assetType ไม่ถูกต้อง`);
    if (!asset.prompt || !asset.negativePrompt) errors.push(`${label || `asset ${index + 1}`} ต้องมี prompt และ negativePrompt`);
    if (!Array.isArray(asset.usedInShots)) errors.push(`${label || `asset ${index + 1}`} ต้องมี usedInShots`);
    if (asset.assetType === "character") hasCharacter = true;
    if (asset.assetType === "location") hasLocation = true;
  });
  if (!hasCharacter) errors.push("reference prompts ต้องมี character sheet อย่างน้อย 1 รายการ");
  if (!hasLocation) errors.push("reference prompts ต้องมี location อย่างน้อย 1 รายการ");
  return errors;
}

function shotBlock(value, number) {
  const detailedStart = value.indexOf("detailed_description:");
  const detailedEnd = value.indexOf("overall_soundscape:");
  if (detailedStart < 0) return "";
  const detailed = value.slice(detailedStart, detailedEnd < 0 ? undefined : detailedEnd);
  const start = detailed.indexOf(`[Shot ${number}]`);
  if (start < 0) return "";
  const next = detailed.indexOf(`[Shot ${number + 1}]`, start + 1);
  return detailed.slice(start, next < 0 ? undefined : next).trim();
}

export function validateFinalPrompt(value, prefix = "DY,", expectedShotCount = 0, visualDirection, referenceAssets, shotList) {
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
  if (Array.isArray(shotList?.shots)) {
    for (const shot of shotList.shots) {
      const block = shotBlock(value, Number(shot.number));
      if (!block) continue;
      if (block.length < 300) errors.push(`[Shot ${shot.number}] มีรายละเอียดสั้นเกินไปสำหรับ production prompt`);
      if (Number(shot.number) >= 2) {
        const expectedTimestamp = secondsToTime(shot.startTime);
        if (!block.startsWith(`[Shot ${shot.number}] At ${expectedTimestamp}`)) {
          errors.push(`[Shot ${shot.number}] ต้องเริ่มเวลา At ${expectedTimestamp}`);
        }
      }
      for (const subject of shot.subjects || []) {
        if (!block.includes(`<${subject}>`)) errors.push(`[Shot ${shot.number}] ไม่กล่าวถึง <${subject}>`);
      }
      for (const dialogue of shot.dialogue || []) {
        const language = dialogue.language || "English";
        if (!block.includes(`<d>[${language}] ${dialogue.line}</d>`)) {
          errors.push(`[Shot ${shot.number}] ไม่มีบทพูดของ ${dialogue.speaker} ในรูปแบบ <d>[${language}] ...</d>`);
        }
      }
    }
  }
  if (visualDirection?.label && !value.toLocaleLowerCase().includes(visualDirection.label.toLocaleLowerCase())) {
    errors.push(`prompt ไม่มี Visual direction: ${visualDirection.label}`);
  }
  if (visualDirection?.mood && !value.toLocaleLowerCase().includes(visualDirection.mood.toLocaleLowerCase())) {
    errors.push(`prompt ไม่มี Mood: ${visualDirection.mood}`);
  }
  const pictureIds = [
    ...(referenceAssets?.existingReferences || []).map((item) => item.pictureId),
    ...(referenceAssets?.assets || []).map((item) => item.pictureId)
  ].filter(Boolean);
  for (const pictureId of pictureIds) {
    if (!value.includes(`<${pictureId}>`)) errors.push(`prompt ไม่มี <${pictureId}> จาก reference assets`);
  }
  return errors;
}
