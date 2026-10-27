import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFinalPrompt, normalizeSeedancePrompt, normalizeStoryboardPrompt, validateFinalPrompt, validateReferencePrompts, validateSeedancePrompt, validateShots, validateStoryboardPrompt } from "../src/validators.js";

function validShot(number, startTime, endTime) {
  return {
    number,
    startTime,
    endTime,
    duration: endTime - startTime,
    beat: `Beat ${number}`,
    storyPhase: number === 1 ? "hook" : "resolution",
    objective: "Advance the story",
    cinematicIntent: "Build curiosity through a motivated reveal.",
    attentionFocus: "The eye sees Subject 1 first, then discovers the closed door.",
    visualPayoff: `Subject 1 reaches mark ${number} in the final frame.`,
    subjects: ["Subject 1"],
    offscreenSubjects: [],
    setting: "Room",
    referenceNeeds: { locationKey: "room", objectKeys: [] },
    spatialAnchor: "Subject 1 faces the door on frame right.",
    startState: number === 1 ? "Subject 1 stands beside the table." : `Subject 1 reaches mark ${number - 1}.`,
    continuityBridge: number === 1 ? "Initial state" : `The cut continues after reaching mark ${number - 1}.`,
    causalLink: `The previous position motivates movement toward mark ${number}, setting up the next mark.`,
    action: `Subject 1 moves toward mark ${number}.`,
    actionBeats: [{ order: 1, startOffset: 0.5, endOffset: 2, action: `Takes step ${number}`, result: `Reaches mark ${number}` }],
    endState: `Subject 1 reaches mark ${number}.`,
    camera: { lensMm: "35mm", shotSize: "MS", angle: "eye-level", perspective: "objective", height: "eye", position: "left of the table", primaryMovement: { type: "tracking", direction: "right, parallel to Subject 1", speed: "slow", motivation: "follow the step and preserve the door reveal" }, focus: { subject: "Subject 1", depth: "moderate", transition: "none" }, screenDirection: "Subject 1 moves frame-left to frame-right", screenDirectionCode: "frame-right", screenDirectionSubject: "Subject 1", intent: "Keep the movement readable while retaining the destination" },
    cameraContinuity: { axis: "door-to-table action axis", axisId: "room-door-axis", cameraSide: "left", axisTransition: number === 1 ? "initial" : "preserve", eyeline: "Subject 1 looks toward the door", eyelineMatchId: "subject-door-look", eyelineDirection: "frame-right", eyelineTransition: number === 1 ? "initial" : "preserve", entryDirection: "frame-right", exitDirection: "frame-right", changeMotivation: number === 1 ? "establish the initial room geography" : "preserve movement and room geography", previousShotBridge: number === 1 ? "initial setup" : "continues on the same side of the axis" },
    composition: "Door remains visible frame right.",
    lighting: "Soft window light.",
    dialogue: [],
    sound: { ambience: "room tone", syncEffects: ["footstep"], voice: "none", music: "none", bridge: "room tone" },
    transition: { type: "cut on action", motivation: "continue the step" },
    continuityIn: ["door closed"],
    continuityOut: ["door closed", "subject at door"],
    emotion: { start: "uncertain", end: "resolved", visibleCue: "steady gaze" },
    negativeConstraints: []
  };
}

test("accepts a contiguous shot list with exact total duration", () => {
  const value = {
    durationSeconds: 15,
    totalDuration: 15,
    continuityChecklist: ["Keep wardrobe and screen direction consistent"],
    shots: [
      validShot(1, 0, 5),
      validShot(2, 5, 10),
      validShot(3, 10, 15)
    ]
  };
  assert.deepEqual(validateShots(value, 15, 3), []);
});

test("rejects a shot list that does not match the selected count", () => {
  const value = {
    durationSeconds: 5,
    totalDuration: 5,
    continuityChecklist: ["Keep state"],
    shots: [validShot(1, 0, 5)]
  };
  assert.match(validateShots(value, 5, 3).join("; "), /มี 1 shots แต่ผู้ใช้เลือก 3 shots/);
});

