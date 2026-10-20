import test from "node:test";
import assert from "node:assert/strict";
import { resolveVisualDirection } from "../src/visual-direction.js";

test("uses an explicit visual direction from the brief without asking again", async () => {
  let questions = 0;
  const terminal = {
    choose: async () => { questions += 1; return "anime"; },
    ask: async () => { questions += 1; return ""; }
  };
  const result = await resolveVisualDirection(terminal, {
    visualDirection: { medium: "anime", label: "Anime", mood: "dreamy", source: "explicit", evidence: "ผู้ใช้ระบุ anime" }
  });
  assert.equal(questions, 0);
  assert.deepEqual(result, { id: "anime", label: "Anime", mood: "dreamy", source: "brief", evidence: "ผู้ใช้ระบุ anime" });
});

test("asks for a visual direction and mood when the brief does not specify them", async () => {
  const terminal = {
    choose: async () => "anime",
    ask: async () => "warm and hopeful"
  };
  const result = await resolveVisualDirection(terminal, {
    visualDirection: { medium: null, label: null, mood: null, source: "missing", evidence: "ไม่พบใน brief" }
  });
  assert.equal(result.id, "anime");
  assert.equal(result.label, "Anime");
  assert.equal(result.mood, "warm and hopeful");
  assert.equal(result.source, "user-selection");
});
