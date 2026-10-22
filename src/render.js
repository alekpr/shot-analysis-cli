import { secondsToTime } from "./utils.js";

function list(items = []) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- ไม่มีข้อมูล";
}

export function renderAnalysis(value) {
  const visualDirection = value.selectedVisualDirection;
  const shotCount = value.shotCountRecommendation || {};
  return `# การวิเคราะห์ความต้องการ\n\n## ภาพรวม\n\n- ชื่อ: ${value.title}\n- แพลตฟอร์ม: ${value.targetPlatform}\n- ความยาว: ${value.durationSeconds} วินาที\n- อัตราส่วน: ${value.aspectRatio}\n- อารมณ์เป้าหมาย: ${value.desiredEmotion}\n- ความพร้อม: ${value.readiness?.score ?? "-"}/100\n\n## จำนวน Shots\n\n- LLM แนะนำ: ${shotCount.recommended ?? "-"} shots\n- ช่วงที่เหมาะสม: ${shotCount.minimum ?? "-"}-${shotCount.maximum ?? "-"} shots\n- จำนวนที่ผู้ใช้เลือก: ${value.selectedShotCount ?? "ยังไม่ได้เลือก"} shots\n- เหตุผล: ${shotCount.rationale || "ไม่มีข้อมูล"}\n\n## รูปแบบภาพและ Mood\n\n- รูปแบบ: ${visualDirection?.label || "ยังไม่ได้ระบุ"}\n- Mood/โทน: ${visualDirection?.mood || "ไม่ได้ระบุเพิ่มเติม"}\n- ที่มา: ${visualDirection?.source === "brief" ? "ระบุใน brief" : "ผู้ใช้เลือกจาก CLI"}\n\n## Core ที่ LLM แนะนำ\n\n${list(value.coreChoices?.map((item) => `${item.name}: ${item.reason}`))}\n\n## Core ที่ผู้ใช้เลือก\n\n${list(value.selectedCores?.map((item) => `${item.role === "primary" ? "Primary" : "Secondary"} — ${item.name}: ${item.reason}`))}\n\n## ตัวละคร\n\n${list(value.characters?.map((item) => `${item.name} (${item.role}): ${item.description}`))}\n\n## สถานที่และภาพ\n\n${value.setting || "ไม่มีข้อมูล"}\n\n## ข้อจำกัดและสมมติฐาน\n\n${list(value.constraints)}\n\n## ข้อมูลที่ยังขาด\n\n${list(value.missingInformation)}\n\n## เหตุผลประเมินความพร้อม\n\n${value.readiness?.rationale || "ไม่มีข้อมูล"}\n`;
}

export function renderStory(value) {
  return `# โครงเรื่อง: ${value.title}\n\n## Logline\n\n${value.logline}\n\n## สิ่งที่ผู้ชมจะได้รับ\n\n${value.audiencePromise}\n\n## แกนเรื่องและหน้าที่\n\n${list(value.cores?.map((item) => `${item.name}: ${item.function}`))}\n\n## เส้นทางอารมณ์\n\n${list(value.emotionalArc?.map((item) => `${item.phase} — ${item.emotion}: ${item.storyFunction}`))}\n\n## ตัวละคร\n\n${value.characters?.map((item) => `### ${item.id}: ${item.name}\n\n${item.description}\n\nกฎความต่อเนื่อง:\n${list(item.continuityRules)}`).join("\n\n") || "ไม่มีข้อมูล"}\n\n## สถานที่\n\n${value.setting?.description || "ไม่มีข้อมูล"}\n\n${list(value.setting?.continuityRules)}\n\n## โครงสร้างเรื่อง\n\n### Hook\n\n${value.hook}\n\n### Build-up\n\n${list(value.buildUp)}\n\n### Climax\n\n${value.climax}\n\n### Ending (${value.endingType})\n\n${value.ending}\n\n## ภาพและเสียง\n\n- Visual style: ${value.visualStyle}\n- Visual direction: ${value.visualDirection?.label || "ไม่ได้ระบุ"}\n- Mood/โทน: ${value.visualDirection?.mood || "ไม่ได้ระบุเพิ่มเติม"}\n- การนำไปใช้: ${value.visualDirection?.application || "ไม่มีข้อมูล"}\n- Sound direction: ${value.soundDirection}\n- Dialogue language: ${value.dialogueLanguage}\n\n## ความเสี่ยงที่ต้องตรวจ\n\n${list(value.risks)}\n\n## เหตุผลของโครงสร้าง\n\n${value.rationale}\n`;
}