test("rejects shot asset IDs that are not declared in the story manifest", () => {
  const shot = validShot(1, 0, 5);
  shot.subjects = ["Subject 9"];
  shot.referenceNeeds = { locationKey: "unknown-room", objectKeys: ["unknown-prop"] };
  const story = {
    characters: [{ id: "Subject 1" }],
    assetManifest: {
      locations: [{ id: "known-room" }],
      objects: [{ id: "known-prop" }]
    }
  };
  const errors = validateShots({ durationSeconds: 5, totalDuration: 5, continuityChecklist: ["state"], shots: [shot] }, 5, 1, story).join("; ");
  assert.match(errors, /Subject 9/);
  assert.match(errors, /unknown-room/);
  assert.match(errors, /unknown-prop/);
});

test("rejects gaps and a wrong total duration", () => {
  const value = {
    durationSeconds: 15,
    totalDuration: 15,
    continuityChecklist: ["Keep wardrobe consistent"],
    shots: [
      validShot(1, 0, 5),
      validShot(2, 6, 12)
    ]
  };
  const errors = validateShots(value, 15).join("; ");
  assert.match(errors, /เริ่มที่ 6 แต่ควรเริ่มที่ 5/);
  assert.match(errors, /เวลารวม 12 ไม่ตรงกับ durationSeconds 15/);
});

test("rejects an underspecified production shot", () => {
  const value = {
    durationSeconds: 5,
    totalDuration: 5,
    continuityChecklist: ["Keep wardrobe consistent"],
    shots: [{ number: 1, startTime: 0, endTime: 5, duration: 5 }]
  };
  const errors = validateShots(value, 5).join("; ");
  assert.match(errors, /ไม่มี spatialAnchor/);
  assert.match(errors, /ไม่มี cinematicIntent/);
  assert.match(errors, /ต้องมี actionBeats/);
  assert.match(errors, /camera ต้องเป็น object/);
});

test("rejects missing continuity bridges and repeated actions across adjacent shots", () => {
  const first = validShot(1, 0, 5);
  const second = validShot(2, 5, 10);
  second.continuityBridge = "";
  second.actionBeats[0].action = first.actionBeats[0].action;
  const errors = validateShots({
    durationSeconds: 10,
    totalDuration: 10,
    continuityChecklist: ["Preserve motion"],
    shots: [first, second]
  }, 10).join("; ");
  assert.match(errors, /ไม่มี continuityBridge จาก shot ก่อนหน้า/);
  assert.match(errors, /action ซ้ำกับ Shot 1/);
});

test("rejects overlapping or out-of-range action timing", () => {
  const shot = validShot(1, 0, 5);
  shot.actionBeats = [
    { order: 1, startOffset: 0.5, endOffset: 3, action: "Raises hand", result: "Hand is raised" },
    { order: 2, startOffset: 2.5, endOffset: 6, action: "Opens door", result: "Door opens" }
  ];
  const errors = validateShots({ durationSeconds: 5, totalDuration: 5, continuityChecklist: ["Keep state"], shots: [shot] }, 5).join("; ");
  assert.match(errors, /ช่วงเวลาไม่ถูกต้อง/);
  assert.match(errors, /ซ้อนกับ beat ก่อนหน้า/);
});

test("validates final prompt section order", () => {
  const prompt = `DY,subject_definitions:\n<Subject 1> is a room.\nsummary:\nB\nretention_analysis:\nC\ndetailed_description:\n[Shot 1] Start.\n[Shot 2] At 00:05.000 Continue.\noverall_soundscape:\nE\nnon_diegetic_music:\nF`;
  assert.deepEqual(validateFinalPrompt(prompt, "DY,", 2), []);
});

