export const STORY_FRAMEWORK = `
หลักคิดสำหรับวิดีโอสั้น:
1. เริ่มจากอารมณ์ที่ต้องการให้ผู้ชมรู้สึก และเลือกแกนเรื่องที่เหมาะสม: ฮีโร่ในยามจำเป็น, ปัญหาต่อเนื่อง, เรื่องใหญ่เกินตัว, ตัวละครที่มีข้อจำกัด, ไม่ยอมจำนนต่อการกดขี่, จัดการความไม่ยุติธรรม, หรือรักและการเสียสละ
2. ใน 3 วินาทีแรก ผู้ชมต้องเข้าใจว่าใครกำลังเจอปัญหาอะไร และตัวเอกเกี่ยวข้องอย่างไร
3. ช่วงกลางต้องเพิ่มแรงกดดันหรือคำถามใหม่ ไม่ปล่อยให้ปัญหาคลี่คลายเร็วเกินไป
4. ตอนจบต้องให้ผลทางอารมณ์ชัดเจน หรือแก้ปัญหาหลักแล้วเปิดคำถามใหม่อย่างเป็นธรรมต่อผู้ชม
5. ทุก shot ต้องมีหน้าที่: บอกปัญหา, เพิ่มแรงกดดัน, เผยข้อมูล, เปลี่ยนความคาดหวัง, หรือให้ผลตอบแทนทางอารมณ์
6. รักษาความต่อเนื่องของตัวละคร เสื้อผ้า สถานที่ แสง อุปกรณ์ ทิศทางการเคลื่อนที่ และสภาพอารมณ์
7. หลีกเลี่ยงภาพเหมารวมเกี่ยวกับเชื้อชาติ เพศ อายุ หรือความพิการ และอย่าอ้างสูตรอัลกอริทึมที่ตรวจสอบไม่ได้เป็นข้อเท็จจริง
`;

const jsonInstruction = "ตอบเป็น JSON object ที่ถูกต้องเท่านั้น ห้ามครอบด้วย Markdown code fence และห้ามใส่คำอธิบายนอก JSON";

export function analysisPrompt(input) {
  return `${STORY_FRAMEWORK}\n${jsonInstruction}\n\nวิเคราะห์ brief ต่อไปนี้เพื่อเตรียมสร้างวิดีโอสั้น:\n${JSON.stringify(input, null, 2)}\n\nใช้ schema นี้:\n{
  "title": "string",
  "slug": "string",
  "language": "string",
  "targetPlatform": "string",
  "durationSeconds": 15,
  "aspectRatio": "string",
  "visualStyle": "string",
  "visualDirection": {"medium":"live-action-cinematic|anime|3d-animation|2d-illustration|documentary|commercial|custom|null","label":"string|null","mood":"string|null","source":"explicit|missing","evidence":"ข้อความจาก brief หรือเหตุผลที่ระบุว่าไม่พบ"},
  "audience": "string",
  "desiredEmotion": "string",
  "coreChoices": [{"name":"string","reason":"string"}],
  "characters": [{"name":"string","role":"string","description":"string"}],
  "setting": "string",
  "references": [{"label":"Picture 1","description":"string"}],
  "dialogueLanguage": "string",
  "constraints": ["string"],
  "endingPreference": "string",
  "missingInformation": ["string"],
  "clarificationQuestions": [{"id":"snake_case","question":"คำถามภาษาไทยที่ตอบง่าย","why":"string","required":true}],
  "readiness": {"score": 0, "canProceed": false, "rationale": "string"}
}\nvisualDirection.source ต้องเป็น explicit เฉพาะเมื่อ brief หรือคำตอบของผู้ใช้ระบุรูปแบบภาพอย่างชัดเจน เช่น ภาพยนตร์, live action, anime, 3D, illustration, documentary หรือ commercial หากไม่พบให้ตั้ง source เป็น missing และ medium/label เป็น null ห้ามเดา และไม่ต้องสร้าง clarificationQuestions สำหรับ visualDirection เพราะ CLI จะถามจากรายการโดยตรง ถามข้อมูลอื่นเฉพาะที่มีผลต่อโครงเรื่องหรือการสร้าง shot จริง ไม่เกิน 7 ข้อ หากอนุมานได้อย่างปลอดภัยให้ระบุเป็นสมมติฐานใน constraints แทนการถาม`;
}

