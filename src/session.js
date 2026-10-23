import path from "node:path";
import { copyFile, mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";

export const SESSION_VERSION = 4;
const STALE_LOCK_MS = 6 * 60 * 60 * 1000;

export function sessionPaths(folder) {
  const directory = path.join(folder, ".shot-analysis");
  return {
    directory,
    file: path.join(directory, "session.json"),
    backup: path.join(directory, "session.json.bak"),
    lock: path.join(directory, "run.lock")
  };
}

function portableArtifactPath(value, folder) {
  if (!value || typeof value !== "string") return value;
  if (!path.isAbsolute(value)) return value;
  const relative = path.relative(folder, value);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative
    : path.basename(value);
}

function absoluteArtifactPath(value, folder) {
  if (!value || typeof value !== "string") return value;
  if (!path.isAbsolute(value)) return path.resolve(folder, value);
  const relative = path.relative(folder, value);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) return value;
  return path.join(folder, path.basename(value));
}

export function serializeSession(state, folder) {
  const stored = structuredClone(state);
  stored.version = SESSION_VERSION;
  stored.outputFolder = ".";
  stored.finalPromptFile = portableArtifactPath(stored.finalPromptFile, folder);
  if (stored.finalPromptFiles) {
    stored.finalPromptFiles = Object.fromEntries(
      Object.entries(stored.finalPromptFiles).map(([key, value]) => [key, portableArtifactPath(value, folder)])
    );
  }
  return stored;
}

export function migrateSession(value, folder) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("session ต้องเป็น JSON object");
  const state = structuredClone(value);
  const version = Number(state.version || 1);
  if (!Number.isInteger(version) || version < 1) throw new Error(`session version ไม่ถูกต้อง: ${state.version}`);
  if (version > SESSION_VERSION) throw new Error(`session version ${version} ใหม่กว่า CLI รองรับ (${SESSION_VERSION})`);
  if (!String(state.status || "").trim()) throw new Error("session ไม่มี status");

  state.version = SESSION_VERSION;
  state.outputFolder = folder;
  state.finalPromptFile = absoluteArtifactPath(state.finalPromptFile, folder);
  if (state.finalPromptFiles) {
    state.finalPromptFiles = Object.fromEntries(
      Object.entries(state.finalPromptFiles).map(([key, item]) => [key, absoluteArtifactPath(item, folder)])
    );
  } else if (state.finalPromptFile && state.generationTarget) {
    state.finalPromptFiles = { [state.generationTarget]: state.finalPromptFile };
  }
  return state;
}

async function writeAtomic(target, content, { backup } = {}) {
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  const handle = await open(temporary, "w", 0o600);
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    if (backup) await copyFile(target, backup);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function saveSession(folder, state) {
  const paths = sessionPaths(folder);
  await mkdir(paths.directory, { recursive: true });
  const stored = serializeSession(state, folder);
  await writeAtomic(paths.file, `${JSON.stringify(stored, null, 2)}\n`, { backup: paths.backup });
}

export async function loadSession(folder) {
  const paths = sessionPaths(folder);
  try {
    return { state: migrateSession(JSON.parse(await readFile(paths.file, "utf8")), folder), recovered: false };
  } catch (primaryError) {
    try {
      const backup = migrateSession(JSON.parse(await readFile(paths.backup, "utf8")), folder);
      await writeAtomic(paths.file, `${JSON.stringify(serializeSession(backup, folder), null, 2)}\n`);
      return { state: backup, recovered: true, primaryError };
    } catch (backupError) {
      throw new Error(`อ่าน session ไม่สำเร็จ: ${primaryError.message}; backup ใช้ไม่ได้: ${backupError.message}`);
    }
  }
}

async function lockIsStale(lockFile) {
  try {
    const info = await stat(lockFile);
    return Date.now() - info.mtimeMs > STALE_LOCK_MS;
  } catch (error) {
    if (error.code === "ENOENT") return true;
    throw error;
  }
}

export async function acquireSessionLock(folder) {
  const paths = sessionPaths(folder);
  await mkdir(paths.directory, { recursive: true });
  let handle;
  try {
    handle = await open(paths.lock, "wx", 0o600);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (await lockIsStale(paths.lock)) {
      await rm(paths.lock, { force: true });
      handle = await open(paths.lock, "wx", 0o600);
    } else {
      const detail = await readFile(paths.lock, "utf8").catch(() => "");
      throw new Error(`โปรเจกต์นี้กำลังถูกใช้งานโดย process อื่น (${detail.trim() || "ไม่ทราบ process"})`);
    }
  }
  await handle.writeFile(`${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`, "utf8");
  await handle.sync();
  await handle.close();
  let released = false;
  return async () => {
    if (released) return;
    released = true;
    await rm(paths.lock, { force: true });
  };
}