test("requires detailed shot prose to retain subjects, exact timing, and dialogue", () => {
  const filler = " The camera and visible action continue with precise composition, lighting, performance, sound, continuity, and a clearly described final frame.".repeat(3);
  const prompt = `DY,subject_definitions:\n<Subject 1> is a person.\nsummary:\nB\nretention_analysis:\nC\ndetailed_description:\n[Shot 1] <Subject 1> begins.${filler}\n[Shot 2] At 00:05.000 <Subject 1> speaks: <d>[English] Stay here.</d>${filler}\noverall_soundscape:\nE\nnon_diegetic_music:\nF`;
  const shots = {
    shots: [
      { number: 1, startTime: 0, subjects: ["Subject 1"], dialogue: [] },
      { number: 2, startTime: 5, subjects: ["Subject 1"], dialogue: [{ speaker: "Subject 1", language: "English", line: "Stay here." }] }
    ]
  };
  assert.deepEqual(validateFinalPrompt(prompt, "DY,", 2, undefined, undefined, shots), []);

  const incomplete = prompt.replace("At 00:05.000 <Subject 1> speaks: <d>[English] Stay here.</d>", "At 00:04.000 Someone speaks.");
  const errors = validateFinalPrompt(incomplete, "DY,", 2, undefined, undefined, shots).join("; ");
  assert.match(errors, /ต้องเริ่มเวลา At 00:05.000/);
  assert.match(errors, /ไม่กล่าวถึง <Subject 1>/);
  assert.match(errors, /ไม่มีบทพูด/);
});

test("rejects environment aliases and missing shot timestamps", () => {
  const prompt = `DY,subject_definitions:\n<Environment 1> is a room.\nsummary:\nB\nretention_analysis:\nC\ndetailed_description:\n[Shot 1]\n[Shot 2] (5s)\noverall_soundscape:\nE\nnon_diegetic_music:\nF`;
  assert.equal(validateFinalPrompt(prompt, "DY,", 2).length, 2);
});

test("requires the selected visual direction and mood in the final prompt", () => {
  const prompt = `DY,subject_definitions:\n<Subject 1> is a room.\nsummary:\nAnime scene\nretention_analysis:\nC\ndetailed_description:\n[Shot 1] Start.\noverall_soundscape:\nE\nnon_diegetic_music:\nF`;
  assert.deepEqual(validateFinalPrompt(prompt, "DY,", 1, { label: "Anime", mood: "dreamy" }), ["prompt ไม่มี Mood: dreamy"]);
});

test("normalizes common model formatting around the final prompt", () => {
  const raw = `Here is the prompt:\n\n\`\`\`text\nDY, subject_definitions: details\n## Summary: story\n**retention_analysis:** keep\ndetailed_description: [Shot 1]\noverall_soundscape: ambience\nnon_diegetic_music: score\n\`\`\``;
  const normalized = normalizeFinalPrompt(raw, "DY,");
  assert.ok(normalized.startsWith("DY,subject_definitions:"));
  assert.match(normalized, /^summary:/m);
  assert.match(normalized, /^retention_analysis:/m);
  assert.deepEqual(validateFinalPrompt(normalized, "DY,", 1), []);
});

test("removes and rejects a duplicate subject definitions heading", () => {
  const raw = `DY,subject_definitions:\nsubject_definitions:\n<Subject 1> is a room.\nsummary:\nB\nretention_analysis:\nC\ndetailed_description:\n[Shot 1] Start.\noverall_soundscape:\nE\nnon_diegetic_music:\nF`;
  assert.match(validateFinalPrompt(raw, "DY,", 1).join("; "), /subject_definitions: ซ้ำ/);
  const normalized = normalizeFinalPrompt(raw, "DY,");
  assert.equal((normalized.match(/^subject_definitions:/gm) || []).length, 0);
  assert.deepEqual(validateFinalPrompt(normalized, "DY,", 1), []);
});