export function renderReferencePrompts(value) {
  const assets = value.assets?.map((asset) => `## ${asset.pictureId} — ${asset.name}\n\n- ประเภท: ${asset.assetType}\n- ใช้กับ: ${(asset.linkedSubjects || []).join(", ") || "ไม่มี Subject โดยตรง"}\n- ใช้ใน shots: ${(asset.usedInShots || []).join(", ")}\n- จุดประสงค์: ${asset.purpose}\n\n### Prompt\n\n${asset.prompt}\n\n### Negative prompt\n\n${asset.negativePrompt}\n\n### กฎความต่อเนื่อง\n\n${list(asset.consistencyNotes)}\n`).join("\n") || "ไม่มี reference assets";
  const existing = value.existingReferences?.length
    ? value.existingReferences.map((item) => `- ${item.pictureId}: ${item.description}`).join("\n")
    : "- ไม่มีภาพอ้างอิงเดิม";
  return `# Reference image prompts: ${value.projectTitle}\n\n## Global style lock\n\n- Visual direction: ${value.globalStyle?.visualDirection}\n- Mood: ${value.globalStyle?.mood || "ไม่ได้ระบุเพิ่มเติม"}\n- Style lock: ${value.globalStyle?.styleLock}\n\n## Existing references\n\n${existing}\n\n${assets}\n## วิธีใช้งาน\n\n${list(value.usageGuide)}\n`;
}

export function renderStoryboardPrompt(value) {
  const panels = (value.panels || []).map((panel) => `### Shot ${panel.shotNumber} — ${panel.timeRange}

- Keyframe: ${panel.keyframeMoment}
- Subjects: ${(panel.subjects || []).join(", ") || "ไม่มี"}
- References: ${(panel.referencePictures || []).join(", ") || "ไม่มี"}
- Camera: ${panel.camera}
- Composition: ${panel.composition}
- Continuity: ${(panel.continuityNotes || []).join("; ") || "ไม่มีข้อมูล"}
- Negative constraints: ${(panel.negativeConstraints || []).join("; ") || "ไม่มีข้อมูล"}

\`\`\`text
${panel.prompt}
\`\`\``).join("\n\n");
  return `# Storyboard key image prompt: ${value.projectTitle}

- Shots: ${value.shotCount}
- Grid: ${value.grid?.columns} columns × ${value.grid?.rows} rows
- Reading order: ${value.grid?.readingOrder}
- Panel aspect ratio: ${value.grid?.panelAspectRatio}
- Visual direction: ${value.globalStyle?.visualDirection}
- Mood: ${value.globalStyle?.mood}

## Master prompt

\`\`\`text
${value.masterPrompt}
\`\`\`

## Negative prompt

\`\`\`text
${value.negativePrompt}
\`\`\`

## Panel map

${panels}

## Reference mapping

${(value.referenceMapping || []).map((item) => `- <${item.pictureId}> — ${item.usage}`).join("\n") || "- ไม่มี"}

## Usage guide

${list(value.usageGuide)}
`;
}

