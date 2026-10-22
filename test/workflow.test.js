import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { generateJson, runNewWorkflow, runResumeWorkflow } from "../src/workflow.js";

function fakeShot({ number, startTime, endTime, objective, action, composition, emotion }) {
  return {
    number,
    startTime,
    endTime,
    duration: endTime - startTime,
    beat: objective,
    storyPhase: number === 1 ? "hook" : number === 3 ? "resolution" : "escalation",
    objective,
    cinematicIntent: "Use a motivated reveal to increase empathy and tension.",
    attentionFocus: "The viewer notices Subject 1 first, then the exit on frame right.",
    visualPayoff: `The final frame resolves ${objective}.`,
    subjects: ["Subject 1"],
    offscreenSubjects: [],
    setting: "restaurant",
    spatialAnchor: "Subject 1 remains beside the same table; the exit is frame right.",
    startState: number === 1 ? "Initial state" : `State leaving shot ${number - 1}`,
    continuityBridge: number === 1 ? "Initial state" : `The new framing continues from shot ${number - 1}.`,
    causalLink: `The prior beat causes ${objective} and sets up the next beat.`,
    action,
    actionBeats: [{ order: 1, startOffset: 0.5, endOffset: Math.min(2.5, endTime - startTime), action, result: `Visible result of ${action}` }],
    endState: `State leaving shot ${number}`,
    camera: { lensMm: "50mm", shotSize: "medium", angle: "eye level", position: "across the table", movement: "slow push motivated by emotion", focus: "Subject 1's face" },
    composition,
    lighting: "warm",
    dialogue: [],
    sound: { ambience: "room tone", syncEffects: ["cloth movement"], voice: "none", music: "none", bridge: "room tone continues" },
    transition: { type: "hard cut", motivation: "change in action" },
    continuityIn: ["same coat", "same table"],
    continuityOut: ["same coat", "same table"],
    emotion: { start: emotion, end: emotion, visibleCue: "controlled breathing and gaze" },
    negativeConstraints: ["no extra characters"]
  };
}