test("rejects characters used in a final shot without visible or offscreen declaration", () => {
  const filler = " The camera holds while the action, lighting, sound, emotion, and final frame remain clearly described for production.".repeat(4);
  const prompt = `DY,subject_definitions:\n<Subject 1> is A.\n<Subject 2> is B.\nsummary:\nB\nretention_analysis:\nC\ndetailed_description:\n[Shot 1] <Subject 1> watches <Subject 2> move.${filler}\noverall_soundscape:\nE\nnon_diegetic_music:\nF`;
  const shotList = { shots: [{ number: 1, startTime: 0, subjects: ["Subject 1"], offscreenSubjects: [], dialogue: [] }] };
  const story = { characters: [{ id: "Subject 1" }, { id: "Subject 2" }] };
  assert.match(validateFinalPrompt(prompt, "DY,", 1, undefined, undefined, shotList, story).join("; "), /กล่าวถึง <Subject 2>/);
});

test("requires one object key for each object reference asset", () => {
  const value = {
    globalStyle: { visualDirection: "Live action" },
    existingReferences: [],
    assets: [
      { pictureId: "Picture 1", assetType: "character", prompt: "Character sheet", negativePrompt: "text", usedInShots: [1] },
      { pictureId: "Picture 2", assetType: "location", prompt: "Empty location", negativePrompt: "people", usedInShots: [1] },
      { pictureId: "Picture 3", assetType: "object", prompt: "Rifle and chicken", negativePrompt: "people", usedInShots: [1] }
    ]
  };
  assert.match(validateReferencePrompts(value).join("; "), /ต้องมี objectKey/);
});

test("adds the configured prefix when the model starts at subject_definitions", () => {
  const normalized = normalizeFinalPrompt("subject_definitions:\nA\nsummary:\nB", "TEST,");
  assert.ok(normalized.startsWith("TEST,subject_definitions:"));
});

test("adds canonical visual direction metadata when the model translates the label", () => {
  const visualDirection = {
    id: "live-action-cinematic",
    label: "ภาพยนตร์สมจริง (Live-action cinematic)",
    mood: "warm and hopeful"
  };
  const raw = `DY,subject_definitions:\n<Subject 1> is cinematic.\nsummary:\nA photorealistic live-action scene with a warm hopeful tone.\nretention_analysis:\nC\ndetailed_description:\n[Shot 1] Start.\noverall_soundscape:\nE\nnon_diegetic_music:\nF`;
  const normalized = normalizeFinalPrompt(raw, "DY,", visualDirection);
  assert.match(normalized, /Visual direction: ภาพยนตร์สมจริง \(Live-action cinematic\)/);
  assert.match(normalized, /Mood: warm and hopeful/);
  assert.deepEqual(validateFinalPrompt(normalized, "DY,", 1, visualDirection), []);
});

test("normalizes and validates a Seedance 2.5 production prompt", () => {
  const detail = " The 50mm medium camera stays at eye level across the table while warm practical light shapes <Subject 1>'s face. The visible hand movement follows the approved action in one continuous phase, with cloth movement and room tone synchronized. Screen direction, wardrobe, prop state, and geography remain stable, and the final frame holds long enough to show the emotional result before the motivated hard cut.";
  const raw = `\`\`\`text\nREFERENCE_MAPPING:\n@Image1 = <Picture 1> character identity reference\nSEQUENCE_SPECIFICATION:\nVisual direction: Live-action cinematic\nMood: melancholic\nTIMECODED_BEATS:\n[Beat 1] 00:00.000-00:05.000 <Subject 1> looks away.${detail}\n[Beat 2] 00:05.000-00:10.000 <Subject 1> withdraws her hand.${detail}\nGLOBAL_CONSTRAINTS:\nPreserve identity, wardrobe, geography, physics, lighting, and synchronized audio.\n\`\`\``;
  const visualDirection = { label: "Live-action cinematic", mood: "melancholic" };
  const normalized = normalizeSeedancePrompt(raw, visualDirection);
  const shots = { shots: [validShot(1, 0, 5), validShot(2, 5, 10)] };
  const references = { assets: [{ pictureId: "Picture 1" }] };
  assert.ok(normalized.startsWith("REFERENCE_MAPPING:"));
  assert.deepEqual(validateSeedancePrompt(normalized, 2, visualDirection, references, shots), []);
});

