import { secondsToTime } from "./utils.js";
import { normalizeCameraPlan, validateCameraPlan } from "./camera.js";

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
  if (!Array.isArray(value?.assetManifest?.locations) || value.assetManifest.locations.length === 0) {
    errors.push("story ต้องมี assetManifest.locations");
  }
  if (!Array.isArray(value?.assetManifest?.objects)) errors.push("story ต้องมี assetManifest.objects เป็น array");
  for (const type of ["locations", "objects"]) {
    const items = value?.assetManifest?.[type] || [];
    const ids = items.map((item) => String(item.id || "").trim()).filter(Boolean);
    if (ids.length !== items.length) errors.push(`assetManifest.${type} ทุก item ต้องมี id`);
    if (new Set(ids).size !== ids.length) errors.push(`assetManifest.${type} มี id ซ้ำ`);
  }
  return errors;
}

export function validateShots(value, expectedDuration, expectedShotCount, story) {
  const errors = [];
  const shots = value?.shots;
  if (!Array.isArray(shots) || shots.length === 0) return ["shot list ไม่มี shots"];
  const subjectIds = new Set((story?.characters || []).map((item) => String(item.id || "").trim()).filter(Boolean));
  const locationIds = new Set((story?.assetManifest?.locations || []).map((item) => String(item.id || "").trim()).filter(Boolean));
  const objectIds = new Set((story?.assetManifest?.objects || []).map((item) => String(item.id || "").trim()).filter(Boolean));
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
    if (subjectIds.size) {
      for (const subject of [...(shot.subjects || []), ...(shot.offscreenSubjects || [])]) {
        if (!subjectIds.has(subject)) errors.push(`${shotLabel} อ้าง subject ที่ไม่มีใน STORY: ${subject}`);
      }
    }
    if (!String(shot.referenceNeeds?.locationKey || "").trim()) errors.push(`${shotLabel} ไม่มี referenceNeeds.locationKey`);
    if (!Array.isArray(shot.referenceNeeds?.objectKeys)) errors.push(`${shotLabel} ต้องมี referenceNeeds.objectKeys เป็น array`);
    if (locationIds.size && shot.referenceNeeds?.locationKey && !locationIds.has(shot.referenceNeeds.locationKey)) {
      errors.push(`${shotLabel} อ้าง locationKey ที่ไม่มีใน assetManifest: ${shot.referenceNeeds.locationKey}`);
    }
    if (objectIds.size) {
      for (const objectKey of shot.referenceNeeds?.objectKeys || []) {
        if (!objectIds.has(objectKey)) errors.push(`${shotLabel} อ้าง objectKey ที่ไม่มีใน assetManifest: ${objectKey}`);
      }
    }
    const objectKeys = (shot.referenceNeeds?.objectKeys || []).map(normalizeComparison).filter(Boolean);
    if (new Set(objectKeys).size !== objectKeys.length) errors.push(`${shotLabel} มี referenceNeeds.objectKeys ซ้ำกัน`);
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
    errors.push(...validateCameraPlan(shot, shotLabel, index > 0 ? shots[index - 1] : undefined));
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

export function validateReferencePrompts(value, existingReferenceLabels = [], story, shotList) {
  const errors = [];
  if (!value || typeof value !== "object") return ["reference prompts ต้องเป็น object"];
  if (!value.globalStyle?.visualDirection) errors.push("reference prompts ไม่มี globalStyle.visualDirection");
  if (!Array.isArray(value.assets)) return [...errors, "reference prompts ไม่มี assets"];
  if (value.assets.length === 0 && !(value.existingReferences || []).length) return [...errors, "reference prompts ไม่มี assets"];

  const normalizePictureId = (item) => String(item || "").trim().replace(/^<|>$/g, "").toLowerCase();
  const existing = new Set(existingReferenceLabels.map(normalizePictureId));
  const existingNumbers = existingReferenceLabels
    .map((item) => Number(String(item).replace(/^<|>$/g, "").match(/^Picture (\d+)$/i)?.[1]))
    .filter(Number.isFinite);
  const firstNewPictureNumber = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;
  const returnedExisting = value.existingReferences || [];
  if (returnedExisting.length !== existingReferenceLabels.length) {
    errors.push(`existingReferences ต้องมี ${existingReferenceLabels.length} รายการตามข้อมูลเดิม`);
  }
  for (let index = 0; index < existingReferenceLabels.length; index += 1) {
    const expected = existingReferenceLabels[index];
    const actual = String(returnedExisting[index]?.pictureId || "").trim().replace(/^<|>$/g, "");
    if (normalizePictureId(actual) !== normalizePictureId(expected)) {
      errors.push(`existingReferences ลำดับ ${index + 1} ต้องเป็น ${expected} แต่ได้ ${actual || "ไม่มี"}`);
    }
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
    if (asset.assetType === "character") {
      hasCharacter = true;
      if (!Array.isArray(asset.linkedSubjects) || asset.linkedSubjects.length !== 1) errors.push(`${label} character ต้อง linkedSubjects เพียง 1 Subject`);
    }
    if (asset.assetType === "location") {
      hasLocation = true;
      if (!normalizeComparison(asset.locationKey)) errors.push(`${label} location ต้องมี locationKey`);
    }
    if (asset.assetType === "object") {
      const objectKey = normalizeComparison(asset.objectKey);
      if (!objectKey) errors.push(`${label || `asset ${index + 1}`} ต้องมี objectKey สำหรับวัตถุหลักเพียงชนิดเดียว`);
      if (objectKey && objectKeys.has(objectKey)) errors.push(`${label} มี objectKey ซ้ำ ${asset.objectKey}`);
      if (objectKey) objectKeys.add(objectKey);
    }
  });
  const references = [...(value.existingReferences || []), ...value.assets];
  hasCharacter ||= references.some((item) => item.assetType === "character");
  hasLocation ||= references.some((item) => item.assetType === "location");
  if (!hasCharacter) errors.push("reference prompts ต้องมี character sheet อย่างน้อย 1 รายการ");
  if (!hasLocation) errors.push("reference prompts ต้องมี location อย่างน้อย 1 รายการ");
  const shots = shotList?.shots || [];
  const validShotNumbers = new Set(shots.map((shot) => Number(shot.number)));
  if (Array.isArray(shotList?.shots)) {
    for (const reference of references) {
      const pictureId = reference.pictureId || "reference";
      for (const shotNumber of reference.usedInShots || []) {
        if (!validShotNumbers.has(Number(shotNumber))) errors.push(`${pictureId} ใช้ shot ${shotNumber} ที่ไม่มีใน shot list`);
      }
    }
  }

  const expectedSubjects = new Map();
  const expectedLocations = new Map();
  const expectedObjects = new Map();
  for (const shot of shots) {
    const shotNumber = Number(shot.number);
    for (const subject of shot.subjects || []) {
      if (!expectedSubjects.has(subject)) expectedSubjects.set(subject, new Set());
      expectedSubjects.get(subject).add(shotNumber);
    }
    const locationKey = normalizeComparison(shot.referenceNeeds?.locationKey);
    if (locationKey) {
      if (!expectedLocations.has(locationKey)) expectedLocations.set(locationKey, new Set());
      expectedLocations.get(locationKey).add(shotNumber);
    }
    for (const rawObjectKey of shot.referenceNeeds?.objectKeys || []) {
      const objectKey = normalizeComparison(rawObjectKey);
      if (!objectKey) continue;
      if (!expectedObjects.has(objectKey)) expectedObjects.set(objectKey, new Set());
      expectedObjects.get(objectKey).add(shotNumber);
    }
  }

  const textOnlyRequirements = Array.isArray(value.textOnlyRequirements) ? value.textOnlyRequirements : [];
  const validTextOnlyKeys = new Set();
  const primarySubjects = new Set((story?.characters || [])
    .filter((character) => /(?:protagonist|main|lead|ตัวเอก|ตัวละครหลัก)/iu.test(`${character.role || ""} ${character.name || ""}`))
    .map((character) => normalizeComparison(character.id))
    .filter(Boolean));
  if (primarySubjects.size === 0 && expectedSubjects.size) {
    const firstStorySubject = (story?.characters || []).find((character) => expectedSubjects.has(character.id))?.id;
    primarySubjects.add(normalizeComparison(firstStorySubject || expectedSubjects.keys().next().value));
  }
  const requirementFor = (assetType, key) => {
    const requirements = assetType === "character" ? expectedSubjects : assetType === "object" ? expectedObjects : null;
    if (!requirements) return null;
    return [...requirements.entries()].find(([requirementKey]) => normalizeComparison(requirementKey) === normalizeComparison(key)) || null;
  };
  for (const item of textOnlyRequirements) {
    const assetType = item?.assetType;
    const key = String(item?.key || "").trim();
    const token = `${assetType}:${normalizeComparison(key)}`;
    if (!["character", "object"].includes(assetType)) {
      errors.push(`text-only ${key || "requirement"} ต้องเป็น character หรือ object เท่านั้น`);
      continue;
    }
    const requirement = requirementFor(assetType, key);
    if (!requirement) {
      errors.push(`text-only ${assetType} ${key || "ไม่ระบุ key"} ไม่มีใน SHOTS`);
      continue;
    }
    if (validTextOnlyKeys.has(token)) {
      errors.push(`text-only ${assetType} ${key} ซ้ำกัน`);
      continue;
    }
    validTextOnlyKeys.add(token);
    if (!String(item.description || "").trim()) errors.push(`text-only ${assetType} ${key} ไม่มี description`);
    if (!String(item.reason || "").trim()) errors.push(`text-only ${assetType} ${key} ไม่มี reason`);
    if (!Array.isArray(item.usedInShots)) errors.push(`text-only ${assetType} ${key} ไม่มี usedInShots`);
    const requiredShots = requirement[1];
    const covered = new Set((item.usedInShots || []).map(Number));
    const missingShots = [...requiredShots].filter((shotNumber) => !covered.has(shotNumber));
    const unrelatedShots = [...covered].filter((shotNumber) => !requiredShots.has(shotNumber));
    if (missingShots.length) errors.push(`text-only ${assetType} ${key} ไม่มี usedInShots ${missingShots.join(", ")}`);
    if (unrelatedShots.length) errors.push(`text-only ${assetType} ${key} ใส่ usedInShots ที่ไม่เกี่ยวข้อง: ${unrelatedShots.join(", ")}`);
    if (assetType === "character" && primarySubjects.has(normalizeComparison(key))) {
      errors.push(`ตัวละครหลัก ${key} ต้องสร้างเป็น image reference ห้ามใช้ text-only`);
    }
    const hasImageAsset = references.some((reference) => assetType === "character"
      ? reference.assetType === "character" && (reference.linkedSubjects || []).some((subject) => normalizeComparison(subject) === normalizeComparison(key))
      : reference.assetType === "object" && normalizeComparison(reference.objectKey) === normalizeComparison(key));
    if (hasImageAsset) errors.push(`${assetType} ${key} ถูกกำหนดทั้ง image reference และ text-only`);
  }

  if (Array.isArray(shotList?.shots)) {
    const existingCovers = (requirements, matches) => [...requirements.keys()]
      .filter((key) => returnedExisting.some((reference) => matches(reference, key))).length;
    const expectedNewAssets = expectedSubjects.size
      + expectedLocations.size
      + expectedObjects.size
      - existingCovers(expectedSubjects, (reference, subject) => reference.assetType === "character" && (reference.linkedSubjects || []).includes(subject))
      - existingCovers(expectedLocations, (reference, key) => reference.assetType === "location" && normalizeComparison(reference.locationKey) === key)
      - existingCovers(expectedObjects, (reference, key) => reference.assetType === "object" && normalizeComparison(reference.objectKey) === key)
      - validTextOnlyKeys.size;
    if (value.assets.length !== expectedNewAssets) {
      errors.push(`reference prompts ต้องสร้าง new prompts ${expectedNewAssets} รายการหลังหัก existing references และ text-only จาก ${expectedSubjects.size} subjects + ${expectedLocations.size} locations + ${expectedObjects.size} objects แต่ได้ ${value.assets.length}`);
    }
  }

  const checkCoverage = (kind, requirements, matches) => {
    for (const [key, requiredShots] of requirements) {
      if (validTextOnlyKeys.has(`${kind}:${normalizeComparison(key)}`)) continue;
      const candidates = references.filter((reference) => matches(reference, key));
      if (candidates.length === 0) {
        errors.push(`reference prompts ไม่มี ${kind} สำหรับ ${key}`);
        continue;
      }
      const covered = new Set(candidates.flatMap((reference) => reference.usedInShots || []).map(Number));
      const missingShots = [...requiredShots].filter((shotNumber) => !covered.has(shotNumber));
      if (missingShots.length) errors.push(`${kind} ${key} ไม่มี usedInShots ${missingShots.join(", ")}`);
      const unrelatedShots = [...covered].filter((shotNumber) => !requiredShots.has(shotNumber));
      if (unrelatedShots.length) errors.push(`${kind} ${key} ใส่ usedInShots ที่ไม่เกี่ยวข้อง: ${unrelatedShots.join(", ")}`);
    }
  };
  checkCoverage("character", expectedSubjects, (reference, subject) => reference.assetType === "character" && (reference.linkedSubjects || []).includes(subject));
  checkCoverage("location", expectedLocations, (reference, key) => reference.assetType === "location" && normalizeComparison(reference.locationKey) === key);
  checkCoverage("object", expectedObjects, (reference, key) => reference.assetType === "object" && normalizeComparison(reference.objectKey) === key);

  const storySubjects = new Set((story?.characters || []).map((character) => character.id).filter(Boolean));
  for (const reference of references.filter((item) => item.assetType === "character")) {
    for (const subject of reference.linkedSubjects || []) {
      if (storySubjects.size && !storySubjects.has(subject)) errors.push(`${reference.pictureId} linkedSubjects มี ${subject} ที่ไม่มีใน STORY`);
    }
  }
  return errors;
}