class FakeLlm {
  async generate({ prompt }) {
    if (prompt.includes("วิเคราะห์ brief")) {
      return JSON.stringify({
        title: "Night Goodbye",
        slug: "night-goodbye",
        language: "Thai",
        targetPlatform: "Reels",
        durationSeconds: 15,
        shotCountRecommendation: { minimum: 2, recommended: 3, maximum: 5, rationale: "Three clear emotional beats fit 15 seconds." },
        aspectRatio: "9:16",
        visualStyle: "cinematic",
        visualDirection: { medium: "live-action-cinematic", label: "ภาพยนตร์สมจริง (Live-action cinematic)", mood: "melancholic", source: "explicit", evidence: "cinematic brief" },
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
          fakeShot({ number: 1, startTime: 0, endTime: 5, objective: "hook", action: "looks away", composition: "two shot", emotion: "distance" }),
          fakeShot({ number: 2, startTime: 5, endTime: 10, objective: "build", action: "withdraws hand", composition: "hands", emotion: "certainty" }),
          fakeShot({ number: 3, startTime: 10, endTime: 15, objective: "resolve", action: "leaves", composition: "exit", emotion: "closure" })
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
          { pictureId: "Picture 3", assetType: "object", objectKey: "restaurant-table", name: "Table", linkedSubjects: [], usedInShots: [1, 2], purpose: "prop continuity", prompt: "Isolated restaurant table from multiple angles.", negativePrompt: "people, food", consistencyNotes: ["dark wood"] }
        ],
        usageGuide: ["Generate each image and attach it with its assigned Picture ID."]
      });
    }
    if (prompt.includes("storyboard key image แบบ contact sheet")) {
      const panelPrompt = "A cinematic still frame with a 50mm eye-level medium composition, warm restaurant practical lighting, clear foreground, midground, and background separation, stable screen direction, precise character identity and wardrobe, readable hand placement, controlled facial performance, physically consistent props, natural skin and fabric texture, and one decisive emotional instant from the approved shot.";
      const masterPrompt = "Create one polished cinematic storyboard contact sheet containing exactly three equal-sized panels in a two-column by two-row grid, ordered left-to-right and top-to-bottom, with the unused fourth cell left as a plain neutral field. Preserve the same character identity, coat, restaurant geography, table position, warm practical lighting, palette, lens language, screen direction, and realistic live-action look across all panels. Panel one shows the woman looking away across the restaurant table; panel two isolates the precise instant she withdraws her hand; panel three shows her leaving toward the established exit. Each panel is a single still moment with clean gutters, consistent 9:16 panel framing, readable silhouettes, cinematic depth, natural anatomy, and no repeated action phases. Do not place text, labels, captions, dialogue, logos, watermarks, interface elements, ghost poses, split time, or extra people inside the artwork.";
      return JSON.stringify({
        projectTitle: "Night Goodbye",
        shotCount: 3,
        grid: { columns: 2, rows: 2, readingOrder: "left-to-right, top-to-bottom", panelAspectRatio: "9:16" },
        globalStyle: { visualDirection: "Live-action cinematic", mood: "melancholic", continuityLock: "same identity, coat, table, restaurant geography and warm light" },
        referenceMapping: [
          { pictureId: "Picture 1", usage: "character identity and wardrobe" },
          { pictureId: "Picture 2", usage: "restaurant geography and lighting" },
          { pictureId: "Picture 3", usage: "table material and position" }
        ],
        panels: [
          { shotNumber: 1, timeRange: "00:00.000-00:05.000", keyframeMoment: "Subject 1 looks away", subjects: ["Subject 1"], referencePictures: ["Picture 1", "Picture 2", "Picture 3"], camera: "50mm medium eye-level", composition: "two-shot table geography", prompt: panelPrompt, continuityNotes: ["same coat"], negativeConstraints: ["no extra characters"] },
          { shotNumber: 2, timeRange: "00:05.000-00:10.000", keyframeMoment: "Subject 1 withdraws her hand", subjects: ["Subject 1"], referencePictures: ["Picture 1", "Picture 2", "Picture 3"], camera: "50mm medium eye-level", composition: "hand and face remain readable", prompt: panelPrompt, continuityNotes: ["same table"], negativeConstraints: ["no duplicate hands"] },
          { shotNumber: 3, timeRange: "00:10.000-00:15.000", keyframeMoment: "Subject 1 leaves", subjects: ["Subject 1"], referencePictures: ["Picture 1", "Picture 2"], camera: "50mm medium eye-level", composition: "exit held frame right", prompt: panelPrompt, continuityNotes: ["same screen direction"], negativeConstraints: ["no extra characters"] }
        ],
        masterPrompt,
        negativePrompt: "text, labels, subtitles, speech bubbles, watermark, logo, UI, extra panels, duplicated people, ghost poses, multiple time phases, inconsistent wardrobe, broken anatomy, changed geography",
        usageGuide: ["Attach Pictures 1-3 and generate one composite image.", "Read panels left-to-right, top-to-bottom; the fourth cell remains blank."]
      });
    }
    const detail = " The 50mm medium camera holds at eye level across the same table while warm practical light shapes her face. Her controlled breathing, gaze, and precise hand movement show the emotional change; cloth movement and restaurant room tone remain synchronized. The camera completes its slow motivated push, preserves screen direction and wardrobe continuity, and ends on a clearly defined final position before a hard cut.";
    return `DY,subject_definitions:\n<Subject 1> is a woman in a Live-action cinematic style with a melancholic tone, matching <Picture 1>. The restaurant matches <Picture 2> and table matches <Picture 3>.\nsummary:\nVisual direction: Live-action cinematic; Mood: melancholic\nretention_analysis:\nUse <Picture 1>, <Picture 2>, and <Picture 3>.\ndetailed_description:\n[Shot 1] <Subject 1> looks away.${detail}\n[Shot 2] At 00:05.000 <Subject 1> withdraws her hand.${detail}\n[Shot 3] At 00:10.000 <Subject 1> leaves.${detail}\noverall_soundscape:\nQuiet restaurant ambience.\nnon_diegetic_music:\nNone.`;
  }
}

