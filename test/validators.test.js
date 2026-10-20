import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFinalPrompt, validateFinalPrompt, validateReferencePrompts, validateShots } from "../src/validators.js";

function validShot(number, startTime, endTime) {
  return {
    number,
    startTime,
    endTime,
    duration: endTime - startTime,
    beat: `Beat ${number}`,
    storyPhase: number === 1 ? "hook" : "resolution",
    objective: "Advance the story",
    subjects: ["Subject 1"],
    setting: "Room",
    spatialAnchor: "Subject 1 faces the door on frame right.",
    startState: "Subject 1 stands beside the table.",
    action: "Subject 1 moves toward the door.",
    actionBeats: [{ order: 1, action: "Takes one step", result: "Reaches the door" }],
    endState: "Subject 1 reaches the closed door.",
    camera: { lensMm: "35mm", shotSize: "medium", angle: "eye level", position: "left of the table", movement: "short track right", focus: "Subject 1" },
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
  assert.deepEqual(validateShots(value, 15), []);
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
  assert.match(errors, /ต้องมี actionBeats/);
  assert.match(errors, /camera ไม่มี lensMm/);
});

test("validates final prompt section order", () => {
  const prompt = `DY,subject_definitions:\n<Subject 1> is a room.\nsummary:\nB\nretention_analysis:\nC\ndetailed_description:\n[Shot 1] Start.\n[Shot 2] At 00:05.000 Continue.\noverall_soundscape:\nE\nnon_diegetic_music:\nF`;
  assert.deepEqual(validateFinalPrompt(prompt, "DY,", 2), []);
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

test("validates character and location reference prompts with unique picture IDs", () => {
  const value = {
    globalStyle: { visualDirection: "Anime" },
    existingReferences: [{ pictureId: "Picture 1", description: "logo" }],
    assets: [
      { pictureId: "Picture 2", assetType: "character", prompt: "Character sheet", negativePrompt: "text", usedInShots: [1] },
      { pictureId: "Picture 3", assetType: "location", prompt: "Empty location", negativePrompt: "people", usedInShots: [1] }
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