function allReferenceAssets(referenceAssets) {
  return [
    ...(referenceAssets?.existingReferences || []),
    ...(referenceAssets?.assets || [])
  ].filter((item) => item?.pictureId);
}

function requiredReferenceAssetsForShot(referenceAssets, shotNumber) {
  return allReferenceAssets(referenceAssets).filter((item) =>
    (item.usedInShots || []).map(Number).includes(Number(shotNumber))
  );
}

function textOnlyRequirementsForShot(referenceAssets, shotNumber) {
  return (referenceAssets?.textOnlyRequirements || []).filter((item) =>
    (item.usedInShots || []).map(Number).includes(Number(shotNumber))
  );
}

export function normalizeStoryboardPrompt(value, shotList, referenceAssets) {
  if (!value || typeof value !== "object") return value;
  const shots = shotList?.shots || [];
  if (!Array.isArray(value.panels)) return { ...value, shotCount: shots.length };
  return {
    ...value,
    shotCount: shots.length,
    panels: value.panels.map((panel, index) => {
      const shot = shots[index];
      if (!shot || !panel || typeof panel !== "object") return panel;
      const textOnlyRequirements = textOnlyRequirementsForShot(referenceAssets, shot.number);
      const textOnlyInstruction = textOnlyRequirements.length
        ? `Text-only visual definitions (do not request extra reference images): ${textOnlyRequirements.map((item) => `${item.assetType} ${item.key}: ${item.description}`).join("; ")}`
        : "";
      const prompt = String(panel.prompt || "").trim();
      return {
        ...panel,
        shotNumber: Number(shot.number) || index + 1,
        timeRange: `${secondsToTime(shot.startTime)}-${secondsToTime(shot.endTime)}`,
        camera: normalizeCameraPlan(shot.camera, shot.cameraContinuity),
        prompt: textOnlyInstruction && !prompt.includes(textOnlyInstruction)
          ? `${prompt} ${textOnlyInstruction}`.trim()
          : prompt
      };
    })
  };
}

