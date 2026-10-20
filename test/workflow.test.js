import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile } from "node:fs/promises";
import { runNewWorkflow, runResumeWorkflow } from "../src/workflow.js";

class FakeLlm {
  async generate({ prompt }) {
    if (prompt.includes("วิเคราะห์ brief")) {
      return JSON.stringify({
        title: "Night Goodbye",
        slug: "night-goodbye",
        language: "Thai",
        targetPlatform: "Reels",
        durationSeconds: 15,
        aspectRatio: "9:16",
        visualStyle: "cinematic",
        visualDirection: { medium: "live-action-cinematic", label: "Live-action cinematic", mood: "melancholic", source: "explicit", evidence: "cinematic brief" },
        audience: "adult drama viewers",
        desiredEmotion: "melancholy",
        coreChoices: [{ name: "รักและการเสียสละ", reason: "emotional closure" }],
        characters: [{ name: "A", role: "lead", description: "woman" }],
        setting: "restaurant",
        references: [],
        dialogueLanguage: "English",
        constraints: [],
        endingPreference: "resolved",
        missingInformation: [],
        clarificationQuestions: [],
        readiness: { score: 95, canProceed: true, rationale: "complete" }
      });
    }
    if (prompt.includes("สร้างโครงเรื่อง")) {
      return JSON.stringify({
        title: "Night Goodbye",
        logline: "A couple ends their relationship.",
        audiencePromise: "quiet emotional closure",
        durationSeconds: 15,
        cores: [{ name: "รักและการเสียสละ", function: "create empathy" }],
        emotionalArc: [{ phase: "ending", emotion: "acceptance", storyFunction: "closure" }],
        characters: [{ id: "Subject 1", name: "A", role: "lead", description: "woman", continuityRules: ["same coat"] }],
        setting: { description: "restaurant", continuityRules: ["warm light"] },
        hook: "She will not meet his eyes.",
        buildUp: ["He reaches for her hand."],
        climax: "She withdraws her hand.",
        ending: "She leaves.",
        endingType: "resolved",
        dialogueLanguage: "English",
        visualStyle: "cinematic",
        visualDirection: { id: "live-action-cinematic", label: "Live-action cinematic", mood: "melancholic", application: "cinematic lighting and camera" },
        soundDirection: "quiet restaurant",
        risks: [],
        rationale: "Fits 15 seconds."
      });
    }
    if (prompt.includes("แตกโครงเรื่องเป็น shot list")) {
      return JSON.stringify({
        projectTitle: "Night Goodbye",
        durationSeconds: 15,
        shots: [
          { number: 1, startTime: 0, endTime: 5, duration: 5, objective: "hook", subjects: ["Subject 1"], setting: "restaurant", action: "looks away", camera: "medium", composition: "two shot", lighting: "warm", dialogue: [], sound: "room tone", transition: "cut", continuity: ["same coat"], emotion: "distance" },
          { number: 2, startTime: 5, endTime: 10, duration: 5, objective: "build", subjects: ["Subject 1"], setting: "restaurant", action: "withdraws hand", camera: "close", composition: "hands", lighting: "warm", dialogue: [], sound: "cloth", transition: "cut", continuity: ["same table"], emotion: "certainty" },
          { number: 3, startTime: 10, endTime: 15, duration: 5, objective: "resolve", subjects: ["Subject 1"], setting: "restaurant", action: "leaves", camera: "wide", composition: "exit", lighting: "warm", dialogue: [], sound: "footsteps", transition: "hold", continuity: ["same coat"], emotion: "closure" }
        ],
        continuityChecklist: ["wardrobe", "lighting"],
        totalDuration: 15
      });
    }
    if (prompt.includes("สร้าง prompt ภาษาอังกฤษสำหรับ generate ภาพอ้างอิง")) {
      return JSON.stringify({
        projectTitle: "Night Goodbye",
        globalStyle: { visualDirection: "Live-action cinematic", mood: "melancholic", styleLock: "warm restaurant lighting" },
        existingReferences: [],
        assets: [
          { pictureId: "Picture 1", assetType: "character", name: "A character sheet", linkedSubjects: ["Subject 1"], usedInShots: [1, 2, 3], purpose: "character consistency", prompt: "Character sheet of A with front, side, and back views.", negativePrompt: "other characters, text", consistencyNotes: ["same coat"] },
          { pictureId: "Picture 2", assetType: "location", name: "Restaurant", linkedSubjects: [], usedInShots: [1, 2, 3], purpose: "location consistency", prompt: "Empty warm restaurant environment reference.", negativePrompt: "people, text", consistencyNotes: ["same table layout"] },
          { pictureId: "Picture 3", assetType: "object", name: "Table", linkedSubjects: [], usedInShots: [1, 2], purpose: "prop continuity", prompt: "Isolated restaurant table from multiple angles.", negativePrompt: "people, food", consistencyNotes: ["dark wood"] }
        ],
        usageGuide: ["Generate each image and attach it with its assigned Picture ID."]
      });
    }
    return "DY,subject_definitions:\n<Subject 1> is a woman in a Live-action cinematic style with a melancholic tone, matching <Picture 1>. The restaurant matches <Picture 2> and table matches <Picture 3>.\nsummary:\nVisual direction: Live-action cinematic; Mood: melancholic\nretention_analysis:\nUse <Picture 1>, <Picture 2>, and <Picture 3>.\ndetailed_description:\n[Shot 1] Start.\n[Shot 2] At 00:05.000 Continue.\n[Shot 3] At 00:10.000 End.\noverall_soundscape:\nE\nnon_diegetic_music:\nF";
  }
}

