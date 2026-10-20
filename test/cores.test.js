import test from "node:test";
import assert from "node:assert/strict";
import { buildSelectedCores, rankCores } from "../src/cores.js";

test("recommended cores are moved to the top with their reasons", () => {
  const ranked = rankCores([
    { name: "รักและการเสียสละ", reason: "ทำให้การจากลามีน้ำหนัก" },
    { name: "เรื่องใหญ่เกินตัว", reason: "เพิ่มแรงกดดัน" }
  ]);
  assert.equal(ranked[0].id, "pure-love");
  assert.equal(ranked[0].recommendedReason, "ทำให้การจากลามีน้ำหนัก");
  assert.equal(ranked[1].id, "larger-than-self");
  assert.equal(ranked.at(-1).id, "custom");
});

test("selected cores contain one primary and supporting secondary cores", () => {
  const ranked = rankCores([{ name: "รักและการเสียสละ", reason: "emotional closure" }]);
  const selected = buildSelectedCores(["pure-love", "custom"], "custom", "การเติบโตจากความสูญเสีย", ranked);
  assert.deepEqual(selected.map(({ name, role }) => ({ name, role })), [
    { name: "รักบริสุทธิ์และการเสียสละ", role: "secondary" },
    { name: "การเติบโตจากความสูญเสีย", role: "primary" }
  ]);
});
