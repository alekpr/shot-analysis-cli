import { secondsToTime } from "./utils.js";

const REQUIRED_FINAL_SECTIONS = [
  "subject_definitions:",
  "summary:",
  "retention_analysis:",
  "detailed_description:",
  "overall_soundscape:",
  "non_diegetic_music:"
];

const REQUIRED_SEEDANCE_SECTIONS = [
  "REFERENCE_MAPPING:",
  "SEQUENCE_SPECIFICATION:",
  "TIMECODED_BEATS:",
  "GLOBAL_CONSTRAINTS:"
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeComparison(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function visibleActions(shot) {
  const beats = Array.isArray(shot?.actionBeats) ? shot.actionBeats : [];
  const values = beats.length ? beats.map((beat) => beat.action) : [shot?.action];
  return values.map(normalizeComparison).filter((value) => value.length >= 8);
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
    const duplicateSubjectHeading = new RegExp(`^${escapedPrefix}subject_definitions:\\s*\\r?\\n\\s*subject_definitions\\s*:\\s*`, "i");
    normalized = normalized.replace(duplicateSubjectHeading, `${prefix}subject_definitions:\n`);
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

export function normalizeSeedancePrompt(value, visualDirection) {
  let normalized = String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^```(?:text|plaintext|markdown)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const firstSection = /REFERENCE_MAPPING\s*:/i;
  const match = firstSection.exec(normalized);
  if (match) normalized = normalized.slice(match.index);
  for (const section of REQUIRED_SEEDANCE_SECTIONS) {
    const name = section.slice(0, -1);
    const heading = new RegExp(`^\\s*(?:#{1,6}\\s*)?(?:\\*{1,2})?${name}(?:\\*{1,2})?\\s*:`, "gim");
    normalized = normalized.replace(heading, section);
  }
  const metadata = ["Generator target: Seedance 2.5"];
  const normalizedLower = normalized.toLocaleLowerCase();
  if (visualDirection?.label && !normalizedLower.includes(visualDirection.label.toLocaleLowerCase())) {
    metadata.push(`Visual direction: ${visualDirection.label}`);
  }
  if (visualDirection?.mood && !normalizedLower.includes(visualDirection.mood.toLocaleLowerCase())) {
    metadata.push(`Mood: ${visualDirection.mood}`);
  }
  const missing = metadata.filter((item) => !normalizedLower.includes(item.toLocaleLowerCase()));
  if (missing.length) {
    normalized = normalized.replace(/^SEQUENCE_SPECIFICATION:[ \t]*(?:\r?\n)?/m, `SEQUENCE_SPECIFICATION:\n${missing.join("\n")}\n`);
  }
  return normalized.trim();
}

export function normalizeGenerationPrompt(value, generationTarget = "minimax-h3", prefix = "DY,", visualDirection) {
  return generationTarget === "seedance-2.5"
    ? normalizeSeedancePrompt(value, visualDirection)
    : normalizeFinalPrompt(value, prefix, visualDirection);
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
  const shotRecommendation = value?.shotCountRecommendation;
  const recommended = Number(shotRecommendation?.recommended);
  const minimum = Number(shotRecommendation?.minimum);
  const maximum = Number(shotRecommendation?.maximum);
  if (![recommended, minimum, maximum].every((number) => Number.isInteger(number) && number >= 1 && number <= 100)) {
    errors.push("analysis ต้องมี shotCountRecommendation เป็นจำนวนเต็ม 1-100");
  } else if (minimum > recommended || recommended > maximum) {
    errors.push("shotCountRecommendation ต้องเรียง minimum <= recommended <= maximum");
  }
  if (!String(shotRecommendation?.rationale || "").trim()) errors.push("shotCountRecommendation ต้องมี rationale");
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

export function validateShots(value, expectedDuration, expectedShotCount) {
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
    for (const key of ["beat", "storyPhase", "objective", "cinematicIntent", "attentionFocus", "visualPayoff", "setting", "spatialAnchor", "startState", "causalLink", "action", "endState", "composition", "lighting"]) {
      if (!String(shot[key] || "").trim()) errors.push(`${shotLabel} ไม่มี ${key}`);
    }
    if (shot.storyPhase && !["hook", "setup", "escalation", "turn", "climax", "resolution", "tease"].includes(shot.storyPhase)) {
      errors.push(`${shotLabel} มี storyPhase ไม่ถูกต้อง`);
    }
    if (index === 0 && shot.storyPhase !== "hook") errors.push("Shot 1 ต้องมี storyPhase เป็น hook");
    if (!Array.isArray(shot.subjects)) errors.push(`${shotLabel} ต้องมี subjects เป็น array`);
    if (!Array.isArray(shot.offscreenSubjects)) errors.push(`${shotLabel} ต้องมี offscreenSubjects เป็น array`);
    const visibleSubjects = new Set(shot.subjects || []);
    for (const subject of shot.offscreenSubjects || []) {
      if (visibleSubjects.has(subject)) errors.push(`${shotLabel} ระบุ ${subject} ซ้ำทั้ง subjects และ offscreenSubjects`);
    }
    if (index > 0 && !String(shot.continuityBridge || "").trim()) errors.push(`${shotLabel} ไม่มี continuityBridge จาก shot ก่อนหน้า`);
    if (!Array.isArray(shot.actionBeats) || shot.actionBeats.length === 0) {
      errors.push(`${shotLabel} ต้องมี actionBeats`);
    } else {
      shot.actionBeats.forEach((beat, beatIndex) => {
        if (Number(beat.order) !== beatIndex + 1 || !beat.action || !beat.result) {
          errors.push(`${shotLabel} actionBeats ต้องเรียง order และมี action/result`);
        }
        const beatStart = Number(beat.startOffset);
        const beatEnd = Number(beat.endOffset);
        if (![beatStart, beatEnd].every(Number.isFinite) || beatStart < 0 || beatEnd <= beatStart || beatEnd > duration) {
          errors.push(`${shotLabel} action beat ${beatIndex + 1} มีช่วงเวลาไม่ถูกต้อง`);
        }
        if (beatIndex > 0 && beatStart < Number(shot.actionBeats[beatIndex - 1].endOffset) - 0.01) {
          errors.push(`${shotLabel} action beat ${beatIndex + 1} ซ้อนกับ beat ก่อนหน้า`);
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
    if (index > 0) {
      const previous = shots[index - 1];
      const previousActions = new Set(visibleActions(previous));
      const duplicatedActions = visibleActions(shot).filter((action) => previousActions.has(action));
      if (duplicatedActions.length) {
        errors.push(`${shotLabel} มี action ซ้ำกับ Shot ${index}: ${duplicatedActions.join(", ")}`);
      }
    }
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
  if (expectedShotCount !== undefined && shots.length !== Number(expectedShotCount)) {
    errors.push(`shot list มี ${shots.length} shots แต่ผู้ใช้เลือก ${Number(expectedShotCount)} shots`);
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
  const objectKeys = new Set();
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
    if (asset.assetType === "object") {
      const objectKey = normalizeComparison(asset.objectKey);
      if (!objectKey) errors.push(`${label || `asset ${index + 1}`} ต้องมี objectKey สำหรับวัตถุหลักเพียงชนิดเดียว`);
      if (objectKey && objectKeys.has(objectKey)) errors.push(`${label} มี objectKey ซ้ำ ${asset.objectKey}`);
      if (objectKey) objectKeys.add(objectKey);
    }
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

function motionSentences(block) {
  const motionWords = /\b(move|moves|moved|moving|reach|reaches|reached|reaching|turn|turns|turned|turning|walk|walks|walked|walking|run|runs|ran|running|raise|raises|raised|raising|lower|lowers|lowered|lowering|lift|lifts|lifted|lifting|withdraw|withdraws|withdrew|withdrawing|touch|touches|touched|touching|grab|grabs|grabbed|grabbing|release|releases|released|releasing|step|steps|stepped|stepping|open|opens|opened|opening|close|closes|closed|closing|fall|falls|fell|falling|sit|sits|sat|sitting|stand|stands|stood|standing)\b/i;
  return block
    .split(/(?<=[.!?])\s+/)
    .map(normalizeComparison)
    .filter((sentence) => sentence.length >= 45 && motionWords.test(sentence));
}

export function validateFinalPrompt(value, prefix = "DY,", expectedShotCount = 0, visualDirection, referenceAssets, shotList, story) {
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
    const name = section.slice(0, -1);
    const prefixPattern = name === "subject_definitions" ? `(?:${escapeRegExp(prefix)}\\s*)?` : "";
    const occurrences = value.match(new RegExp(`^\\s*${prefixPattern}${name}\\s*:`, "gim")) || [];
    if (occurrences.length > 1) errors.push(`prompt มี ${section} ซ้ำ`);
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
    let previousMotionSentences = new Set();
    const characterIds = new Set((story?.characters || []).map((character) => String(character.id || "").trim()).filter(Boolean));
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
      const allowedCharacters = new Set([...(shot.subjects || []), ...(shot.offscreenSubjects || [])]);
      const mentionedCharacters = [...block.matchAll(/<((?:Subject)\s+\d+)>/gi)].map((match) => match[1]);
      for (const subject of new Set(mentionedCharacters)) {
        if (characterIds.has(subject) && !allowedCharacters.has(subject)) {
          errors.push(`[Shot ${shot.number}] กล่าวถึง <${subject}> แต่ไม่ได้ระบุใน subjects หรือ offscreenSubjects`);
        }
      }
      for (const dialogue of shot.dialogue || []) {
        const language = dialogue.language || "English";
        if (!block.includes(`<d>[${language}] ${dialogue.line}</d>`)) {
          errors.push(`[Shot ${shot.number}] ไม่มีบทพูดของ ${dialogue.speaker} ในรูปแบบ <d>[${language}] ...</d>`);
        }
      }
      const currentMotionSentences = motionSentences(block);
      const duplicates = currentMotionSentences.filter((sentence) => previousMotionSentences.has(sentence));
      if (duplicates.length) errors.push(`[Shot ${shot.number}] บรรยาย motion ซ้ำกับ shot ก่อนหน้า`);
      previousMotionSentences = new Set(currentMotionSentences);
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
  if (/\[cite\s*:/i.test(value)) errors.push("prompt มี citation marker ที่ไม่ควรส่งให้ video generator");
  return errors;
}

function seedanceBeatBlock(value, number) {
  const sectionStart = value.indexOf("TIMECODED_BEATS:");
  const sectionEnd = value.indexOf("GLOBAL_CONSTRAINTS:");
  if (sectionStart < 0) return "";
  const section = value.slice(sectionStart, sectionEnd < 0 ? undefined : sectionEnd);
  const start = section.indexOf(`[Beat ${number}]`);
  if (start < 0) return "";
  const next = section.indexOf(`[Beat ${number + 1}]`, start + 1);
  return section.slice(start, next < 0 ? undefined : next).trim();
}

export function validateSeedancePrompt(value, expectedShotCount = 0, visualDirection, referenceAssets, shotList) {
  const errors = [];
  if (!value.trimStart().startsWith("REFERENCE_MAPPING:")) errors.push("prompt ต้องเริ่มด้วย REFERENCE_MAPPING:");
  let previous = -1;
  for (const section of REQUIRED_SEEDANCE_SECTIONS) {
    const index = value.indexOf(section);
    if (index < 0) errors.push(`prompt ไม่มี ${section}`);
    if (index >= 0 && index < previous) errors.push(`ลำดับ ${section} ไม่ถูกต้อง`);
    if (index >= 0) previous = index;
    const occurrences = value.match(new RegExp(`^\\s*${section}`, "gim")) || [];
    if (occurrences.length > 1) errors.push(`prompt มี ${section} ซ้ำ`);
  }
  if (!/Generator target:\s*Seedance 2\.5/i.test(value)) errors.push("prompt ไม่มี Generator target: Seedance 2.5");
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
    const number = String(pictureId).match(/Picture\s+(\d+)/i)?.[1];
    if (!number || !value.includes(`@Image${number}`) || !value.includes(`<${pictureId}>`)) {
      errors.push(`prompt ไม่มี mapping @Image${number || "?"} = <${pictureId}>`);
    }
  }
  for (let number = 1; number <= expectedShotCount; number += 1) {
    if (!value.includes(`[Beat ${number}]`)) errors.push(`prompt ไม่มี [Beat ${number}]`);
  }
  if (Array.isArray(shotList?.shots)) {
    for (const shot of shotList.shots) {
      const block = seedanceBeatBlock(value, Number(shot.number));
      if (!block) continue;
      const expectedRange = `[Beat ${shot.number}] ${secondsToTime(shot.startTime)}-${secondsToTime(shot.endTime)}`;
      if (!block.startsWith(expectedRange)) errors.push(`[Beat ${shot.number}] ต้องเริ่มด้วย ${expectedRange}`);
      if (block.length < 300) errors.push(`[Beat ${shot.number}] มีรายละเอียดสั้นเกินไปสำหรับ production prompt`);
      for (const subject of shot.subjects || []) {
        if (!block.includes(`<${subject}>`)) errors.push(`[Beat ${shot.number}] ไม่กล่าวถึง <${subject}>`);
      }
      for (const dialogue of shot.dialogue || []) {
        const language = dialogue.language || "English";
        if (!block.includes(`<d>[${language}] ${dialogue.line}</d>`)) {
          errors.push(`[Beat ${shot.number}] ไม่มีบทพูดของ ${dialogue.speaker} ในรูปแบบ <d>[${language}] ...</d>`);
        }
      }
    }
  }
  if (/\[cite\s*:/i.test(value)) errors.push("prompt มี citation marker ที่ไม่ควรส่งให้ video generator");
  if (/DY,subject_definitions:/i.test(value)) errors.push("Seedance prompt ต้องไม่ใช้โครงสร้าง DY,subject_definitions");
  return errors;
}

export function validateGenerationPrompt(value, generationTarget = "minimax-h3", prefix = "DY,", expectedShotCount = 0, visualDirection, referenceAssets, shotList, story) {
  return generationTarget === "seedance-2.5"
    ? validateSeedancePrompt(value, expectedShotCount, visualDirection, referenceAssets, shotList, story)
    : validateFinalPrompt(value, prefix, expectedShotCount, visualDirection, referenceAssets, shotList, story);
}
