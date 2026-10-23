export const GENERATION_TARGETS = {
  "minimax-h3": {
    id: "minimax-h3",
    label: "MiniMax H3",
    description: "ใช้โครงสร้าง DY, Subject/Picture definitions และรายละเอียดราย Shot"
  },
  "seedance-2.5": {
    id: "seedance-2.5",
    label: "Seedance 2.5",
    description: "ใช้ Reference mapping, Timecoded beats และ Global constraints"
  }
};

export function normalizeGenerationTarget(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["s", "seedance", "seedance-2.5", "seedance 2.5"].includes(normalized)) return "seedance-2.5";
  if (["m", "minimax", "minimax-h3", "minimax h3", "a"].includes(normalized)) return "minimax-h3";
  return null;
}

export async function selectGenerationTarget(terminal, currentTarget, { force = false } = {}) {
  const existing = normalizeGenerationTarget(currentTarget);
  if (existing && !force) return existing;
  const selected = await terminal.choose("เลือกโมเดลปลายทางสำหรับ generation prompt", [
    { key: "m", label: "MiniMax H3", description: GENERATION_TARGETS["minimax-h3"].description },
    { key: "s", label: "Seedance 2.5", description: GENERATION_TARGETS["seedance-2.5"].description }
  ], existing === "seedance-2.5" ? "s" : "m");
  return normalizeGenerationTarget(selected) || "minimax-h3";
}

export function generationTargetLabel(target) {
  const normalized = normalizeGenerationTarget(target) || "minimax-h3";
  return GENERATION_TARGETS[normalized].label;
}
