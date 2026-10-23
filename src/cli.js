import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig, loadEnvFiles, PROVIDERS, saveConfig, validateConfig } from "./config.js";
import { LlmClient } from "./llm.js";
import { createTerminal } from "./terminal.js";
import { parseArgs } from "./utils.js";
import { runNewWorkflow, runRegeneratePromptWorkflow, runResumeWorkflow } from "./workflow.js";
import { generationTargetLabel } from "./generation-target.js";

const HELP = `shot-analysis-cli\n\nคำสั่ง:\n  shot-analysis config                 ตั้งค่า LLM provider และ model\n  shot-analysis new [options]          เริ่มโปรเจกต์คลิปแบบ interactive\n  shot-analysis resume [folder]        ทำงานต่อจาก checkpoint ล่าสุด\n  shot-analysis regenerate [folder]    สร้าง final prompt ใหม่จากข้อมูลที่อนุมัติแล้ว\n  shot-analysis status [folder]        ดูสถานะโปรเจกต์\n\noptions ของ new:\n  --brief <file>                        อ่าน brief จากไฟล์ข้อความ\n  --brief-file <file>                   alias ของ --brief\n  --output <folder>                     กำหนดโฟลเดอร์เอกสารโปรเจกต์\n\nหากไม่ระบุ --brief ระบบจะให้เลือกพิมพ์ brief หรืออ่านจากไฟล์ รองรับ .txt, .md, .json, .yaml และไฟล์ข้อความ UTF-8\nตั้ง provider, model และ API keys ผ่าน .env ได้ ค่าใน .env มีลำดับความสำคัญสูงกว่า settings`;

async function configure(terminal) {
  const existing = await loadConfig();
  const provider = await terminal.choose("เลือก LLM provider", [
    { key: "gemini", label: "Gemini" },
    { key: "anthropic", label: "Claude" },
    { key: "deepseek", label: "DeepSeek" }
  ], existing?.provider || "gemini");
  const defaults = PROVIDERS[provider];
  const model = await terminal.ask("ชื่อ model", existing?.provider === provider ? existing.model : defaults.defaultModel);
  const apiKeyEnv = await terminal.ask("ชื่อ environment variable ที่เก็บ API key", existing?.provider === provider ? existing.apiKeyEnv : defaults.defaultApiKeyEnv);
  const promptPrefix = await terminal.ask("prefix ก่อน subject_definitions", existing?.promptPrefix ?? "DY,");
  const baseUrl = await terminal.ask("Custom API base URL (เว้นว่างเพื่อใช้ค่ามาตรฐาน)", existing?.provider === provider ? existing.baseUrl || "" : "");
  const target = await saveConfig({ provider, model, apiKeyEnv, promptPrefix, ...(baseUrl ? { baseUrl } : {}) });
  console.log(`\nบันทึก settings แล้ว: ${target}`);
  console.log(`ตั้ง API key ก่อนใช้งาน: export ${apiKeyEnv}=\"...\"`);
}

async function showStatus(folder = ".") {
  const target = path.resolve(folder, ".shot-analysis", "session.json");
  await access(target);
  const state = JSON.parse(await readFile(target, "utf8"));
  console.log(`Project: ${state.input?.projectName || "-"}`);
  console.log(`Status: ${state.status}`);
  console.log(`Provider: ${state.provider} / ${state.model}`);
  if (state.generationTarget) console.log(`Generator target: ${generationTargetLabel(state.generationTarget)}`);
  for (const [targetName, promptFile] of Object.entries(state.finalPromptFiles || {})) {
    console.log(`Prompt (${generationTargetLabel(targetName)}): ${promptFile}`);
  }
  console.log(`Shots: ${state.selectedShotCount || state.shots?.shots?.length || state.input?.requestedShotCount || "-"}`);
  console.log(`Folder: ${state.outputFolder}`);
  if (state.lastError) console.log(`Last error: [${state.lastError.stage}] ${state.lastError.message}`);
}

export async function main(argv) {
  const envInfo = loadEnvFiles();
  const { command, args } = parseArgs(argv);
  if (["help", "--help", "-h"].includes(command)) {
    console.log(HELP);
    return;
  }
  const terminal = createTerminal();
  try {
    if (command === "config") {
      await configure(terminal);
      return;
    }
    if (command === "status") {
      await showStatus(argv[1] || ".");
      return;
    }
    if (["new", "resume", "regenerate"].includes(command)) {
      const settings = validateConfig(await loadConfig());
      const llm = new LlmClient(settings, envInfo);
      llm.assertConfigured();
      const result = command === "new"
        ? await runNewWorkflow({ terminal, llm, args, settings })
        : command === "resume"
          ? await runResumeWorkflow({ terminal, llm, folder: argv[1] || ".", settings })
          : await runRegeneratePromptWorkflow({ terminal, llm, folder: argv[1] || ".", settings });
      console.log(`\nสถานะ: ${result.status}`);
      console.log(`เอกสารอยู่ที่: ${result.outputFolder}`);
      if (result.promptFile) console.log(`Prompt: ${result.promptFile}`);
      return;
    }
    throw new Error(`ไม่รู้จักคำสั่ง ${command}\n\n${HELP}`);
  } finally {
    terminal.close();
  }
}
