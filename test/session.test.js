import assert from "node:assert/strict";
import test from "node:test";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { acquireSessionLock, loadSession, saveSession, serializeSession, SESSION_VERSION, sessionPaths } from "../src/session.js";

async function temporaryProject() {
  return mkdtemp(path.join(os.tmpdir(), "shot-analysis-session-test-"));
}

test("session files store portable artifact paths and restore them for the current folder", async () => {
  const folder = await temporaryProject();
  const state = {
    version: 2,
    status: "complete",
    outputFolder: "/old/computer/project",
    generationTarget: "minimax-h3",
    finalPromptFile: "/old/computer/project/minimax-h3-05-generation-prompt.txt",
    finalPromptFiles: { "minimax-h3": "/old/computer/project/minimax-h3-05-generation-prompt.txt" }
  };
  await saveSession(folder, state);
  const stored = JSON.parse(await readFile(sessionPaths(folder).file, "utf8"));
  assert.equal(stored.outputFolder, ".");
  assert.equal(stored.finalPromptFile, "minimax-h3-05-generation-prompt.txt");
  const loaded = await loadSession(folder);
  assert.equal(loaded.state.version, SESSION_VERSION);
  assert.equal(loaded.state.finalPromptFile, path.join(folder, "minimax-h3-05-generation-prompt.txt"));
});

test("loadSession restores a corrupt primary file from its backup", async () => {
  const folder = await temporaryProject();
  await saveSession(folder, { version: 2, status: "story-review", input: { brief: "a" } });
  await saveSession(folder, { version: 2, status: "shots-review", input: { brief: "a" } });
  await writeFile(sessionPaths(folder).file, "{broken", "utf8");
  const loaded = await loadSession(folder);
  assert.equal(loaded.recovered, true);
  assert.equal(loaded.state.status, "story-review");
  const restoredText = await readFile(sessionPaths(folder).file, "utf8");
  assert.doesNotThrow(() => JSON.parse(restoredText));
});

test("a session lock prevents concurrent workflows and can be released", async () => {
  const folder = await temporaryProject();
  const release = await acquireSessionLock(folder);
  await assert.rejects(acquireSessionLock(folder), /กำลังถูกใช้งาน/);
  await release();
  const releaseAgain = await acquireSessionLock(folder);
  await releaseAgain();
});

test("serializeSession does not mutate in-memory state", () => {
  const folder = "/tmp/project";
  const state = { version: 2, status: "complete", outputFolder: folder, finalPromptFile: path.join(folder, "prompt.txt") };
  const stored = serializeSession(state, folder);
  assert.equal(stored.finalPromptFile, "prompt.txt");
  assert.equal(state.finalPromptFile, path.join(folder, "prompt.txt"));
});
