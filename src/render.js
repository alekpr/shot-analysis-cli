import { secondsToTime } from "./utils.js";

function list(items = []) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- ไม่มีข้อมูล";
}

export function renderAnalysis(value) {
  const visualDirection = value.selectedVisualDirection;
  return `# การวิเคราะห์ความต้องการ\n\n## ภาพรวม\n\n- ชื่อ: ${value.title}\n- แพลตฟอร์ม: ${value.targetPlatform}\n- ความยาว: ${value.durationSeconds} วินาที\n- อัตราส่วน: ${value.aspectRatio}\n- อารมณ์เป้าหมาย: ${value.desiredEmotion}\n- ความพร้อม: ${value.readiness?.score ?? "-"}/100\n\n## รูปแบบภาพและ Mood\n\n- รูปแบบ: ${visualDirection?.label || "ยังไม่ได้ระบุ"}\n- Mood/โทน: ${visualDirection?.mood || "ไม่ได้ระบุเพิ่มเติม"}\n- ที่มา: ${visualDirection?.source === "brief" ? "ระบุใน brief" : "ผู้ใช้เลือกจาก CLI"}\n\n## Core ที่ LLM แนะนำ\n\n${list(value.coreChoices?.map((item) => `${item.name}: ${item.reason}`))}\n\n## Core ที่ผู้ใช้เลือก\n\n${list(value.selectedCores?.map((item) => `${item.role === "primary" ? "Primary" : "Secondary"} — ${item.name}: ${item.reason}`))}\n\n## ตัวละคร\n\n${list(value.characters?.map((item) => `${item.name} (${item.role}): ${item.description}`))}\n\n## สถานที่และภาพ\n\n${value.setting || "ไม่มีข้อมูล"}\n\n## ข้อจำกัดและสมมติฐาน\n\n${list(value.constraints)}\n\n## ข้อมูลที่ยังขาด\n\n${list(value.missingInformation)}\n\n## เหตุผลประเมินความพร้อม\n\n${value.readiness?.rationale || "ไม่มีข้อมูล"}\n`;
}

export function renderStory(value) {
  return `# โครงเรื่อง: ${value.title}\n\n## Logline\n\n${value.logline}\n\n## สิ่งที่ผู้ชมจะได้รับ\n\n${value.audiencePromise}\n\n## แกนเรื่องและหน้าที่\n\n${list(value.cores?.map((item) => `${item.name}: ${item.function}`))}\n\n## เส้นทางอารมณ์\n\n${list(value.emotionalArc?.map((item) => `${item.phase} — ${item.emotion}: ${item.storyFunction}`))}\n\n## ตัวละคร\n\n${value.characters?.map((item) => `### ${item.id}: ${item.name}\n\n${item.description}\n\nกฎความต่อเนื่อง:\n${list(item.continuityRules)}`).join("\n\n") || "ไม่มีข้อมูล"}\n\n## สถานที่\n\n${value.setting?.description || "ไม่มีข้อมูล"}\n\n${list(value.setting?.continuityRules)}\n\n## โครงสร้างเรื่อง\n\n### Hook\n\n${value.hook}\n\n### Build-up\n\n${list(value.buildUp)}\n\n### Climax\n\n${value.climax}\n\n### Ending (${value.endingType})\n\n${value.ending}\n\n## ภาพและเสียง\n\n- Visual style: ${value.visualStyle}\n- Visual direction: ${value.visualDirection?.label || "ไม่ได้ระบุ"}\n- Mood/โทน: ${value.visualDirection?.mood || "ไม่ได้ระบุเพิ่มเติม"}\n- การนำไปใช้: ${value.visualDirection?.application || "ไม่มีข้อมูล"}\n- Sound direction: ${value.soundDirection}\n- Dialogue language: ${value.dialogueLanguage}\n\n## ความเสี่ยงที่ต้องตรวจ\n\n${list(value.risks)}\n\n## เหตุผลของโครงสร้าง\n\n${value.rationale}\n`;
}

export function renderShots(value) {
  const shots = value.shots?.map((shot) => {
    const dialogue = shot.dialogue?.length
      ? shot.dialogue.map((line) => `- ${line.speaker} [${line.language}]: “${line.line}” (${line.performance})`).join("\n")
      : "- ไม่มีบทพูด";
    return `## Shot ${shot.number} — ${secondsToTime(shot.startTime)} ถึง ${secondsToTime(shot.endTime)} (${shot.duration}s)\n\n**หน้าที่:** ${shot.objective}\n\n**Subjects:** ${(shot.subjects || []).join(", ")}\n\n**ฉากและการกระทำ:** ${shot.setting} ${shot.action}\n\n**กล้อง:** ${shot.camera}\n\n**Composition:** ${shot.composition}\n\n**Lighting:** ${shot.lighting}\n\n**บทพูด:**\n${dialogue}\n\n**เสียง:** ${shot.sound}\n\n**Transition:** ${shot.transition}\n\n**อารมณ์:** ${shot.emotion}\n\n**Continuity:**\n${list(shot.continuity)}\n`;
  }).join("\n") || "ไม่มี shot";

  return `# Shot list: ${value.projectTitle}\n\n- ระยะเวลารวม: ${value.totalDuration} วินาที\n- จำนวน shots: ${value.shots?.length || 0}\n\n${shots}\n## Final continuity checklist\n\n${list(value.continuityChecklist)}\n`;
}
