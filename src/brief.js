import os from "node:os";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";

export function resolveBriefPath(value, cwd = process.cwd()) {
  let cleaned = String(value || "").trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  cleaned = cleaned.replace(/\\([ '\\()&])/g, "$1");
  if (cleaned === "~") cleaned = os.homedir();
  if (cleaned.startsWith("~/")) cleaned = path.join(os.homedir(), cleaned.slice(2));
  return path.resolve(cwd, cleaned);
}

export async function loadBriefFile(value, cwd = process.cwd()) {
  if (!String(value || "").trim()) throw new Error("กรุณาระบุ path ของไฟล์ brief");
  const file = resolveBriefPath(value, cwd);
  let fileStat;
  try {
    fileStat = await stat(file);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`ไม่พบไฟล์ brief: ${file}`);
    throw new Error(`เปิดไฟล์ brief ไม่สำเร็จ: ${error.message}`);
  }
  if (!fileStat.isFile()) throw new Error(`path ของ brief ไม่ใช่ไฟล์: ${file}`);
  if (fileStat.size > 5 * 1024 * 1024) throw new Error("ไฟล์ brief ต้องมีขนาดไม่เกิน 5 MB");

  const content = (await readFile(file, "utf8")).replace(/^\uFEFF/, "").trim();
  if (!content) throw new Error(`ไฟล์ brief ไม่มีเนื้อหา: ${file}`);
  if (content.includes("\u0000")) throw new Error("ไฟล์ brief ต้องเป็นไฟล์ข้อความ UTF-8 เช่น .txt, .md, .json หรือ .yaml");
  return { content, file };
}