class FailFinalLlm extends FakeLlm {
  async generate(options) {
    if (options.prompt.includes("REFERENCE_ASSETS:")) throw new Error("temporary final prompt failure");
    return super.generate(options);
  }
}

class FailReferenceLlm extends FakeLlm {
  async generate(options) {
    if (options.prompt.includes("สร้าง prompt ภาษาอังกฤษสำหรับ generate ภาพอ้างอิง")) throw new Error("temporary reference prompt failure");
    return super.generate(options);
  }
}

class CountingLlm extends FakeLlm {
  constructor() {
    super();
    this.calls = [];
  }

  async generate(options) {
    this.calls.push(options.prompt);
    return super.generate(options);
  }
}

test("workflow creates every reviewed artifact", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-test-"));
  const asks = ["Night Goodbye", "15", "Reels", "9:16", ""];
  const terminal = {
    ask: async () => asks.shift() ?? "",
    multiline: async () => "A quiet breakup in a restaurant.",
    multiSelect: async () => ["pure-love"],
    choose: async () => "a"
  };
  const result = await runNewWorkflow({
    terminal,
    llm: new FakeLlm(),
    args: { output: root },
    settings: { provider: "gemini", model: "test", promptPrefix: "DY," }
  });
  assert.equal(result.status, "complete");
  for (const file of ["00-brief.md", "01-analysis.md", "02-story.md", "03-shots.md", "04-reference-image-prompts.md", "05-generation-prompt.txt", ".shot-analysis/session.json"]) {
    assert.ok((await readFile(path.join(root, file), "utf8")).length > 0, `${file} should exist`);
  }
  const analysis = await readFile(path.join(root, "01-analysis.md"), "utf8");
  assert.match(analysis, /Primary — รักบริสุทธิ์และการเสียสละ/);
  const session = JSON.parse(await readFile(path.join(root, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.selectedCores[0].role, "primary");
  assert.equal(session.selectedVisualDirection.id, "live-action-cinematic");
  assert.equal(session.referencePrompts.assets.length, 3);
});

test("resume retries only the failed final prompt stage", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-resume-test-"));
  const asks = ["Resume Test", "15", "Reels", "9:16", ""];
  const terminal = {
    ask: async () => asks.shift() ?? "",
    multiline: async () => "A quiet breakup in a restaurant.",
    multiSelect: async () => ["pure-love"],
    choose: async () => "a"
  };
  const options = {
    terminal,
    args: { output: root },
    settings: { provider: "gemini", model: "test", promptPrefix: "DY," }
  };

  await assert.rejects(runNewWorkflow({ ...options, llm: new FailFinalLlm() }), /temporary final prompt failure/);
  let session = JSON.parse(await readFile(path.join(root, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.status, "generating-prompt");
  assert.equal(session.lastError.stage, "generating-prompt");
  assert.ok(session.story);
  assert.ok(session.shots);
  assert.ok(session.referencePrompts);

  await assert.rejects(runResumeWorkflow({ terminal, llm: new FailFinalLlm(), folder: root, settings: options.settings }), /temporary final prompt failure/);
  session = JSON.parse(await readFile(path.join(root, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.lastError.stage, "generating-prompt");
  assert.match(session.lastError.message, /temporary final prompt failure/);

  const llm = new CountingLlm();
  const result = await runResumeWorkflow({ terminal, llm, folder: root, settings: options.settings });
  assert.equal(result.status, "complete");
  assert.equal(llm.calls.length, 1);
  assert.match(llm.calls[0], /REFERENCE_ASSETS:/);
  assert.ok((await readFile(path.join(root, "05-generation-prompt.txt"), "utf8")).length > 0);
  session = JSON.parse(await readFile(path.join(root, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.lastError, undefined);
  assert.equal(session.resumeCount, 2);
});

test("resume continues from reference prompts without regenerating approved stages", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-reference-resume-test-"));
  const asks = ["Reference Resume", "15", "Reels", "9:16", ""];
  const terminal = {
    ask: async () => asks.shift() ?? "",
    multiline: async () => "A quiet breakup in a restaurant.",
    multiSelect: async () => ["pure-love"],
    choose: async () => "a"
  };
  const settings = { provider: "gemini", model: "test", promptPrefix: "DY," };
  await assert.rejects(
    runNewWorkflow({ terminal, llm: new FailReferenceLlm(), args: { output: root }, settings }),
    /temporary reference prompt failure/
  );
  let session = JSON.parse(await readFile(path.join(root, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.status, "reference-prompts-generation");
  assert.ok(session.story);
  assert.ok(session.shots);
  assert.equal(session.referencePrompts, undefined);

  const llm = new CountingLlm();
  const result = await runResumeWorkflow({ terminal, llm, folder: root, settings });
  assert.equal(result.status, "complete");
  assert.equal(llm.calls.length, 2);
  assert.match(llm.calls[0], /สร้าง prompt ภาษาอังกฤษสำหรับ generate ภาพอ้างอิง/);
  assert.match(llm.calls[1], /REFERENCE_ASSETS:/);
  assert.equal(llm.calls.some((prompt) => prompt.includes("วิเคราะห์ brief")), false);
  assert.equal(llm.calls.some((prompt) => prompt.includes("สร้างโครงเรื่อง")), false);
  assert.equal(llm.calls.some((prompt) => prompt.includes("แตกโครงเรื่องเป็น shot list")), false);
});