export function renderShots(value) {
  const shots = value.shots?.map((shot) => {
    const dialogue = shot.dialogue?.length
      ? shot.dialogue.map((line) => `- ${line.speaker} [${line.language}]: “${line.line}” (${line.performance})`).join("\n")
      : "- ไม่มีบทพูด";
    const actionBeats = shot.actionBeats?.length
      ? shot.actionBeats.map((beat) => `${beat.order}. [${beat.startOffset ?? "?"}s-${beat.endOffset ?? "?"}s] ${beat.action} → ${beat.result}`).join("\n")
      : `1. ${shot.action || "ไม่มีข้อมูล"}`;
    const camera = typeof shot.camera === "object"
      ? `- Lens: ${shot.camera.lensMm}\n- Shot size: ${shot.camera.shotSize}\n- Angle: ${shot.camera.angle}\n- Position: ${shot.camera.position}\n- Movement: ${shot.camera.movement}\n- Focus: ${shot.camera.focus}`
      : `- ${shot.camera || "ไม่มีข้อมูล"}`;
    const sound = typeof shot.sound === "object"
      ? `- Ambience: ${shot.sound.ambience}\n- Sync effects: ${(shot.sound.syncEffects || []).join(", ") || "ไม่มี"}\n- Voice: ${shot.sound.voice}\n- Music: ${shot.sound.music}\n- Sound bridge: ${shot.sound.bridge}`
      : `- ${shot.sound || "ไม่มีข้อมูล"}`;
    const transition = typeof shot.transition === "object"
      ? `${shot.transition.type} — ${shot.transition.motivation}`
      : shot.transition;
    const emotion = typeof shot.emotion === "object"
      ? `${shot.emotion.start} → ${shot.emotion.end}; สิ่งที่เห็น/ได้ยิน: ${shot.emotion.visibleCue}`
      : shot.emotion;
    const continuityIn = shot.continuityIn || shot.continuity || [];
    const continuityOut = shot.continuityOut || shot.continuity || [];
    return `## Shot ${shot.number}: ${shot.beat || shot.objective} — ${secondsToTime(shot.startTime)} ถึง ${secondsToTime(shot.endTime)} (${shot.duration}s)\n\n- Story phase: ${shot.storyPhase || "ไม่ระบุ"}\n- หน้าที่: ${shot.objective}\n- Subjects ในภาพ: ${(shot.subjects || []).join(", ") || "ไม่มี"}\n- Subjects นอกภาพ: ${(shot.offscreenSubjects || []).join(", ") || "ไม่มี"}\n\n### Cinematic engagement\n\n- Cinematic intent: ${shot.cinematicIntent || "ไม่มีข้อมูล"}\n- Attention path: ${shot.attentionFocus || "ไม่มีข้อมูล"}\n- Visual payoff: ${shot.visualPayoff || "ไม่มีข้อมูล"}\n\n### Geography และ state\n\n**Setting:** ${shot.setting}\n\n**Spatial anchor:** ${shot.spatialAnchor || "ไม่มีข้อมูล"}\n\n**Start state (visible first frame):** ${shot.startState || "ไม่มีข้อมูล"}\n\n**End state (visible final frame):** ${shot.endState || "ไม่มีข้อมูล"}\n\n**Continuity bridge:** ${shot.continuityBridge || "เริ่มเรื่อง"}\n\n**Causal link:** ${shot.causalLink || "ไม่มีข้อมูล"}\n\n### Action beats\n\n${actionBeats}\n\n### Camera และภาพ\n\n${camera}\n\n- Composition: ${shot.composition}\n- Lighting: ${shot.lighting}\n\n### บทพูด\n\n${dialogue}\n\n### เสียง\n\n${sound}\n\n### การส่งต่อและ continuity\n\n- Transition: ${transition || "ไม่มีข้อมูล"}\n- Emotion: ${emotion || "ไม่มีข้อมูล"}\n\n**Continuity in:**\n${list(continuityIn)}\n\n**Continuity out:**\n${list(continuityOut)}\n\n**ข้อห้ามเฉพาะ shot:**\n${list(shot.negativeConstraints)}\n`;
  }).join("\n") || "ไม่มี shot";

  return `# Shot list: ${value.projectTitle}\n\n- ระยะเวลารวม: ${value.totalDuration} วินาที\n- จำนวน shots: ${value.shots?.length || 0}\n\n${shots}\n## Final continuity checklist\n\n${list(value.continuityChecklist)}\n`;
}
