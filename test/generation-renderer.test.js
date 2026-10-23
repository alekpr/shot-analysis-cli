import assert from "node:assert/strict";
import test from "node:test";
import { renderGenerationPrompt } from "../src/generation-renderer.js";

const story = { title: "Test", logline: "A test scene", durationSeconds: 3, dialogueLanguage: "English", characters: [{ id: "Subject 1", name: "A", role: "lead", description: "person", continuityRules: ["same coat"] }] };
const shot = { number: 1, startTime: 0, endTime: 3, camera: { position: "front", shotSize: "medium", angle: "eye level", lensMm: "50mm", focus: "face", movement: "locked" }, composition: "centered", subjects: ["Subject 1"], offscreenSubjects: [], spatialAnchor: "room", startState: "still", causalLink: "a cause", action: "turns", actionBeats: [{ startOffset: 0, endOffset: 2, action: "turns", result: "faces camera" }], lighting: "soft", emotion: { start: "calm", end: "alert", visibleCue: "eyes widen" }, dialogue: [], sound: { ambience: "room", syncEffects: [], voice: "none", music: "none", bridge: "room" }, endState: "faces camera", continuityIn: [], continuityOut: [], transition: { type: "cut", motivation: "reveal" }, negativeConstraints: [] };
const refs = { assets: [{ pictureId: "Picture 1", assetType: "character", name: "A sheet", linkedSubjects: ["Subject 1"], purpose: "identity", usedInShots: [1] }] };

test("renderer owns MiniMax headings, mappings and shot timing", () => {
  const output = renderGenerationPrompt({ creativeText: "malformed model output", story, shots: { shots: [shot] }, visualDirection: { label: "Cinematic", mood: "tense" }, referencePrompts: refs, generationTarget: "minimax-h3" });
  assert.ok(output.startsWith("DY,subject_definitions:"));
  assert.match(output, /<Picture 1> maps to character asset A sheet/);
  assert.match(output, /\[Shot 1\]/);
});

test("renderer owns Seedance reference mapping and timecoded beats", () => {
  const output = renderGenerationPrompt({ creativeText: "malformed model output", story, shots: { shots: [shot] }, visualDirection: { label: "Cinematic", mood: "tense" }, referencePrompts: refs, generationTarget: "seedance-2.5" });
  assert.ok(output.startsWith("REFERENCE_MAPPING:"));
  assert.match(output, /@Image1 = <Picture 1>/);
  assert.match(output, /\[Beat 1\] 00:00\.000-00:03\.000/);
});