class FailFinalLlm extends FakeLlm {
  async generate(options) {
    if (options.prompt.includes("สร้าง prompt ภาษาอังกฤษตามโครงสร้างตัวอย่าง")) throw new Error("temporary final prompt failure");
    return super.generate(options);
  }
}

class FailReferenceLlm extends FakeLlm {
  async generate(options) {
    if (options.prompt.includes("สร้าง prompt ภาษาอังกฤษสำหรับ generate ภาพอ้างอิง")) throw new Error("temporary reference prompt failure");
    return super.generate(options);
  }
}

class FailStoryboardLlm extends FakeLlm {
  async generate(options) {
    if (options.prompt.includes("storyboard key image แบบ contact sheet")) throw new Error("temporary storyboard prompt failure");
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

class SeedanceLlm extends FakeLlm {
  async generate(options) {
    if (!options.prompt.includes("production prompt ภาษาอังกฤษก้อนเดียวสำหรับ Seedance 2.5")) return super.generate(options);
    const detail = " The 50mm medium camera remains at eye level across the same table while warm practical light shapes <Subject 1>'s face. Her controlled breathing, gaze, and precise hand movement communicate the emotional change; cloth movement and restaurant room tone stay synchronized. The camera completes one motivated slow push, preserves screen direction, wardrobe, geography, and prop continuity, and ends on a clearly readable final position before the motivated hard cut.";
    return `REFERENCE_MAPPING:\n@Image1 = <Picture 1> character identity and wardrobe reference\n@Image2 = <Picture 2> restaurant geography and lighting reference\n@Image3 = <Picture 3> table material and prop-state reference\nSEQUENCE_SPECIFICATION:\nGenerator target: Seedance 2.5\nVisual direction: Live-action cinematic\nMood: melancholic\nDuration: 15 seconds; aspect ratio 9:16.\nTIMECODED_BEATS:\n[Beat 1] 00:00.000-00:05.000 <Subject 1> looks away.${detail}\n[Beat 2] 00:05.000-00:10.000 <Subject 1> withdraws her hand.${detail}\n[Beat 3] 00:10.000-00:15.000 <Subject 1> leaves.${detail}\nGLOBAL_CONSTRAINTS:\nPreserve character identity, anatomy, wardrobe, prop ownership, location geography, screen direction, lighting, physics, dialogue, synchronized audio, and every approved continuity state. No subtitles, logos, watermarks, UI, additional characters, events, or props.`;
  }
}

test("generateJson regenerates from the original prompt after repeated malformed JSON", async () => {
  const responses = [
    '{"title":"broken"',
    '{"title":"still broken"',
    '{"title":"recovered"}'
  ];
  const prompts = [];
  const llm = {
    async generate({ prompt }) {
      prompts.push(prompt);
      return responses.shift();
    }
  };

  const result = await generateJson(llm, "ORIGINAL STORY REQUEST", (value) => value.title ? [] : ["ไม่มี title"], "story");
  assert.equal(result.title, "recovered");
  assert.equal(prompts.length, 3);
  assert.match(prompts[1], /กรุณาซ่อมให้เป็น JSON object/);
  assert.match(prompts[2], /ORIGINAL STORY REQUEST/);
  assert.match(prompts[2], /สร้าง JSON สำหรับ story ใหม่ทั้งหมด/);
});

test("generateJson reports the final parse error after exhausting retries", async () => {
  const llm = { generate: async () => '{"title":' };
  await assert.rejects(
    generateJson(llm, "ORIGINAL", () => [], "story", { maxAttempts: 3 }),
    /story ไม่ผ่านการตรวจหลังลอง 3 ครั้ง/
  );
});

test("generateJson repairs a parsed response that fails schema validation", async () => {
  const responses = ['{"title":""}', '{"title":"fixed"}'];
  const prompts = [];
  const llm = {
    async generate({ prompt }) {
      prompts.push(prompt);
      return responses.shift();
    }
  };
  const result = await generateJson(llm, "ORIGINAL", (value) => value.title ? [] : ["story ไม่มี title"], "story");
  assert.equal(result.title, "fixed");
  assert.match(prompts[1], /story ไม่มี title/);
});

test("workflow creates every reviewed artifact", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-test-"));
  const asks = ["Night Goodbye", "15", "", "Reels", "9:16", ""];
  const terminal = {
    ask: async () => asks.shift() ?? "",
    multiline: async () => "A quiet breakup in a restaurant.",
    multiSelect: async () => ["pure-love"],
    choose: async (question) => question.includes("brief") ? "text" : "a"
  };
  const result = await runNewWorkflow({
    terminal,
    llm: new FakeLlm(),
    args: { output: root },
    settings: { provider: "gemini", model: "test", promptPrefix: "DY," }
  });
  assert.equal(result.status, "complete");
  for (const file of ["00-brief.md", "01-analysis.md", "02-story.md", "03-shots.md", "04-reference-image-prompts.md", "04-storyboard-keyimage-prompt.md", "05-generation-prompt.txt", ".shot-analysis/session.json"]) {
    assert.ok((await readFile(path.join(root, file), "utf8")).length > 0, `${file} should exist`);
  }
  const analysis = await readFile(path.join(root, "01-analysis.md"), "utf8");
  assert.match(analysis, /Primary — รักบริสุทธิ์และการเสียสละ/);
  const session = JSON.parse(await readFile(path.join(root, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.selectedCores[0].role, "primary");
  assert.equal(session.selectedVisualDirection.id, "live-action-cinematic");
  assert.equal(session.selectedShotCount, 3);
  assert.equal(session.referencePrompts.assets.length, 3);
  assert.equal(session.storyboardPrompt.panels.length, 3);
  const finalPrompt = await readFile(path.join(root, "05-generation-prompt.txt"), "utf8");
  assert.match(finalPrompt, /Visual direction: ภาพยนตร์สมจริง \(Live-action cinematic\)/);
});

test("workflow reads brief from a file without asking for multiline input", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-file-brief-test-"));
  const output = path.join(workspace, "output");
  const briefFile = path.join(workspace, "A Quiet Goodbye.md");
  const brief = "A quiet breakup in a restaurant, told without dialogue.";
  await writeFile(briefFile, brief, "utf8");

  const asks = [undefined, "15", "", "Reels", "9:16", ""];
  const terminal = {
    ask: async (_question, defaultValue = "") => asks.shift() ?? defaultValue,
    multiline: async () => { throw new Error("multiline input should not be requested"); },
    multiSelect: async () => ["pure-love"],
    choose: async () => "a"
  };

  const result = await runNewWorkflow({
    terminal,
    llm: new FakeLlm(),
    args: { brief: briefFile, output },
    settings: { provider: "gemini", model: "test", promptPrefix: "DY," }
  });

  assert.equal(result.status, "complete");
  const savedBrief = await readFile(path.join(output, "00-brief.md"), "utf8");
  assert.match(savedBrief, /# Brief: A Quiet Goodbye/);
  assert.match(savedBrief, new RegExp(briefFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(savedBrief, /A quiet breakup in a restaurant/);
  const session = JSON.parse(await readFile(path.join(output, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.input.brief, brief);
  assert.equal(session.input.briefFile, briefFile);
});

test("workflow lets the user select Seedance 2.5 and stores the target for resume", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-seedance-test-"));
  const asks = ["Seedance Test", "15", "", "Reels", "9:16", ""];
  const terminal = {
    ask: async () => asks.shift() ?? "",
    multiline: async () => "A quiet breakup in a restaurant.",
    multiSelect: async () => ["pure-love"],
    choose: async (question) => {
      if (question.includes("brief")) return "text";
      if (question.includes("โมเดลปลายทาง")) return "s";
      return "a";
    }
  };
  const result = await runNewWorkflow({
    terminal,
    llm: new SeedanceLlm(),
    args: { output: root },
    settings: { provider: "gemini", model: "test", promptPrefix: "DY," }
  });
  assert.equal(result.status, "complete");
  const session = JSON.parse(await readFile(path.join(root, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.generationTarget, "seedance-2.5");
  const prompt = await readFile(path.join(root, "05-generation-prompt.txt"), "utf8");
  assert.ok(prompt.startsWith("REFERENCE_MAPPING:"));
  assert.match(prompt, /Generator target: Seedance 2\.5/);
  assert.doesNotMatch(prompt, /DY,subject_definitions:/);
});

test("resume retries only the failed final prompt stage", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-resume-test-"));
  const asks = ["Resume Test", "15", "", "Reels", "9:16", ""];
  const terminal = {
    ask: async () => asks.shift() ?? "",
    multiline: async () => "A quiet breakup in a restaurant.",
    multiSelect: async () => ["pure-love"],
    choose: async (question) => question.includes("brief") ? "text" : "a"
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
  const asks = ["Reference Resume", "15", "", "Reels", "9:16", ""];
  const terminal = {
    ask: async () => asks.shift() ?? "",
    multiline: async () => "A quiet breakup in a restaurant.",
    multiSelect: async () => ["pure-love"],
    choose: async (question) => question.includes("brief") ? "text" : "a"
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
  assert.equal(llm.calls.length, 3);
  assert.match(llm.calls[0], /สร้าง prompt ภาษาอังกฤษสำหรับ generate ภาพอ้างอิง/);
  assert.match(llm.calls[1], /storyboard key image แบบ contact sheet/);
  assert.match(llm.calls[2], /REFERENCE_ASSETS:/);
  assert.equal(llm.calls.some((prompt) => prompt.includes("วิเคราะห์ brief")), false);
  assert.equal(llm.calls.some((prompt) => prompt.includes("สร้างโครงเรื่อง")), false);
  assert.equal(llm.calls.some((prompt) => prompt.includes("แตกโครงเรื่องเป็น shot list")), false);
});

test("resume retries the storyboard stage without regenerating approved reference prompts", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-storyboard-resume-test-"));
  const asks = ["Storyboard Resume", "15", "", "Reels", "9:16", ""];
  const terminal = {
    ask: async () => asks.shift() ?? "",
    multiline: async () => "A quiet breakup in a restaurant.",
    multiSelect: async () => ["pure-love"],
    choose: async (question) => question.includes("brief") ? "text" : "a"
  };
  const settings = { provider: "gemini", model: "test", promptPrefix: "DY," };
  await assert.rejects(
    runNewWorkflow({ terminal, llm: new FailStoryboardLlm(), args: { output: root }, settings }),
    /temporary storyboard prompt failure/
  );
  let session = JSON.parse(await readFile(path.join(root, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.status, "storyboard-prompt-generation");
  assert.ok(session.referencePrompts);
  assert.equal(session.storyboardPrompt, undefined);

  const llm = new CountingLlm();
  const result = await runResumeWorkflow({ terminal, llm, folder: root, settings });
  assert.equal(result.status, "complete");
  assert.equal(llm.calls.length, 2);
  assert.match(llm.calls[0], /storyboard key image แบบ contact sheet/);
  assert.match(llm.calls[1], /REFERENCE_ASSETS:/);
  assert.equal(llm.calls.some((prompt) => prompt.includes("generate ภาพอ้างอิง")), false);
  session = JSON.parse(await readFile(path.join(root, ".shot-analysis/session.json"), "utf8"));
  assert.equal(session.storyboardPrompt.panels.length, 3);
});

test("resume discovers a single project session below the requested folder", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-discovery-test-"));
  const project = path.join(root, "nested", "my-clip");
  await mkdir(path.join(project, ".shot-analysis"), { recursive: true });
  await writeFile(path.join(project, ".shot-analysis", "session.json"), JSON.stringify({
    version: 1,
    status: "complete",
    input: { brief: "done" },
    finalPromptFile: path.join(project, "04-generation-prompt.txt")
  }));
  const llm = { generate: async () => { throw new Error("LLM should not be called"); } };
  const result = await runResumeWorkflow({
    terminal: {},
    llm,
    folder: root,
    settings: { provider: "gemini", model: "test", promptPrefix: "DY," }
  });
  assert.equal(result.status, "complete");
  assert.equal(result.outputFolder, project);
});