test("validates storyboard panel count, timing, subjects, and references", () => {
  const shots = { shots: [validShot(1, 0, 5), validShot(2, 5, 10)] };
  const references = { assets: [{ pictureId: "Picture 1" }] };
  const panel = (number, range) => ({
    shotNumber: number,
    timeRange: range,
    keyframeMoment: `Moment ${number}`,
    subjects: ["Subject 1"],
    referencePictures: ["Picture 1"],
    camera: { ...shots.shots[number - 1].camera, continuity: shots.shots[number - 1].cameraContinuity },
    composition: "clear foreground and background",
    prompt: "A complete cinematic still-image prompt.",
    continuityNotes: ["same wardrobe"],
    negativeConstraints: ["no extra people"]
  });
  const value = {
    shotCount: 2,
    grid: { columns: 2, rows: 1, panelAspectRatio: "9:16" },
    referenceMapping: [{ pictureId: "Picture 1", usage: "character" }],
    panels: [panel(1, "00:00.000-00:05.000"), panel(2, "00:05.000-00:10.000")],
    masterPrompt: "Create one two-panel cinematic storyboard contact sheet with equal frames, clean gutters, consistent character identity, wardrobe, geography, lighting, screen direction, props, anatomy, palette, and realistic materials. The first panel captures the approved opening keyframe and the second panel captures the approved resolving keyframe. Every panel contains one still moment only, preserves the source camera and composition, uses the supplied reference image, and avoids repeated actions or multiple time phases. Keep the artwork free from all text, labels, captions, logos, watermarks, interfaces, speech bubbles, extra subjects, duplicate limbs, and inconsistent environmental details.",
    negativePrompt: "text, watermark, duplicate people",
    usageGuide: ["Generate as one image"]
  };
  assert.deepEqual(validateStoryboardPrompt(value, shots, references, "9:16"), []);
  value.panels[1].camera.angle = "high-angle";
  assert.match(validateStoryboardPrompt(value, shots, references, "9:16").join("; "), /camera ต้องคัดลอก structured camera plan/);
  value.panels[1].camera.angle = shots.shots[1].camera.angle;
  const validCamera = value.panels[1].camera;
  value.panels[1].camera = null;
  assert.match(validateStoryboardPrompt(value, shots, references, "9:16").join("; "), /camera ต้องเป็น structured object/);
  value.panels[1].camera = validCamera;
  value.panels[1].subjects = ["Subject 2"];
  assert.match(validateStoryboardPrompt(value, shots, references, "9:16").join("; "), /Subject 2/);
});

test("normalizes storyboard facts from the approved shot list", () => {
  const shots = { shots: [validShot(1, 0, 5)] };
  const value = {
    shotCount: 99,
    panels: [{
      shotNumber: 8,
      timeRange: "wrong",
      keyframeMoment: "Keep this creative keyframe",
      camera: { angle: "high-angle" }
    }]
  };
  const normalized = normalizeStoryboardPrompt(value, shots);
  assert.equal(normalized.shotCount, 1);
  assert.equal(normalized.panels[0].shotNumber, 1);
  assert.equal(normalized.panels[0].timeRange, "00:00.000-00:05.000");
  assert.deepEqual(normalized.panels[0].camera, {
    ...shots.shots[0].camera,
    continuity: shots.shots[0].cameraContinuity
  });
  assert.equal(normalized.panels[0].keyframeMoment, "Keep this creative keyframe");
});

test("validates character and location reference prompts with unique picture IDs", () => {
  const value = {
    globalStyle: { visualDirection: "Anime" },
    existingReferences: [{ pictureId: "Picture 1", description: "logo" }],
    assets: [
      { pictureId: "Picture 2", assetType: "character", linkedSubjects: ["Subject 1"], prompt: "Character sheet", negativePrompt: "text", usedInShots: [1] },
      { pictureId: "Picture 3", assetType: "location", locationKey: "room", prompt: "Empty location", negativePrompt: "people", usedInShots: [1] }
    ]
  };
  assert.deepEqual(validateReferencePrompts(value, ["Picture 1"]), []);
});

