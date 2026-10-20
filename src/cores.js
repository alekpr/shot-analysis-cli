export const CORE_CATALOG = [
  { id: "hero", name: "ฮีโร่ในยามจำเป็น", description: "ตัวเอกเลือกลงมือช่วยเมื่อคนอื่นกำลังต้องการ", keywords: ["ฮีโร่", "ช่วยเหลือ", "ยามจำเป็น"] },
  { id: "continuous-trouble", name: "ปัญหาหรือความซวยต่อเนื่อง", description: "ปัญหาใหม่เข้ามาต่อเนื่องและเพิ่มแรงกดดัน", keywords: ["ซวย", "ต่อเนื่อง", "ปัญหาใหม่", "ปัญหาต่อเนื่อง"] },
  { id: "larger-than-self", name: "เผชิญเรื่องใหญ่เกินตัว", description: "ตัวละครต้องรับมือกับสถานการณ์ที่ใหญ่กว่าความสามารถเดิม", keywords: ["ใหญ่เกินตัว", "เกินตัว", "เรื่องใหญ่"] },
  { id: "disadvantaged", name: "ผู้เสียเปรียบหรือมีข้อจำกัด", description: "ข้อจำกัดของตัวละครทำให้ผู้ชมเอาใจช่วยโดยไม่ใช้ภาพเหมารวม", keywords: ["เสียเปรียบ", "ข้อจำกัด", "พิการ", "ด้อยโอกาส"] },
  { id: "resist-oppression", name: "ไม่ยอมจำนนต่อการกดขี่", description: "ตัวละครลุกขึ้นต่อต้านอำนาจหรือการข่มเหง", keywords: ["กดขี่", "ไม่ยอมจำนน", "ข่มเหง", "บูลลี่"] },
  { id: "social-justice", name: "จัดการความไม่ยุติธรรม", description: "เรื่องขับเคลื่อนด้วยการแก้ความอยุติธรรมหรือการเอาเปรียบ", keywords: ["ไม่ยุติธรรม", "ความยุติธรรม", "อยุติธรรม", "เอาเปรียบ", "จัดระเบียบ"] },
  { id: "pure-love", name: "รักบริสุทธิ์และการเสียสละ", description: "ความรักนำไปสู่การให้ การจากลา หรือการเสียสละ", keywords: ["รัก", "เสียสละ", "บริสุทธิ์"] },
  { id: "custom", name: "กำหนด Core เอง", description: "พิมพ์แกนเรื่องที่เหมาะกับคลิปนี้ด้วยตัวเอง", keywords: [] }
];

function normalize(value) {
  return String(value || "").trim().toLocaleLowerCase("th-TH");
}

function recommendationFor(core, suggestions) {
  const exact = suggestions.find((item) => normalize(item.name) === normalize(core.name));
  if (exact) return exact;
  return suggestions.find((item) => {
    const text = normalize(`${item.name || ""} ${item.reason || ""}`);
    return core.keywords.some((keyword) => text.includes(normalize(keyword)));
  });
}

export function rankCores(coreChoices = []) {
  const standard = CORE_CATALOG.filter((core) => core.id !== "custom").map((core, originalIndex) => {
    const recommendation = recommendationFor(core, coreChoices);
    return {
      ...core,
      recommended: Boolean(recommendation),
      recommendedReason: recommendation?.reason || "",
      suggestionIndex: recommendation ? coreChoices.indexOf(recommendation) : Number.POSITIVE_INFINITY,
      originalIndex
    };
  });

  standard.sort((left, right) => left.suggestionIndex - right.suggestionIndex || left.originalIndex - right.originalIndex);
  return [...standard, { ...CORE_CATALOG.find((core) => core.id === "custom"), recommended: false, recommendedReason: "" }];
}

export function buildSelectedCores(selectedIds, primaryId, customName, rankedCores) {
  return selectedIds.map((id) => {
    const core = rankedCores.find((item) => item.id === id);
    const name = id === "custom" ? customName.trim() : core?.name;
    if (!name) throw new Error(`ไม่พบ Core: ${id}`);
    return {
      id,
      name,
      role: id === primaryId ? "primary" : "secondary",
      reason: core?.recommendedReason || "ผู้ใช้เลือก"
    };
  });
}

export async function selectStoryCores(terminal, analysis) {
  const ranked = rankCores(analysis.coreChoices);
  const firstRecommended = ranked.find((core) => core.recommended)?.id;
  const selectedIds = await terminal.multiSelect(
    "เลือก Core หลักของคลิป (Space เลือก/ยกเลิก, Enter ยืนยัน)",
    ranked.map((core) => ({
      key: core.id,
      label: `${core.recommended ? "★ แนะนำ — " : ""}${core.name}`,
      description: core.recommendedReason || core.description,
      checked: core.id === firstRecommended
    })),
    { min: 1, max: 3 }
  );

  const customName = selectedIds.includes("custom") ? await terminal.ask("ระบุชื่อ Core ที่ต้องการใช้") : "";
  if (selectedIds.includes("custom") && !customName.trim()) throw new Error("Core ที่กำหนดเองต้องมีชื่อ");

  const primaryId = selectedIds.length === 1
    ? selectedIds[0]
    : await terminal.choose(
      "เลือก Primary Core ที่จะขับเคลื่อนเรื่อง",
      selectedIds.map((id) => {
        const core = ranked.find((item) => item.id === id);
        return { key: id, label: id === "custom" ? customName : core.name, description: core.recommendedReason || core.description };
      }),
      selectedIds[0]
    );

  return buildSelectedCores(selectedIds, primaryId, customName, ranked);
}