export function storyPrompt(analysis, answers, revision = "") {
  return `${STORY_FRAMEWORK}\n${jsonInstruction}\n\nสร้างโครงเรื่องที่ถ่าย/สร้างเป็นวิดีโอได้จริงจากข้อมูลต่อไปนี้\nANALYSIS:\n${JSON.stringify(analysis, null, 2)}\nANSWERS:\n${JSON.stringify(answers, null, 2)}\nREVISION REQUEST:\n${revision || "ไม่มี"}\n\nใช้ schema นี้:\n{
  "title":"string",
  "logline":"string",
  "audiencePromise":"string",
  "durationSeconds":15,
  "cores":[{"name":"string","function":"string"}],
  "emotionalArc":[{"phase":"string","emotion":"string","storyFunction":"string"}],
  "characters":[{"id":"Subject 1","name":"string","role":"string","description":"string","continuityRules":["string"]}],
  "setting":{"description":"string","continuityRules":["string"]},
  "hook":"string",
  "buildUp":["string"],
  "climax":"string",
  "ending":"string",
  "endingType":"resolved|open|resolved_with_tease",
  "dialogueLanguage":"string",
  "visualStyle":"string",
  "visualDirection":{"id":"string","label":"string","mood":"string","application":"อธิบายวิธีใช้กับตัวละคร ฉาก แสง สี กล้อง และการเคลื่อนไหว"},
  "soundDirection":"string",
  "risks":["string"],
  "rationale":"string"
}\nต้องใช้ selectedVisualDirection จาก ANALYSIS เป็นข้อกำหนดด้านภาพของเรื่อง และใช้ selectedCores ทุก Core ตาม role ที่ผู้ใช้เลือก โดยให้ primary เป็นแกนขับเคลื่อนเรื่องและ secondary เป็นแกนสนับสนุน ห้ามแทนด้วย Core อื่น ต้องบอกความสัมพันธ์เหตุและผลชัดเจน ให้จุดเริ่ม กลาง และจบพอดีกับระยะเวลา`;
}

export function shotsPrompt(story, revision = "") {
  return `${STORY_FRAMEWORK}\n${jsonInstruction}\n\nแตกโครงเรื่องเป็น shot list ที่ต่อเนื่องและรวมเวลาเท่ากับ durationSeconds\nSTORY:\n${JSON.stringify(story, null, 2)}\nREVISION REQUEST:\n${revision || "ไม่มี"}\n\nใช้ schema นี้:\n{
  "projectTitle":"string",
  "durationSeconds":15,
  "shots":[{
    "number":1,
    "startTime":0,
    "endTime":5,
    "duration":5,
    "objective":"string",
    "subjects":["Subject 1"],
    "setting":"string",
    "action":"string",
    "camera":"string",
    "composition":"string",
    "lighting":"string",
    "dialogue":[{"speaker":"Subject 1","language":"English","line":"string","performance":"string"}],
    "sound":"string",
    "transition":"string",
    "continuity":["string"],
    "emotion":"string"
  }],
  "continuityChecklist":["string"],
  "totalDuration":15
}\nเวลา shot แรกต้องเริ่ม 0, แต่ละ shot ต้องต่อกันโดยไม่มีช่องว่างหรือซ้อนกัน และ shot สุดท้ายต้องจบตรง durationSeconds`;
}

export function finalPrompt(story, shots, prefix = "DY,", visualDirection = story.visualDirection) {
  return `สร้าง prompt ภาษาอังกฤษตามโครงสร้างตัวอย่างอย่างเคร่งครัด ข้อมูลทั้งหมดต้องมาจาก STORY, SHOTS และ VISUAL_DIRECTION เท่านั้น\n\nSTORY:\n${JSON.stringify(story, null, 2)}\nSHOTS:\n${JSON.stringify(shots, null, 2)}\nVISUAL_DIRECTION:\n${JSON.stringify(visualDirection, null, 2)}\n\nข้อกำหนด:\n- บรรทัดแรกต้องเริ่มด้วย ${prefix}subject_definitions:\n- ใช้หัวข้อตามลำดับ: subject_definitions, summary, retention_analysis, detailed_description, overall_soundscape, non_diegetic_music\n- กำหนดทุกตัวละครและสภาพแวดล้อมเป็น <Subject N> เท่านั้น แม้ Subject นั้นจะเป็นสถานที่ ห้ามใช้ <Environment N> หรือรูปแบบอื่น\n- หากมี reference ให้ใช้ <Picture N> ตามข้อมูลที่มีเท่านั้น\n- detailed_description ต้องแบ่ง [Shot N] และตั้งแต่ shot 2 เป็นต้นไป หัวบรรทัดต้องใช้รูปแบบ [Shot N] At 00:05.000 โดยคำนวณจาก startTime จริง ห้ามใช้เพียง (5s)\n- บทพูดใช้รูปแบบ <Subject N> (S1) ... <d>[English] dialogue</d> โดยเปลี่ยนภาษาตามข้อมูลจริง\n- retention_analysis ต้องระบุ shot ที่ subject ปรากฏและสิ่งที่ต้องรักษา\n- ต้องสะท้อน VISUAL_DIRECTION ทั้งรูปแบบภาพและ mood อย่างสม่ำเสมอใน subject_definitions, summary และทุก shot โดยระบุผลต่อรูปลักษณ์ตัวละคร ฉาก แสง สี เลนส์ กล้อง และการเคลื่อนไหวเท่าที่เกี่ยวข้อง\n- ห้ามสร้าง reference image ที่ผู้ใช้ไม่ได้ให้\n- ห้ามมี Markdown heading หรือ code fence\n- ส่งเฉพาะ prompt ฉบับสมบูรณ์`;
}

export const SYSTEM_PROMPT = "คุณเป็นนักวิเคราะห์บท ผู้กำกับ และผู้วาง shot list สำหรับวิดีโอสั้น ให้ความสำคัญกับความชัดเจน ความต่อเนื่อง ความเป็นไปได้ และเจตนาของผู้ใช้";