test("rejects reference assets that reuse an existing Picture ID", () => {
  const value = {
    globalStyle: { visualDirection: "Anime" },
    existingReferences: [{ pictureId: "Picture 1", description: "logo" }],
    assets: [
      { pictureId: "Picture 1", assetType: "character", prompt: "Character sheet", negativePrompt: "text", usedInShots: [1] },
      { pictureId: "Picture 2", assetType: "location", prompt: "Empty location", negativePrompt: "people", usedInShots: [1] }
    ]
  };
  assert.match(validateReferencePrompts(value, ["Picture 1"]).join("; "), /ซ้ำกับ reference/);
});

test("rejects reordered existing Picture IDs", () => {
  const value = {
    globalStyle: { visualDirection: "Anime" },
    existingReferences: [
      { pictureId: "Picture 2", description: "Location", assetType: "location", locationKey: "room", usedInShots: [1] },
      { pictureId: "Picture 1", description: "Hero", assetType: "character", linkedSubjects: ["Subject 1"], usedInShots: [1] }
    ],
    assets: []
  };
  const errors = validateReferencePrompts(value, ["Picture 1", "Picture 2"]).join("; ");
  assert.match(errors, /ลำดับ 1 ต้องเป็น Picture 1/);
  assert.match(errors, /ลำดับ 2 ต้องเป็น Picture 2/);
});

test("rejects incomplete reference coverage for subjects, locations, and objects", () => {
  const shot1 = validShot(1, 0, 5);
  const shot2 = validShot(2, 5, 10);
  shot2.subjects = ["Subject 2"];
  shot2.referenceNeeds = { locationKey: "hallway", objectKeys: ["sealed-letter"] };
  const references = {
    globalStyle: { visualDirection: "Live action" },
    existingReferences: [],
    assets: [
      { pictureId: "Picture 1", assetType: "character", name: "Hero", linkedSubjects: ["Subject 1"], usedInShots: [1], prompt: "Hero sheet", negativePrompt: "text" },
      { pictureId: "Picture 2", assetType: "location", name: "Room", locationKey: "room", linkedSubjects: [], usedInShots: [1], prompt: "Room", negativePrompt: "people" }
    ]
  };
  const story = { characters: [{ id: "Subject 1" }, { id: "Subject 2" }] };
  const errors = validateReferencePrompts(references, [], story, { shots: [shot1, shot2] }).join("; ");
  assert.match(errors, /ต้องสร้าง new prompts 5 รายการ.*แต่ได้ 2/);
  assert.match(errors, /ไม่มี character สำหรับ Subject 2/);
  assert.match(errors, /ไม่มี location สำหรับ hallway/);
  assert.match(errors, /ไม่มี object สำหรับ sealed letter/);
});

test("final prompt requires each Picture mapping and its per-shot reference", () => {
  const filler = " The camera, action, light, performance, sound, continuity, and final frame remain fully specified for production.".repeat(4);
  const prompt = `DY,subject_definitions:\n<Picture 1> maps to location asset Wrong Room.\n<Subject 1> is the hero.\nsummary:\nB\nretention_analysis:\nC\ndetailed_description:\n[Shot 1] <Subject 1> performs the action.${filler}\noverall_soundscape:\nE\nnon_diegetic_music:\nF`;
  const references = { assets: [{ pictureId: "Picture 1", assetType: "character", name: "Hero Sheet", linkedSubjects: ["Subject 1"], usedInShots: [1] }] };
  const shots = { shots: [{ number: 1, startTime: 0, subjects: ["Subject 1"], offscreenSubjects: [], dialogue: [] }] };
  const errors = validateFinalPrompt(prompt, "DY,", 1, undefined, references, shots, { characters: [{ id: "Subject 1" }] }).join("; ");
  assert.match(errors, /ไม่มี <Picture 1> ที่กำหนด usedInShots/);
  assert.match(errors, /ไม่ระบุ assetType character/);
  assert.match(errors, /ไม่ตรงกับชื่อ asset: Hero Sheet/);
  assert.match(errors, /ไม่เชื่อมกับ <Subject 1>/);
});
