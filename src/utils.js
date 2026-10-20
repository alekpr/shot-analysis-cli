import path from "node:path";

export function slugify(value) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\u0E00-\u0E7F]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || `clip-${new Date().toISOString().slice(0, 10)}`;
}

export function parseArgs(argv) {
  const command = argv[0] && !argv[0].startsWith("-") ? argv[0] : "help";
  const args = {};
  for (let index = command === "help" ? 0 : 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      args[rawKey] = inlineValue;
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      args[rawKey] = argv[index + 1];
      index += 1;
    } else {
      args[rawKey] = true;
    }
  }
  return { command, args };
}

export function resolveOutputPath(value, cwd = process.cwd()) {
  return path.resolve(cwd, value);
}

export function extractJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstObject = cleaned.indexOf("{");
    const lastObject = cleaned.lastIndexOf("}");
    if (firstObject >= 0 && lastObject > firstObject) {
      return JSON.parse(cleaned.slice(firstObject, lastObject + 1));
    }
    throw new Error("LLM ไม่ได้ตอบกลับเป็น JSON ที่อ่านได้");
  }
}

export function secondsToTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remainder = (safe % 60).toFixed(3).padStart(6, "0");
  return `${String(minutes).padStart(2, "0")}:${remainder}`;
}