export function validateStoryboardPrompt(value, shotList, referenceAssets, expectedAspectRatio) {
  const errors = [];
  const shots = shotList?.shots || [];
  if (!value || typeof value !== "object") return ["storyboard prompt ต้องเป็น object"];
  if (Number(value.shotCount) !== shots.length) errors.push(`storyboard prompt มี shotCount ${value.shotCount} แต่ shot list มี ${shots.length}`);
  if (!Array.isArray(value.panels) || value.panels.length !== shots.length) {
    errors.push(`storyboard prompt ต้องมี ${shots.length} panels`);
  }
  if (!Number.isInteger(Number(value.grid?.columns)) || !Number.isInteger(Number(value.grid?.rows))) errors.push("storyboard prompt ไม่มี grid columns/rows ที่ถูกต้อง");
  if (expectedAspectRatio && value.grid?.panelAspectRatio !== expectedAspectRatio) errors.push(`storyboard panelAspectRatio ต้องเป็น ${expectedAspectRatio}`);
  const allowedPictures = new Set([
    ...(referenceAssets?.existingReferences || []).map((item) => item.pictureId),
    ...(referenceAssets?.assets || []).map((item) => item.pictureId)
  ].filter(Boolean));
  const mappedPictures = new Set((value.referenceMapping || []).map((item) => item.pictureId));
  for (const pictureId of allowedPictures) {
    if (!mappedPictures.has(pictureId)) errors.push(`storyboard referenceMapping ไม่มี ${pictureId}`);
  }
  (value.panels || []).forEach((panel, index) => {
    const shot = shots[index];
    const label = `Storyboard panel ${index + 1}`;
    if (Number(panel.shotNumber) !== index + 1) errors.push(`${label} มี shotNumber ไม่ต่อเนื่อง`);
    if (shot) {
      const expectedRange = `${secondsToTime(shot.startTime)}-${secondsToTime(shot.endTime)}`;
      if (panel.timeRange !== expectedRange) errors.push(`${label} timeRange ต้องเป็น ${expectedRange}`);
      const visible = new Set(shot.subjects || []);
      for (const subject of panel.subjects || []) {
        if (!visible.has(subject)) errors.push(`${label} ใช้ ${subject} ที่ไม่อยู่ใน subjects ของ Shot ${shot.number}`);
      }
      const expectedCamera = normalizeCameraPlan(shot.camera, shot.cameraContinuity);
      const panelCamera = normalizeCameraPlan(panel.camera, panel.camera?.continuity);
      if (JSON.stringify(panelCamera) !== JSON.stringify(expectedCamera)) errors.push(`${label} camera ต้องคัดลอก structured camera plan จาก Shot ${shot.number} ให้ครบและตรงกัน`);
    }
    for (const key of ["keyframeMoment", "composition", "prompt"]) {
      if (!String(panel[key] || "").trim()) errors.push(`${label} ไม่มี ${key}`);
    }
    if (!panel.camera || typeof panel.camera !== "object") errors.push(`${label} camera ต้องเป็น structured object`);
    if (!Array.isArray(panel.subjects) || !Array.isArray(panel.referencePictures) || !Array.isArray(panel.continuityNotes) || !Array.isArray(panel.negativeConstraints)) {
      errors.push(`${label} ต้องมี subjects/referencePictures/continuityNotes/negativeConstraints เป็น array`);
    }
    for (const pictureId of panel.referencePictures || []) {
      if (!allowedPictures.has(pictureId)) errors.push(`${label} ใช้ Picture ID ที่ไม่มีใน reference assets: ${pictureId}`);
    }
    for (const reference of requiredReferenceAssetsForShot(referenceAssets, panel.shotNumber)) {
      if (!(panel.referencePictures || []).includes(reference.pictureId)) {
        errors.push(`${label} ไม่มี ${reference.pictureId} ที่กำหนด usedInShots ไว้`);
      }
    }
    for (const requirement of textOnlyRequirementsForShot(referenceAssets, panel.shotNumber)) {
      if (!String(panel.prompt || "").includes(String(requirement.description || "").trim())) {
        errors.push(`${label} prompt ไม่มีคำอธิบาย text-only ของ ${requirement.key}`);
      }
    }
  });
  if (String(value.masterPrompt || "").trim().length < 500) errors.push("storyboard masterPrompt สั้นเกินไป");
  if (!String(value.negativePrompt || "").trim()) errors.push("storyboard prompt ไม่มี negativePrompt");
  if (!Array.isArray(value.usageGuide) || value.usageGuide.length === 0) errors.push("storyboard prompt ไม่มี usageGuide");
  if (/\[cite\s*:/i.test(`${value.masterPrompt || ""} ${value.negativePrompt || ""}`)) errors.push("storyboard prompt มี citation marker");
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
      for (const reference of requiredReferenceAssetsForShot(referenceAssets, shot.number)) {
        if (!block.includes(`<${reference.pictureId}>`)) {
          errors.push(`[Shot ${shot.number}] ไม่มี <${reference.pictureId}> ที่กำหนด usedInShots ไว้`);
        }
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
  const subjectDefinitions = value.slice(0, value.indexOf("summary:") >= 0 ? value.indexOf("summary:") : undefined);
  const referenceItems = allReferenceAssets(referenceAssets);
  const allowedPictureTokens = new Set(referenceItems.map((item) => `<${item.pictureId}>`));
  for (const token of value.match(/<Picture\s+\d+>/gi) || []) {
    const canonical = [...allowedPictureTokens].find((allowed) => allowed.toLocaleLowerCase() === token.toLocaleLowerCase());
    if (!canonical && referenceItems.length) errors.push(`prompt ใช้ ${token} ที่ไม่มีใน reference assets`);
  }
  for (const reference of referenceItems) {
    const pictureToken = `<${reference.pictureId}>`;
    if (!value.includes(pictureToken)) errors.push(`prompt ไม่มี ${pictureToken} จาก reference assets`);
    const mappingLine = subjectDefinitions.split(/\r?\n/).find((line) => line.includes(pictureToken)) || "";
    if (!mappingLine) {
      errors.push(`subject_definitions ไม่มี mapping ของ ${pictureToken}`);
      continue;
    }
    const picturesOnLine = mappingLine.match(/<Picture\s+\d+>/gi) || [];
    if (picturesOnLine.length !== 1) errors.push(`mapping ${pictureToken} ต้องอยู่คนละบรรทัดและมี Picture เดียว`);
    if (reference.assetType && !mappingLine.toLocaleLowerCase().includes(reference.assetType.toLocaleLowerCase())) {
      errors.push(`mapping ${pictureToken} ไม่ระบุ assetType ${reference.assetType}`);
    }
    const identity = reference.name || reference.description;
    if (identity && !mappingLine.toLocaleLowerCase().includes(String(identity).toLocaleLowerCase())) {
      errors.push(`mapping ${pictureToken} ไม่ตรงกับชื่อ asset: ${identity}`);
    }
    if (reference.assetType === "character") {
      for (const subject of reference.linkedSubjects || []) {
        if (!mappingLine.includes(`<${subject}>`)) errors.push(`mapping ${pictureToken} ไม่เชื่อมกับ <${subject}>`);
      }
    }
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
  const referenceMapping = value.slice(
    value.indexOf("REFERENCE_MAPPING:"),
    value.indexOf("SEQUENCE_SPECIFICATION:") >= 0 ? value.indexOf("SEQUENCE_SPECIFICATION:") : undefined
  );
  const referenceItems = allReferenceAssets(referenceAssets);
  const allowedImageTokens = new Set(referenceItems.map((item) => {
    const number = String(item.pictureId).match(/Picture\s+(\d+)/i)?.[1];
    return number ? `@Image${number}` : null;
  }).filter(Boolean));
  for (const token of value.match(/@Image\d+/gi) || []) {
    const canonical = [...allowedImageTokens].find((allowed) => allowed.toLocaleLowerCase() === token.toLocaleLowerCase());
    if (!canonical && referenceItems.length) errors.push(`prompt ใช้ ${token} ที่ไม่มีใน reference assets`);
  }
  for (const reference of referenceItems) {
    const pictureId = reference.pictureId;
    const number = String(pictureId).match(/Picture\s+(\d+)/i)?.[1];
    const mappingLine = referenceMapping.split(/\r?\n/).find((line) => line.includes(`@Image${number}`) && line.includes(`<${pictureId}>`)) || "";
    if (!number || !mappingLine) {
      errors.push(`prompt ไม่มี mapping @Image${number || "?"} = <${pictureId}>`);
      continue;
    }
    const imagesOnLine = mappingLine.match(/@Image\d+/gi) || [];
    if (imagesOnLine.length !== 1) errors.push(`mapping @Image${number} ต้องอยู่คนละบรรทัดและมี Image เดียว`);
    if (reference.assetType && !mappingLine.toLocaleLowerCase().includes(reference.assetType.toLocaleLowerCase())) {
      errors.push(`mapping @Image${number} ไม่ระบุ assetType ${reference.assetType}`);
    }
    const identity = reference.name || reference.description;
    if (identity && !mappingLine.toLocaleLowerCase().includes(String(identity).toLocaleLowerCase())) {
      errors.push(`mapping @Image${number} ไม่ตรงกับชื่อ asset: ${identity}`);
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
      for (const reference of requiredReferenceAssetsForShot(referenceAssets, shot.number)) {
        const number = String(reference.pictureId).match(/Picture\s+(\d+)/i)?.[1];
        if (!number || !block.includes(`@Image${number}`)) {
          errors.push(`[Beat ${shot.number}] ไม่มี @Image${number || "?"} สำหรับ ${reference.pictureId} ที่กำหนด usedInShots ไว้`);
        }
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
