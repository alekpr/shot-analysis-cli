export const VISUAL_DIRECTION_CHOICES = [
  { id: "live-action-cinematic", label: "ภาพยนตร์สมจริง (Live-action cinematic)", description: "ภาพคนและสถานที่จริง ใช้แสง องค์ประกอบ และภาษากล้องแบบภาพยนตร์" },
  { id: "anime", label: "Anime", description: "ภาพวาดอนิเมะ เน้นสี สีหน้า และการเคลื่อนไหวแบบงาน animation ญี่ปุ่น" },
  { id: "3d-animation", label: "3D Animation", description: "ตัวละครและฉากสามมิติ พร้อมแสงและวัสดุแบบงาน animation" },
  { id: "2d-illustration", label: "2D Illustration / Motion graphic", description: "ภาพวาดสองมิติ กราฟิก หรือการเคลื่อนไหวเชิงออกแบบ" },
  { id: "documentary", label: "สารคดี (Documentary)", description: "ภาพเป็นธรรมชาติ ให้ความรู้สึกสังเกตเหตุการณ์จริง" },
  { id: "commercial", label: "โฆษณา / Product commercial", description: "ภาพเนี้ยบ ควบคุมแสงและองค์ประกอบเพื่อเน้นสินค้าและแบรนด์" },
  { id: "custom", label: "รูปแบบอื่น กำหนดเอง", description: "ระบุรูปแบบภาพหรือแนวงานที่ต้องการด้วยตัวเอง" }
];

export function hasExplicitVisualDirection(analysis) {
  const direction = analysis?.visualDirection;
  return direction?.source === "explicit" && Boolean(direction?.label || direction?.medium);
}

export async function resolveVisualDirection(terminal, analysis) {
  if (hasExplicitVisualDirection(analysis)) {
    return {
      id: analysis.visualDirection.medium || "brief-defined",
      label: analysis.visualDirection.label || analysis.visualDirection.medium,
      mood: analysis.visualDirection.mood || "",
      source: "brief",
      evidence: analysis.visualDirection.evidence || "ระบุไว้ใน brief"
    };
  }

  const selectedId = await terminal.choose(
    "ต้องการให้คลิปมีรูปแบบภาพแบบใด",
    VISUAL_DIRECTION_CHOICES.map((item) => ({ key: item.id, label: item.label, description: item.description })),
    "live-action-cinematic"
  );
  const selected = VISUAL_DIRECTION_CHOICES.find((item) => item.id === selectedId);
  if (!selected) throw new Error(`ไม่พบรูปแบบภาพ: ${selectedId}`);

  const customLabel = selectedId === "custom" ? await terminal.ask("ระบุรูปแบบภาพที่ต้องการ") : "";
  if (selectedId === "custom" && !customLabel.trim()) throw new Error("รูปแบบภาพที่กำหนดเองต้องมีชื่อ");
  const mood = await terminal.ask("ระบุ mood/โทนภาพเพิ่มเติม เช่น warm, dark, dreamy (เว้นว่างได้)", "");

  return {
    id: selectedId,
    label: selectedId === "custom" ? customLabel.trim() : selected.label,
    mood: mood.trim(),
    source: "user-selection",
    evidence: "ผู้ใช้เลือกจาก CLI"
  };
}
