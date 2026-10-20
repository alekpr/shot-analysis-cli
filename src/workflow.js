import path from "node:path";
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extractJson, resolveOutputPath, slugify } from "./utils.js";
import { analysisPrompt, finalPrompt, referencePromptsPrompt, shotsPrompt, storyPrompt, SYSTEM_PROMPT } from "./prompts.js";
import { renderAnalysis, renderReferencePrompts, renderShots, renderStory } from "./render.js";
import { selectStoryCores } from "./cores.js";
import { resolveVisualDirection } from "./visual-direction.js";
import { normalizeFinalPrompt, validateAnalysis, validateFinalPrompt, validateReferencePrompts, validateShots, validateStory } from "./validators.js";
import { loadBriefFile } from "./brief.js";

async function saveText(target, content) {
  await writeFile(target, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

async function saveState(folder, state) {
  const hidden = path.join(folder, ".shot-analysis");
  await mkdir(hidden, { recursive: true });
  await writeFile(path.join(hidden, "session.json"), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function containsSession(folder) {
  try {
    await access(path.join(folder, ".shot-analysis", "session.json"));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function findSessionsBelow(folder, depth = 3) {
  if (depth < 0) return [];
  let entries;
  try {
    entries = await readdir(folder, { withFileTypes: true });
  } catch (error) {
    if (["ENOENT", "ENOTDIR", "EACCES"].includes(error.code)) return [];
    throw error;
  }
  const sessions = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || [".git", ".shot-analysis", "node_modules"].includes(entry.name)) continue;
    const child = path.join(folder, entry.name);
    if (await containsSession(child)) sessions.push(child);
    if (depth > 0) sessions.push(...await findSessionsBelow(child, depth - 1));
  }
  return sessions;
}

async function resolveSessionFolder(requestedFolder) {
  const requested = path.resolve(requestedFolder);
  if (await containsSession(requested)) return requested;

  const descendants = [...new Set(await findSessionsBelow(requested))];
  if (descendants.length === 1) {
    console.log(`พบ session ในโฟลเดอร์ย่อย: ${descendants[0]}`);
    return descendants[0];
  }
  if (descendants.length > 1) {
    const choices = descendants.map((folder) => `- ${folder}`).join("\n");
    throw new Error(`พบหลาย session ใต้ ${requested}\n${choices}\nระบุโฟลเดอร์โปรเจกต์ที่ต้องการ เช่น shot-analysis resume "${descendants[0]}"`);
  }

  let ancestor = path.dirname(requested);
  while (ancestor !== path.dirname(ancestor)) {
    if (await containsSession(ancestor)) {
      console.log(`พบ session ในโฟลเดอร์แม่: ${ancestor}`);
      return ancestor;
    }
    ancestor = path.dirname(ancestor);
  }
  throw new Error(`ไม่พบ session สำหรับ resume ใต้หรือเหนือ ${requested}\nกรุณาระบุโฟลเดอร์โปรเจกต์ที่มีไฟล์ .shot-analysis/session.json`);
}

async function loadState(requestedFolder) {
  const folder = await resolveSessionFolder(requestedFolder);
  const target = path.join(folder, ".shot-analysis", "session.json");
  try {
    return { state: JSON.parse(await readFile(target, "utf8")), folder };
  } catch (error) {
    throw new Error(`อ่าน session ไม่สำเร็จ: ${error.message}`);
  }
}

async function checkpoint(folder, state, status) {
  state.version = 2;
  state.status = status;
  state.updatedAt = new Date().toISOString();
  delete state.lastError;
  await saveState(folder, state);
}

async function saveFailure(folder, state, error) {
  state.lastError = {
    stage: state.status,
    message: error.message,
    at: new Date().toISOString()
  };
  state.updatedAt = state.lastError.at;
  await saveState(folder, state);
}

async function trackFailure(folder, state, operation) {
  try {
    return await operation();
  } catch (error) {
    await saveFailure(folder, state, error);
    throw error;
  }
}

function normalizeExistingReferences(analysis, references = "") {
  const raw = analysis?.references?.length
    ? analysis.references
    : references.split(",").map((item) => item.trim()).filter(Boolean).map((label) => ({ label, description: "ภาพอ้างอิงที่ผู้ใช้ระบุ" }));
  return raw.map((item, index) => {
    const candidate = String(item.pictureId || item.label || "").trim().replace(/^<|>$/g, "");
    return {
      pictureId: /^Picture \d+$/i.test(candidate) ? candidate : `Picture ${index + 1}`,
      description: item.description || candidate || "ภาพอ้างอิงที่ผู้ใช้ระบุ"
    };
  });
}

async function generateJson(llm, prompt, validator, label) {
  let response = await llm.generate({ system: SYSTEM_PROMPT, prompt, json: true });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const value = extractJson(response);
      const errors = validator(value);
      if (errors.length === 0) return value;
      response = await llm.generate({
        system: SYSTEM_PROMPT,
        prompt: `แก้ JSON สำหรับ ${label} ให้ผ่าน validation ต่อไปนี้: ${errors.join("; ")}\n\nJSON เดิม:\n${JSON.stringify(value, null, 2)}\nตอบเฉพาะ JSON ที่แก้แล้ว`,
        json: true,
        temperature: 0.1
      });
    } catch (error) {
      if (attempt === 1) throw new Error(`${label} ไม่ผ่านการตรวจ: ${error.message}`);
      response = await llm.generate({
        system: SYSTEM_PROMPT,
        prompt: `คำตอบต่อไปนี้ไม่ใช่ JSON ที่อ่านได้ กรุณาแปลงเป็น JSON ที่ถูกต้องโดยไม่ตัดข้อมูล:\n${response}`,
        json: true,
        temperature: 0.1
      });
    }
  }
  throw new Error(`${label} ไม่ผ่านการตรวจหลังแก้ไข`);
}

async function reviewDocument(terminal, label, file, regenerate) {
  for (let round = 0; round < 6; round += 1) {
    console.log(`\nสร้าง ${label} แล้ว: ${file}`);
    const action = await terminal.choose(`ตรวจ ${label} แล้วเลือกขั้นตอนต่อไป`, [
      { key: "a", label: "อนุมัติ" },
      { key: "r", label: "ขอแก้ไข" },
      { key: "q", label: "หยุดและบันทึกไว้" }
    ], "a");
    if (action === "a") return true;
    if (action === "q") return false;
    const notes = await terminal.multiline(`ระบุสิ่งที่ต้องการแก้ใน ${label}`);
    await regenerate(notes);
  }
  throw new Error(`แก้ไข ${label} เกินจำนวนรอบที่กำหนด กรุณาเริ่มใหม่จากไฟล์ที่บันทึกไว้`);
}

export async function runNewWorkflow({ terminal, llm, args, settings }) {
  let briefFilePath = args.brief || args["brief-file"] || "";
  if (!briefFilePath) {
    const inputMode = await terminal.choose("ต้องการระบุ brief ด้วยวิธีใด", [
      { key: "text", label: "พิมพ์หรือวางข้อความใน Terminal" },
      { key: "file", label: "อ่านจากไฟล์ข้อความ" }
    ], "text");
    if (inputMode === "file") briefFilePath = await terminal.ask("path ของไฟล์ brief (สามารถลากไฟล์มาวางได้)");
  }
  const briefFile = briefFilePath ? await loadBriefFile(briefFilePath) : null;
  if (briefFile) console.log(`อ่าน brief จาก: ${briefFile.file}`);
  const defaultProjectName = briefFile ? path.basename(briefFile.file, path.extname(briefFile.file)) : "untitled-clip";
  const projectName = await terminal.ask("ชื่อโปรเจกต์คลิป", defaultProjectName);
  const brief = briefFile?.content || await terminal.multiline("อธิบายคลิปที่ต้องการสร้าง ตัวละคร เหตุการณ์ อารมณ์ และสิ่งอ้างอิงที่มี");
  if (!brief) throw new Error("ต้องมี brief เริ่มต้น");

  const durationSeconds = Number(await terminal.ask("ความยาวคลิป (วินาที)", "15"));
  const targetPlatform = await terminal.ask("แพลตฟอร์มเป้าหมาย", "Facebook Reels");
  const aspectRatio = await terminal.ask("อัตราส่วนภาพ", "9:16");
  const references = await terminal.ask("รายการภาพอ้างอิง เช่น Picture 1, Picture 2 (เว้นว่างได้)", "");
  const defaultFolder = `./${slugify(projectName)}`;
  const outputFolder = resolveOutputPath(args.output || await terminal.ask("โฟลเดอร์เก็บเอกสารโปรเจกต์", defaultFolder));
  const firstArtifact = path.join(outputFolder, "00-brief.md");
  try {
    await access(firstArtifact);
    const overwrite = await terminal.choose(`พบเอกสารเดิมที่ ${outputFolder}`, [
      { key: "o", label: "เขียนทับไฟล์ของ workflow นี้" },
      { key: "q", label: "หยุด" }
    ], "q");
    if (overwrite === "q") return { outputFolder, status: "cancelled" };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await mkdir(outputFolder, { recursive: true });

  const input = { projectName, brief, durationSeconds, targetPlatform, aspectRatio, references, ...(briefFile ? { briefFile: briefFile.file } : {}) };
  const answers = {};
  const state = { version: 2, status: "analyzing", provider: settings.provider, model: settings.model, input, answers, outputFolder };
  await saveText(path.join(outputFolder, "00-brief.md"), `# Brief: ${projectName}\n\n${brief}\n\n- Brief source: ${briefFile?.file || "Terminal"}\n- Duration: ${durationSeconds}s\n- Platform: ${targetPlatform}\n- Aspect ratio: ${aspectRatio}\n- References: ${references || "ไม่มี"}\n`);
  await saveState(outputFolder, state);

  console.log("\nกำลังวิเคราะห์ brief...");
  let analysis = await trackFailure(outputFolder, state, () => generateJson(llm, analysisPrompt({ ...input, answers }), validateAnalysis, "analysis"));
  for (let round = 0; round < 3 && analysis.clarificationQuestions.some((item) => item.required); round += 1) {
    console.log("\nต้องการข้อมูลเพิ่มเติมก่อนวางโครงเรื่อง");
    for (const question of analysis.clarificationQuestions) {
      const answer = await terminal.ask(`${question.question}\n  เหตุผล: ${question.why}`);
      if (answer) answers[question.id] = answer;
    }
    state.answers = answers;
    state.analysis = analysis;
    await checkpoint(outputFolder, state, "analyzing");
    analysis = await trackFailure(outputFolder, state, () => generateJson(llm, analysisPrompt({ ...input, answers, previousAnalysis: analysis }), validateAnalysis, "analysis"));
  }
  if (analysis.clarificationQuestions.some((item) => item.required)) {
    console.log("\nLLM ยังระบุว่ามีข้อมูลสำคัญไม่ครบหลังการถามเพิ่มเติม");
    const proceed = await terminal.choose("ต้องการเดินหน้าด้วยสมมติฐานที่มีหรือหยุดไว้ก่อน", [
      { key: "p", label: "เดินหน้าต่อ" },
      { key: "q", label: "หยุด" }
    ], "q");
    if (proceed === "q") {
      state.analysis = analysis;
      state.answers = answers;
      state.status = "needs-information";
      await saveText(path.join(outputFolder, "01-analysis.md"), renderAnalysis(analysis));
      await saveState(outputFolder, state);
      return { outputFolder, status: state.status };
    }
  }
  const selectedVisualDirection = await resolveVisualDirection(terminal, analysis);
  analysis.selectedVisualDirection = selectedVisualDirection;
  state.selectedVisualDirection = selectedVisualDirection;
  console.log(`รูปแบบภาพ: ${selectedVisualDirection.label}${selectedVisualDirection.mood ? ` — ${selectedVisualDirection.mood}` : ""}`);

  console.log("\nเลือก Core ที่จะใช้ขับเคลื่อนคลิป");
  const selectedCores = await selectStoryCores(terminal, analysis);
  analysis.selectedCores = selectedCores;
  state.selectedCores = selectedCores;
  console.log(`Core หลัก: ${selectedCores.find((core) => core.role === "primary").name}`);
  const analysisFile = path.join(outputFolder, "01-analysis.md");
  await saveText(analysisFile, renderAnalysis(analysis));
  state.analysis = analysis;
  state.answers = answers;
  await checkpoint(outputFolder, state, "story-generation");

  console.log("กำลังสร้างโครงเรื่อง...");
  let story = await trackFailure(outputFolder, state, () => generateJson(llm, storyPrompt(analysis, answers), validateStory, "story"));
  const storyFile = path.join(outputFolder, "02-story.md");
  await saveText(storyFile, renderStory(story));
  state.story = story;
  await checkpoint(outputFolder, state, "story-review");
  const storyApproved = await reviewDocument(terminal, "โครงเรื่อง", storyFile, async (notes) => {
    story = await trackFailure(outputFolder, state, () => generateJson(llm, storyPrompt(analysis, answers, notes), validateStory, "story"));
    await saveText(storyFile, renderStory(story));
    state.story = story;
    await checkpoint(outputFolder, state, "story-review");
  });
  state.story = story;
  await checkpoint(outputFolder, state, storyApproved ? "shots-generation" : "story-review");
  if (!storyApproved) return { outputFolder, status: state.status };

  console.log("กำลังแตกโครงเรื่องเป็น shot list...");
  let shots = await trackFailure(outputFolder, state, () => generateJson(llm, shotsPrompt(story), validateShots, "shot list"));
  const shotsFile = path.join(outputFolder, "03-shots.md");
  await saveText(shotsFile, renderShots(shots));
  state.shots = shots;
  await checkpoint(outputFolder, state, "shots-review");
  const shotsApproved = await reviewDocument(terminal, "shot list", shotsFile, async (notes) => {
    shots = await trackFailure(outputFolder, state, () => generateJson(llm, shotsPrompt(story, notes), validateShots, "shot list"));
    await saveText(shotsFile, renderShots(shots));
    state.shots = shots;
    await checkpoint(outputFolder, state, "shots-review");
  });
  state.shots = shots;
  await checkpoint(outputFolder, state, shotsApproved ? "reference-prompts-generation" : "shots-review");
  if (!shotsApproved) return { outputFolder, status: state.status };

  console.log("กำลังสร้าง prompt สำหรับภาพอ้างอิง...");
  const existingReferences = normalizeExistingReferences(analysis, references);
  const existingReferenceLabels = existingReferences.map((item) => item.pictureId);
  let referencePrompts = await trackFailure(outputFolder, state, () => generateJson(
    llm,
    referencePromptsPrompt(story, shots, existingReferences),
    (value) => validateReferencePrompts(value, existingReferenceLabels),
    "reference image prompts"
  ));
  const referencePromptsFile = path.join(outputFolder, "04-reference-image-prompts.md");
  await saveText(referencePromptsFile, renderReferencePrompts(referencePrompts));
  state.referencePrompts = referencePrompts;
  await checkpoint(outputFolder, state, "reference-prompts-review");
  const referencePromptsApproved = await reviewDocument(terminal, "reference image prompts", referencePromptsFile, async (notes) => {
    referencePrompts = await trackFailure(outputFolder, state, () => generateJson(
      llm,
      referencePromptsPrompt(story, shots, existingReferences, notes),
      (value) => validateReferencePrompts(value, existingReferenceLabels),
      "reference image prompts"
    ));
    await saveText(referencePromptsFile, renderReferencePrompts(referencePrompts));
    state.referencePrompts = referencePrompts;
    await checkpoint(outputFolder, state, "reference-prompts-review");
  });
  state.referencePrompts = referencePrompts;
  await checkpoint(outputFolder, state, referencePromptsApproved ? "generating-prompt" : "reference-prompts-review");
  if (!referencePromptsApproved) return { outputFolder, status: state.status };

  console.log("กำลังสร้าง generation prompt ฉบับสุดท้าย...");
  const prefix = settings.promptPrefix ?? "DY,";
  let generated = normalizeFinalPrompt(await trackFailure(outputFolder, state, () => llm.generate({ system: SYSTEM_PROMPT, prompt: finalPrompt(story, shots, prefix, selectedVisualDirection, referencePrompts), temperature: 0.2 })), prefix);
  const expectedShotCount = shots.shots.length;
  let errors = validateFinalPrompt(generated, prefix, expectedShotCount, selectedVisualDirection, referencePrompts);
  if (errors.length) {
    generated = normalizeFinalPrompt(await trackFailure(outputFolder, state, () => llm.generate({
      system: SYSTEM_PROMPT,
      prompt: `แก้ prompt ให้ผ่านข้อกำหนด: ${errors.join("; ")}\nคำตอบต้องเริ่มด้วยตัวอักษร ${prefix}subject_definitions: ทันที ห้ามมีช่องว่าง คำอธิบาย Markdown heading หรือ code fence ก่อนหน้า\n\n${generated}`,
      temperature: 0.1
    })), prefix);
    errors = validateFinalPrompt(generated, prefix, expectedShotCount, selectedVisualDirection, referencePrompts);
  }
  if (errors.length) {
    const error = new Error(`generation prompt ไม่ผ่านการตรวจ: ${errors.join("; ")}`);
    await saveText(path.join(outputFolder, "05-generation-prompt.failed.txt"), generated);
    await saveFailure(outputFolder, state, error);
    throw error;
  }
  const promptFile = path.join(outputFolder, "05-generation-prompt.txt");
  await saveText(promptFile, generated.trim());
  await rm(path.join(outputFolder, "05-generation-prompt.failed.txt"), { force: true });
  state.completedAt = new Date().toISOString();
  state.finalPromptFile = promptFile;
  await checkpoint(outputFolder, state, "complete");
  return { outputFolder, status: state.status, promptFile };
}

export async function runResumeWorkflow({ terminal, llm, folder = ".", settings }) {
  const requestedFolder = resolveOutputPath(folder);
  const { state, folder: outputFolder } = await loadState(requestedFolder);
  state.outputFolder = outputFolder;
  state.provider = settings.provider;
  state.model = settings.model;
  state.resumeCount = Number(state.resumeCount || 0) + 1;
  state.lastResumedAt = new Date().toISOString();

  if (state.status === "complete") {
    return { outputFolder, status: "complete", promptFile: state.finalPromptFile };
  }
  if (!state.input?.brief) throw new Error("session ไม่มี brief เริ่มต้น จึง resume ไม่ได้");

  try {
    const input = state.input;
    const answers = state.answers || {};

    if (!state.analysis || ["analyzing", "needs-information"].includes(state.status)) {
      console.log("\nกำลังทำขั้นวิเคราะห์ต่อ...");
      let analysis = state.analysis || await generateJson(llm, analysisPrompt({ ...input, answers }), validateAnalysis, "analysis");
      for (let round = 0; round < 3 && analysis.clarificationQuestions.some((item) => item.required); round += 1) {
        console.log("\nต้องการข้อมูลเพิ่มเติมก่อนวางโครงเรื่อง");
        for (const question of analysis.clarificationQuestions) {
          if (answers[question.id]) continue;
          const answer = await terminal.ask(`${question.question}\n  เหตุผล: ${question.why}`);
          if (answer) answers[question.id] = answer;
        }
        state.answers = answers;
        state.analysis = analysis;
        await checkpoint(outputFolder, state, "analyzing");
        analysis = await generateJson(llm, analysisPrompt({ ...input, answers, previousAnalysis: analysis }), validateAnalysis, "analysis");
      }
      if (analysis.clarificationQuestions.some((item) => item.required)) {
        const proceed = await terminal.choose("ข้อมูลยังไม่ครบ ต้องการเดินหน้าด้วยสมมติฐานที่มีหรือหยุดไว้ก่อน", [
          { key: "p", label: "เดินหน้าต่อ" },
          { key: "q", label: "หยุด" }
        ], "q");
        if (proceed === "q") {
          state.analysis = analysis;
          state.answers = answers;
          await saveText(path.join(outputFolder, "01-analysis.md"), renderAnalysis(analysis));
          await checkpoint(outputFolder, state, "needs-information");
          return { outputFolder, status: state.status };
        }
      }

      const selectedVisualDirection = state.selectedVisualDirection || analysis.selectedVisualDirection || await resolveVisualDirection(terminal, analysis);
      const selectedCores = state.selectedCores || analysis.selectedCores || await selectStoryCores(terminal, analysis);
      analysis.selectedVisualDirection = selectedVisualDirection;
      analysis.selectedCores = selectedCores;
      state.analysis = analysis;
      state.answers = answers;
      state.selectedVisualDirection = selectedVisualDirection;
      state.selectedCores = selectedCores;
      await saveText(path.join(outputFolder, "01-analysis.md"), renderAnalysis(analysis));
      await checkpoint(outputFolder, state, "story-generation");
    }

    const analysis = state.analysis;
    const selectedVisualDirection = state.selectedVisualDirection || analysis.selectedVisualDirection;

    if (!state.story || ["story-generation", "story-review"].includes(state.status)) {
      let story = state.story;
      const storyFile = path.join(outputFolder, "02-story.md");
      if (!story) {
        console.log("กำลังสร้างโครงเรื่องต่อ...");
        story = await generateJson(llm, storyPrompt(analysis, answers), validateStory, "story");
        state.story = story;
        await saveText(storyFile, renderStory(story));
        await checkpoint(outputFolder, state, "story-review");
      }
      const approved = await reviewDocument(terminal, "โครงเรื่อง", storyFile, async (notes) => {
        story = await generateJson(llm, storyPrompt(analysis, answers, notes), validateStory, "story");
        state.story = story;
        await saveText(storyFile, renderStory(story));
        await checkpoint(outputFolder, state, "story-review");
      });
      state.story = story;
      await checkpoint(outputFolder, state, approved ? "shots-generation" : "story-review");
      if (!approved) return { outputFolder, status: state.status };
    }

    if (!state.shots || ["shots-generation", "shots-review"].includes(state.status)) {
      let shots = state.shots;
      const shotsFile = path.join(outputFolder, "03-shots.md");
      if (!shots) {
        console.log("กำลังสร้าง shot list ต่อ...");
        shots = await generateJson(llm, shotsPrompt(state.story), validateShots, "shot list");
        state.shots = shots;
        await saveText(shotsFile, renderShots(shots));
        await checkpoint(outputFolder, state, "shots-review");
      }
      const approved = await reviewDocument(terminal, "shot list", shotsFile, async (notes) => {
        shots = await generateJson(llm, shotsPrompt(state.story, notes), validateShots, "shot list");
        state.shots = shots;
        await saveText(shotsFile, renderShots(shots));
        await checkpoint(outputFolder, state, "shots-review");
      });
      state.shots = shots;
      await checkpoint(outputFolder, state, approved ? "reference-prompts-generation" : "shots-review");
      if (!approved) return { outputFolder, status: state.status };
    }

    if (!state.referencePrompts || ["reference-prompts-generation", "reference-prompts-review"].includes(state.status)) {
      let referencePrompts = state.referencePrompts;
      const existingReferences = normalizeExistingReferences(analysis, input.references);
      const existingReferenceLabels = existingReferences.map((item) => item.pictureId);
      const referencePromptsFile = path.join(outputFolder, "04-reference-image-prompts.md");
      if (!referencePrompts) {
        console.log("กำลังสร้าง prompt สำหรับภาพอ้างอิงต่อ...");
        referencePrompts = await generateJson(
          llm,
          referencePromptsPrompt(state.story, state.shots, existingReferences),
          (value) => validateReferencePrompts(value, existingReferenceLabels),
          "reference image prompts"
        );
        state.referencePrompts = referencePrompts;
        await saveText(referencePromptsFile, renderReferencePrompts(referencePrompts));
        await checkpoint(outputFolder, state, "reference-prompts-review");
      }
      const approved = await reviewDocument(terminal, "reference image prompts", referencePromptsFile, async (notes) => {
        referencePrompts = await generateJson(
          llm,
          referencePromptsPrompt(state.story, state.shots, existingReferences, notes),
          (value) => validateReferencePrompts(value, existingReferenceLabels),
          "reference image prompts"
        );
        state.referencePrompts = referencePrompts;
        await saveText(referencePromptsFile, renderReferencePrompts(referencePrompts));
        await checkpoint(outputFolder, state, "reference-prompts-review");
      });
      state.referencePrompts = referencePrompts;
      await checkpoint(outputFolder, state, approved ? "generating-prompt" : "reference-prompts-review");
      if (!approved) return { outputFolder, status: state.status };
    }

    if (state.status === "generating-prompt") {
      console.log("กำลังสร้าง generation prompt ต่อจาก checkpoint...");
      const prefix = settings.promptPrefix ?? "DY,";
      let generated = normalizeFinalPrompt(await llm.generate({
        system: SYSTEM_PROMPT,
        prompt: finalPrompt(state.story, state.shots, prefix, selectedVisualDirection, state.referencePrompts),
        temperature: 0.2
      }), prefix);
      const expectedShotCount = state.shots.shots.length;
      let errors = validateFinalPrompt(generated, prefix, expectedShotCount, selectedVisualDirection, state.referencePrompts);
      if (errors.length) {
        generated = normalizeFinalPrompt(await llm.generate({
          system: SYSTEM_PROMPT,
          prompt: `แก้ prompt ให้ผ่านข้อกำหนด: ${errors.join("; ")}\nคำตอบต้องเริ่มด้วยตัวอักษร ${prefix}subject_definitions: ทันที ห้ามมีช่องว่าง คำอธิบาย Markdown heading หรือ code fence ก่อนหน้า\n\n${generated}`,
          temperature: 0.1
        }), prefix);
        errors = validateFinalPrompt(generated, prefix, expectedShotCount, selectedVisualDirection, state.referencePrompts);
      }
      if (errors.length) {
        await saveText(path.join(outputFolder, "05-generation-prompt.failed.txt"), generated);
        throw new Error(`generation prompt ไม่ผ่านการตรวจ: ${errors.join("; ")}`);
      }
      const promptFile = path.join(outputFolder, "05-generation-prompt.txt");
      await saveText(promptFile, generated.trim());
      await rm(path.join(outputFolder, "05-generation-prompt.failed.txt"), { force: true });
      state.completedAt = new Date().toISOString();
      state.finalPromptFile = promptFile;
      await checkpoint(outputFolder, state, "complete");
      return { outputFolder, status: state.status, promptFile };
    }

    throw new Error(`ไม่สามารถ resume จาก status ที่ไม่รู้จัก: ${state.status}`);
  } catch (error) {
    await saveFailure(outputFolder, state, error);
    throw error;
  }
}
