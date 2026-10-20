import path from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { extractJson, resolveOutputPath, slugify } from "./utils.js";
import { analysisPrompt, finalPrompt, shotsPrompt, storyPrompt, SYSTEM_PROMPT } from "./prompts.js";
import { renderAnalysis, renderShots, renderStory } from "./render.js";
import { selectStoryCores } from "./cores.js";
import { validateAnalysis, validateFinalPrompt, validateShots, validateStory } from "./validators.js";

async function saveText(target, content) {
  await writeFile(target, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

async function saveState(folder, state) {
  const hidden = path.join(folder, ".shot-analysis");
  await mkdir(hidden, { recursive: true });
  await writeFile(path.join(hidden, "session.json"), `${JSON.stringify(state, null, 2)}\n`, "utf8");
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
  const briefFromFile = args.brief ? await readFile(resolveOutputPath(args.brief), "utf8") : "";
  const projectName = await terminal.ask("ชื่อโปรเจกต์คลิป", "untitled-clip");
  const brief = briefFromFile || await terminal.multiline("อธิบายคลิปที่ต้องการสร้าง ตัวละคร เหตุการณ์ อารมณ์ และสิ่งอ้างอิงที่มี");
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

  const input = { projectName, brief, durationSeconds, targetPlatform, aspectRatio, references };
  const answers = {};
  const state = { version: 1, status: "analyzing", provider: settings.provider, model: settings.model, input, answers, outputFolder };
  await saveText(path.join(outputFolder, "00-brief.md"), `# Brief: ${projectName}\n\n${brief}\n\n- Duration: ${durationSeconds}s\n- Platform: ${targetPlatform}\n- Aspect ratio: ${aspectRatio}\n- References: ${references || "ไม่มี"}\n`);
  await saveState(outputFolder, state);

  console.log("\nกำลังวิเคราะห์ brief...");
  let analysis = await generateJson(llm, analysisPrompt({ ...input, answers }), validateAnalysis, "analysis");
  for (let round = 0; round < 3 && analysis.clarificationQuestions.some((item) => item.required); round += 1) {
    console.log("\nต้องการข้อมูลเพิ่มเติมก่อนวางโครงเรื่อง");
    for (const question of analysis.clarificationQuestions) {
      const answer = await terminal.ask(`${question.question}\n  เหตุผล: ${question.why}`);
      if (answer) answers[question.id] = answer;
    }
    analysis = await generateJson(llm, analysisPrompt({ ...input, answers, previousAnalysis: analysis }), validateAnalysis, "analysis");
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
  console.log("\nเลือก Core ที่จะใช้ขับเคลื่อนคลิป");
  const selectedCores = await selectStoryCores(terminal, analysis);
  analysis.selectedCores = selectedCores;
  state.selectedCores = selectedCores;
  console.log(`Core หลัก: ${selectedCores.find((core) => core.role === "primary").name}`);
  const analysisFile = path.join(outputFolder, "01-analysis.md");
  await saveText(analysisFile, renderAnalysis(analysis));
  state.analysis = analysis;
  state.answers = answers;
  state.status = "story-review";
  await saveState(outputFolder, state);

  console.log("กำลังสร้างโครงเรื่อง...");
  let story = await generateJson(llm, storyPrompt(analysis, answers), validateStory, "story");
  const storyFile = path.join(outputFolder, "02-story.md");
  await saveText(storyFile, renderStory(story));
  const storyApproved = await reviewDocument(terminal, "โครงเรื่อง", storyFile, async (notes) => {
    story = await generateJson(llm, storyPrompt(analysis, answers, notes), validateStory, "story");
    await saveText(storyFile, renderStory(story));
  });
  state.story = story;
  state.status = storyApproved ? "shots-review" : "story-review";
  await saveState(outputFolder, state);
  if (!storyApproved) return { outputFolder, status: state.status };

  console.log("กำลังแตกโครงเรื่องเป็น shot list...");
  let shots = await generateJson(llm, shotsPrompt(story), validateShots, "shot list");
  const shotsFile = path.join(outputFolder, "03-shots.md");
  await saveText(shotsFile, renderShots(shots));
  const shotsApproved = await reviewDocument(terminal, "shot list", shotsFile, async (notes) => {
    shots = await generateJson(llm, shotsPrompt(story, notes), validateShots, "shot list");
    await saveText(shotsFile, renderShots(shots));
  });
  state.shots = shots;
  state.status = shotsApproved ? "generating-prompt" : "shots-review";
  await saveState(outputFolder, state);
  if (!shotsApproved) return { outputFolder, status: state.status };

  console.log("กำลังสร้าง generation prompt ฉบับสุดท้าย...");
  const prefix = settings.promptPrefix ?? "DY,";
  let generated = await llm.generate({ system: SYSTEM_PROMPT, prompt: finalPrompt(story, shots, prefix), temperature: 0.2 });
  const expectedShotCount = shots.shots.length;
  let errors = validateFinalPrompt(generated, prefix, expectedShotCount);
  if (errors.length) {
    generated = await llm.generate({
      system: SYSTEM_PROMPT,
      prompt: `แก้ prompt ให้ผ่านข้อกำหนด: ${errors.join("; ")}\n\n${generated}`,
      temperature: 0.1
    });
    errors = validateFinalPrompt(generated, prefix, expectedShotCount);
  }
  if (errors.length) throw new Error(`generation prompt ไม่ผ่านการตรวจ: ${errors.join("; ")}`);
  const promptFile = path.join(outputFolder, "04-generation-prompt.txt");
  await saveText(promptFile, generated.trim());
  state.status = "complete";
  state.completedAt = new Date().toISOString();
  state.finalPromptFile = promptFile;
  await saveState(outputFolder, state);
  return { outputFolder, status: state.status, promptFile };
}
