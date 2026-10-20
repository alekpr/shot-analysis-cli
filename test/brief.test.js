import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, writeFile } from "node:fs/promises";
import { loadBriefFile, resolveBriefPath } from "../src/brief.js";

test("loads a UTF-8 brief file and removes BOM", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-brief-test-"));
  const file = path.join(root, "my brief.md");
  await writeFile(file, "\uFEFF# เรื่องสั้น\n\nเด็กช่วยสุนัข", "utf8");
  const result = await loadBriefFile(file);
  assert.equal(result.file, file);
  assert.equal(result.content, "# เรื่องสั้น\n\nเด็กช่วยสุนัข");
});

test("accepts a macOS drag-and-drop path with escaped spaces", () => {
  const resolved = resolveBriefPath("/tmp/My\\ Brief.md");
  assert.equal(resolved, "/tmp/My Brief.md");
});

test("rejects an empty brief file", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-empty-brief-test-"));
  const file = path.join(root, "empty.txt");
  await writeFile(file, "  \n", "utf8");
  await assert.rejects(loadBriefFile(file), /ไม่มีเนื้อหา/);
});
