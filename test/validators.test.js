import test from "node:test";
import assert from "node:assert/strict";
import { validateFinalPrompt, validateShots } from "../src/validators.js";

test("accepts a contiguous shot list with exact total duration", () => {
  const value = {
    durationSeconds: 15,
    shots: [
      { startTime: 0, endTime: 5, duration: 5 },
      { startTime: 5, endTime: 10, duration: 5 },
      { startTime: 10, endTime: 15, duration: 5 }
    ]
  };
  assert.deepEqual(validateShots(value), []);
});

test("rejects gaps and a wrong total duration", () => {
  const value = {
    durationSeconds: 15,
    shots: [
      { startTime: 0, endTime: 5, duration: 5 },
      { startTime: 6, endTime: 12, duration: 6 }
    ]
  };
  assert.equal(validateShots(value).length, 2);
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
