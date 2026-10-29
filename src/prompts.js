import { normalizeShotListCameras } from "./camera.js";

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

export const SHOT_LIST_FRAMEWORK = `
หลักออกแบบ shot list สำหรับนำไปสร้างวิดีโอจริง:
1. แบ่ง shot ตามการเปลี่ยนข้อมูล อารมณ์ ตำแหน่ง หรือการกระทำ ไม่กำหนดจำนวน shot แบบตายตัว จังหวะเร็วใช้ shot สั้นได้ ส่วนอารมณ์สำคัญต้องมีเวลาให้ผู้ชมอ่านสีหน้าและผลของการกระทำ
2. เปิดเรื่องด้วยภาพหรือเหตุการณ์ที่อ่านได้ทันทีภายใน 1-3 วินาทีแรก ระบุว่าใครอยู่ที่ไหน กำลังเกิดอะไร และแรงกดดันมาจากทิศใด
3. ก่อน action ที่ซับซ้อนต้องมี spatial anchor ให้เข้าใจตำแหน่งตัวละคร ฉาก ทางเข้า ทางออก ระยะห่าง และทิศทางการเคลื่อนที่ จากนั้นรักษา screen direction และ geography ข้าม shot
4. ทุก shot ต้องมี startState, actionBeats ตามลำดับ และ endState ที่ส่งต่อให้ shot ถัดไป เหตุเกิดก่อนผลเสมอ เช่น สัมผัสก่อนวัตถุขยับ กระแทกก่อนตัวละครเสียหลัก และปล่อยมือก่อนอุปกรณ์ตก
5. actionBeats ต้องบอกการเคลื่อนไหวที่มองเห็นได้จริง หลีกเลี่ยงคำกว้าง เช่น “ต่อสู้กัน” หรือ “บรรยากาศตึงเครียด” โดยไม่อธิบายสิ่งที่เกิดขึ้นบนจอ
6. แยกภาษากล้องเป็นคนละแกนเสมอ: angle คือระดับ/การก้มเงย, perspective คือ objective/OTS/POV, shotSize คือระยะภาพ, primaryMovement คือการเคลื่อนกล้อง และ focus คือระนาบความชัด ห้ามใช้คำเหล่านี้แทนกัน
7. ให้ composition แสดง subject, อันตราย และเป้าหมายในเฟรมเดียวกันเมื่อจำเป็นต่อความเข้าใจ การ close-up ต้องมี spatial cue หรือ shot ก่อนหน้าที่ช่วยรักษาทิศทาง
8. บทพูด เสียงสัมผัส เสียงฝีเท้า ลมหายใจ ambience และดนตรีต้องสัมพันธ์กับเวลาของ action ระบุเสียงที่ลากข้าม cut เมื่อช่วยเชื่อม shot และห้ามเพิ่ม BGM หาก STORY ไม่ต้องการ
9. continuityIn และ continuityOut ต้องติดตามตำแหน่ง ท่าทาง มือที่ถือของ เสื้อผ้า สภาพวัตถุ แสง อารมณ์ บาดแผล และสิ่งที่หายไปจากฉาก ห้ามให้ prop หรือ subject หาย ปรากฏซ้ำ หรือกลับสภาพเอง
10. ใช้ transition เพราะการเคลื่อนไหว เสียง สายตา หรือการเปลี่ยนข้อมูลรองรับ ไม่ใช้ transition เพื่อความสวยงามอย่างเดียว และเก็บ negativeConstraints เฉพาะข้อห้ามที่เสี่ยงเกิดจริงใน shot นั้น
11. startState และ endState ต้องอธิบายเฉพาะสิ่งที่มองเห็นในเฟรมแรกและเฟรมสุดท้ายของ shot นั้น ห้ามคัดลอกภาพจากสถานที่เดิมมาเป็น startState เมื่อ hard cut หรือ match cut เปลี่ยนมุม/สถานที่ ให้ใช้ continuityBridge อธิบายสถานะที่ส่งต่อและสิ่งที่ยังเกิดอยู่นอกเฟรม
12. action หรือ actionBeat หนึ่งเหตุการณ์ต้องเกิดเต็มรูปแบบใน shot เดียวเท่านั้น ห้ามแสดงการเอื้อมมือ หันตัว เดิน ล้ม เปิดประตู หรือ motion เดิมซ้ำตั้งแต่ต้นใน shot ถัดไป
13. หาก cut on action ให้ shot ก่อนจบที่เฟสหนึ่งของ motion และ shot ถัดไปเริ่มจากเฟสถัดไปทันที เช่น shot ก่อนจบเมื่อมือแตะลูกบิด และ shot ถัดไปเริ่มเมื่อลูกบิดหมุน ห้ามย้อนกลับไปเริ่มเอื้อมมือใหม่
14. การค้างท่า มองต่อ หรือกล้อง hold ต้องอธิบายว่าเป็น continuation/hold ของ state เดิม ไม่เขียนเป็นการกระทำใหม่ และบทพูดแต่ละบรรทัดต้องเกิดเพียงครั้งเดียว
15. ออกแบบทุก shot ด้วยภาษาภาพยนตร์ที่ดึงสายตา: กำหนดสิ่งที่ผู้ชมเห็นก่อน สิ่งที่ค่อยเผย และภาพหรือข้อมูลที่เป็น payoff ตอนท้าย shot โดยให้ทั้งหมดรับใช้เรื่องและอารมณ์
16. สร้าง visual rhythm ด้วยความต่างที่มีเหตุผลของ shot size, angle, depth, foreground/midground/background, negative space, movement และความนิ่ง ห้ามใช้ coverage มุมเดิมซ้ำ ๆ หรือสลับ wide/close-up โดยไม่มีเหตุผล
17. กล้องต้องถูกกระตุ้นจาก action, eyeline, sound, reveal หรือ emotional shift ใช้ push-in, tracking, pan, rack focus, occlusion, reflection, silhouette และ parallax เฉพาะเมื่อช่วยเพิ่ม tension, curiosity หรือ empathy
18. ใน 1-3 วินาทีแรกต้องมีภาพ hook ที่เข้าใจได้ทันที ช่วงกลางเพิ่ม visual question หรือแรงกดดัน และเก็บภาพที่ทรงพลังที่สุดไว้ให้ climax/payoff โดยยังให้เวลาผู้ชมอ่าน action และสีหน้าได้ชัด
19. ความน่าสนใจต้องเกิดจาก staging, performance, composition, light, reveal และ cause-effect ไม่ใช้กล้องสั่น การตัดถี่ VFX หรือมุมหวือหวาเพื่อกลบเนื้อหาที่ไม่ชัด
20. subjects ต้องรวมตัวละครหรือสิ่งมีชีวิตทุกตัวที่มองเห็นใน shot ส่วนตัวละครที่กระทำจากนอกเฟรมให้ใส่ใน offscreenSubjects ห้ามกล่าวถึงตัวละครในภาพโดยไม่อยู่ใน subjects
21. แต่ละ actionBeat ต้องมี startOffset และ endOffset ภายในเวลาของ shot เรียงต่อกันโดยไม่ซ้อน เพื่อพิสูจน์ว่าการกระทำทั้งหมดอ่านออกจริง หากเวลาไม่พอให้ลด action หรือย้ายไป shot อื่น
22. causalLink ต้องระบุเหตุที่รับมาจาก shot ก่อน ผลที่เกิดใน shot นี้ และสิ่งที่วางไว้ให้ shot หลัง โดยเฉพาะผลล่าช้า เช่น โครงสร้างเริ่มร้าวก่อนขาดในภายหลัง
23. prop ห้ามปรากฏในมือ ตำแหน่ง หรือสภาพใหม่โดยไม่มี action หรือ continuityBridge อธิบายการได้มา การย้าย หรือการเปลี่ยนสภาพ
24. reference image สำหรับ object ต้องมีวัตถุหลักเพียงชนิดเดียว ห้ามรวมวัตถุคนละชนิด เช่น ปืนกับอาหาร ไว้ใน Picture เดียว และให้แยก location reference เมื่อแต่ละพื้นที่ต้องถูก exclude หรือจัดเฟรมต่างกันอย่างชัดเจน
25. ทุก shot ใช้ primary angle หนึ่งแบบและ primary movement หนึ่งแบบ หากต้องเปลี่ยนมุมหรือ movement หลักให้แยก shot; rack focus อยู่ใน focus.transition ไม่ใช่ camera movement
26. pan ใช้ซ้าย/ขวาและ tilt ใช้ขึ้น/ลง; dolly เปลี่ยน perspective จากการเคลื่อนกล้อง ส่วน zoom เปลี่ยนทางยาวโฟกัสโดยกล้องอยู่กับที่; tracking/trucking ต้องระบุทิศสัมพันธ์กับ subject
27. มุม dutch-angle, worms-eye, top-down และ dolly-zoom ใช้เมื่อมีหน้าที่ต่อเรื่องหรืออารมณ์ชัดเจนเท่านั้น ห้ามใช้เพื่อความหวือหวา และ shot ที่มีบทพูดต้องใช้ CU, MCU, MS หรือ MLS เพื่อให้ใบหน้าและปากอ่านได้
28. cameraContinuity ต้องใช้ stable axisId/eyelineMatchId พร้อม cameraSide, axisTransition, eyelineTransition, entry/exit direction และสะพานจาก shot ก่อน เพื่อให้ validator ตรวจ 180-degree line, eyeline match และ screen direction ข้าม cut ได้จริง
`;

const jsonInstruction = "ตอบเป็น JSON object ที่ถูกต้องเท่านั้น ห้ามครอบด้วย Markdown code fence และห้ามใส่คำอธิบายนอก JSON";

export function analysisPrompt(input) {
  return `${STORY_FRAMEWORK}\n${jsonInstruction}\n\nวิเคราะห์ brief ต่อไปนี้เพื่อเตรียมสร้างวิดีโอสั้น:\n${JSON.stringify(input, null, 2)}\n\nใช้ schema นี้:\n{
  "title": "string",
  "slug": "string",
  "language": "string",
  "targetPlatform": "string",
  "durationSeconds": 15,
  "shotCountRecommendation": {"minimum":3,"recommended":5,"maximum":7,"rationale":"เหตุผลจากความยาว จำนวน action/emotional beats และเวลาที่ผู้ชมต้องใช้ทำความเข้าใจภาพ"},
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
}\nshotCountRecommendation ต้องประเมินจาก durationSeconds จำนวนการเปลี่ยนข้อมูล/action/emotional beat ความซับซ้อนของฉาก และเวลาที่ต้องใช้ให้ motion อ่านออก ห้ามใช้สูตรตายตัว หาก input.requestedShotCount มีค่า ให้ยังคงเสนอจำนวนที่เหมาะสมอย่างอิสระเพื่อให้ผู้ใช้เปรียบเทียบ\nreferences หมายถึงภาพที่ผู้ใช้มีอยู่แล้วและระบุใน input.references เท่านั้น หาก input.references ว่างต้องตอบ references: [] ห้ามเสนอหรือสร้าง Picture ใหม่ใน analysis เพราะระบบจะคำนวณ new reference prompts จาก STORY/SHOTS ภายหลัง\nvisualDirection.source ต้องเป็น explicit เฉพาะเมื่อ brief หรือคำตอบของผู้ใช้ระบุรูปแบบภาพอย่างชัดเจน เช่น ภาพยนตร์, live action, anime, 3D, illustration, documentary หรือ commercial หากไม่พบให้ตั้ง source เป็น missing และ medium/label เป็น null ห้ามเดา และไม่ต้องสร้าง clarificationQuestions สำหรับ visualDirection เพราะ CLI จะถามจากรายการโดยตรง ถามข้อมูลอื่นเฉพาะที่มีผลต่อโครงเรื่องหรือการสร้าง shot จริง ไม่เกิน 7 ข้อ หากอนุมานได้อย่างปลอดภัยให้ระบุเป็นสมมติฐานใน constraints แทนการถาม`;
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
  "assetManifest":{"locations":[{"id":"stable-location-id","description":"string"}],"objects":[{"id":"stable-object-id","description":"string","continuityRules":["string"]}]},
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
}\nต้องใช้ selectedVisualDirection จาก ANALYSIS เป็นข้อกำหนดด้านภาพของเรื่อง และใช้ selectedCores ทุก Core ตาม role ที่ผู้ใช้เลือก โดยให้ primary เป็นแกนขับเคลื่อนเรื่องและ secondary เป็นแกนสนับสนุน ห้ามแทนด้วย Core อื่น วางจังหวะเรื่องให้รองรับ ANALYSIS.selectedShotCount โดยแต่ละ shot มีหน้าที่ต่างกัน ต้องบอกความสัมพันธ์เหตุและผลชัดเจน ให้จุดเริ่ม กลาง และจบพอดีกับระยะเวลา\nassetManifest ต้องกำหนด stable ID ของทุกสถานที่และวัตถุที่มีผลต่อ action/continuity ก่อนแตก shot list หากไม่มีวัตถุสำคัญให้ใช้ objects เป็น [] และห้ามเพิ่ม asset นอก manifest ในขั้น shot list`;
}

export function shotsPrompt(story, revision = "") {
  return `${STORY_FRAMEWORK}\n${SHOT_LIST_FRAMEWORK}\n${jsonInstruction}\n\nแตกโครงเรื่องเป็น shot list ระดับ production ที่ต่อเนื่องและรวมเวลาเท่ากับ durationSeconds\nSTORY:\n${JSON.stringify(story, null, 2)}\nREVISION REQUEST:\n${revision || "ไม่มี"}\n\nใช้ schema นี้:\n{
  "projectTitle":"string",
  "durationSeconds":15,
  "shots":[{
    "number":1,
    "startTime":0,
    "endTime":5,
    "duration":5,
    "beat":"ชื่อจังหวะภาพสั้นและเจาะจง",
    "storyPhase":"hook|setup|escalation|turn|climax|resolution|tease",
    "objective":"string",
    "cinematicIntent":"เหตุผลด้านภาพยนตร์ว่าการจัดภาพนี้สร้าง tension, curiosity, empathy, surprise หรือ payoff อย่างไร",
    "attentionFocus":"สิ่งที่สายตาผู้ชมเห็นก่อน ตามด้วยสิ่งที่ค่อยเปิดเผยใน shot",
    "visualPayoff":"ภาพ ข้อมูล หรือการเปลี่ยนอารมณ์ที่ชัดเจนในเฟรมท้ายของ shot",
    "subjects":["Subject 1"],
    "offscreenSubjects":["Subject 2 ที่กระทำหรือส่งเสียงจากนอกเฟรม"],
    "setting":"string",
    "referenceNeeds":{"locationKey":"stable-location-id","objectKeys":["stable-object-id สำหรับวัตถุที่ต้องล็อกรูปลักษณ์ หรือ []"]},
    "spatialAnchor":"ตำแหน่ง subject, เป้าหมาย, อันตราย, ทางเข้าออก และทิศทางในฉาก",
    "startState":"สิ่งที่มองเห็นจริงในเฟรมแรกของ shot นี้",
    "continuityBridge":"อธิบายว่าสถานะจาก endState ก่อนหน้าส่งต่อมายังเฟรมใหม่นี้อย่างไร รวมสิ่งที่ยังเกิดอยู่นอกเฟรม",
    "causalLink":"เหตุจาก shot ก่อน -> ผลใน shot นี้ -> สิ่งที่ setup ให้ shot ถัดไป",
    "action":"สรุปการกระทำหลักที่มองเห็นได้",
    "actionBeats":[{"order":1,"startOffset":0.5,"endOffset":2.0,"action":"การกระทำที่มองเห็นได้","result":"ผลทางกายภาพหรือข้อมูลที่เกิดขึ้น"}],
    "endState":"สิ่งที่มองเห็นจริงในเฟรมสุดท้ายของ shot นี้",
    "camera":{"lensMm":"35mm","shotSize":"ECU|CU|MCU|MS|MLS|LS|ELS","angle":"eye-level|high-angle|low-angle|worms-eye|top-down|dutch-angle|ground-level","perspective":"objective|ots|pov","height":"ground|low|waist|chest|shoulder|eye|high|overhead","position":"ตำแหน่งกล้องสัมพันธ์กับ subject และฉาก","primaryMovement":{"type":"locked-off|pan|tilt|dolly-in|dolly-out|zoom-in|zoom-out|tracking|trucking|crane|jib|dolly-zoom|handheld|steadicam|gimbal|arc|orbit","direction":"pan=left/right, tilt=up/down, locked-off=none, อื่นๆ ระบุทิศสัมพันธ์กับ subject","speed":"static|very-slow|slow|moderate|fast","motivation":"เหตุผลจาก action, eyeline, sound, reveal หรือ emotional shift"},"focus":{"subject":"subject/วัตถุ/ระนาบที่คมชัด","depth":"deep|moderate|shallow","transition":"none|rack-focus"},"screenDirection":"คำอธิบายทิศของ subject ในเฟรม","screenDirectionCode":"frame-left|frame-right|stationary|toward-camera|away-from-camera|none","screenDirectionSubject":"Subject ID ที่กำลังเคลื่อน หรือ none","intent":"ผลทางเรื่องหรืออารมณ์ที่การเลือกกล้องนี้ทำให้เกิด"},
    "cameraContinuity":{"axis":"คำอธิบายแนว 180-degree line","axisId":"stable-axis-id ที่ใช้ซ้ำข้าม shot","cameraSide":"left|right|on-axis|none","axisTransition":"initial|preserve|motivated-cross|new-axis","eyeline":"คำอธิบายคู่สายตา","eyelineMatchId":"stable-eyeline-id หรือ none","eyelineDirection":"frame-left|frame-right|camera|away|none","eyelineTransition":"initial|preserve|reverse-match|new-eyeline","entryDirection":"frame-left|frame-right|stationary|toward-camera|away-from-camera|none","exitDirection":"frame-left|frame-right|stationary|toward-camera|away-from-camera|none","changeMotivation":"เหตุผลของการรักษาหรือเปลี่ยน axis/eyeline","previousShotBridge":"สิ่งที่เปลี่ยนหรือคงเดิมจากกล้อง shot ก่อน; shot 1 ใช้ initial setup"},
    "composition":"string",
    "lighting":"string",
    "dialogue":[{"speaker":"Subject 1","language":"English","line":"string","performance":"string","delivery":"on-camera|offscreen|voice-over","lipSync":true}],
    "sound":{"ambience":"string","syncEffects":["string"],"voice":"string","music":"string","bridge":"เสียงที่ลากเข้า/ออก shot หรือ none"},
    "transition":{"type":"hard cut|match cut|cut on action|whip pan|hold|อื่นๆ","motivation":"เหตุผลจาก action, sound, eyeline หรือข้อมูล"},
    "continuityIn":["string"],
    "continuityOut":["string"],
    "emotion":{"start":"string","end":"string","visibleCue":"สีหน้า ท่าทาง หรือลมหายใจที่มอง/ได้ยินได้"},
    "negativeConstraints":["สิ่งที่ห้ามเกิดเฉพาะ shot นี้"]
  }],
  "continuityChecklist":["กฎ global สำหรับ identity, wardrobe, props, geography, screen direction, lighting และ state changes"],
  "totalDuration":15
}\nข้อกำหนดเพิ่มเติม:\n- เวลา shot แรกต้องเริ่ม 0 แต่ละ shot ต้องต่อกันโดยไม่มีช่องว่างหรือซ้อนกัน และ shot สุดท้ายต้องจบตรง durationSeconds\n- number ต้องเรียงจาก 1 โดยไม่ข้าม และ totalDuration ต้องเท่ากับ durationSeconds ของ STORY\n- จำนวนและความยาว shot ต้องเกิดจาก action และ emotional beat ห้ามเฉลี่ยเวลาเท่ากันโดยไม่มีเหตุผล\n- shot แรกต้องมี storyPhase=hook และช่วงท้ายต้องให้ผลของ climax อ่านได้ชัดก่อนจบ\n- startState ของ shot 2 เป็นต้นไปต้องสอดคล้องกับ endState ของ shot ก่อนหน้า\n- หากไม่มีบทพูดให้ใช้ dialogue เป็น [] หากไม่มีดนตรีให้ sound.music เป็น none\n- ห้ามเพิ่มตัวละคร สถานที่ prop พลัง ความเสียหาย หรือเหตุการณ์ที่ STORY ไม่รองรับ\n- referenceNeeds.locationKey ต้องใช้ key เดิมเมื่อเป็นสถานที่เดียวกัน และใช้ key ต่างกันเมื่อเป็นคนละพื้นที่ที่ต้องสร้างภาพอ้างอิงแยก\n- referenceNeeds.objectKeys ต้องรวมวัตถุทุกชิ้นที่รูปลักษณ์ วัสดุ สภาพ เจ้าของ หรือตำแหน่งมีผลต่อ action/continuity ใน shot ใช้ key เดิมสำหรับวัตถุชิ้นเดียวกันข้าม shot และใช้ [] เฉพาะเมื่อไม่มีวัตถุที่ต้องล็อกจริง
- shot 1 ต้องใช้ axisTransition และ eyelineTransition เป็น initial; shot ถัดไปใช้ preserve เมื่อคงแกน, motivated-cross เมื่อข้ามแกนอย่างมีเหตุผล, new-axis/new-eyeline เมื่อเปลี่ยน geography หรือจุดสนใจ และต้องใช้ axisId/eyelineMatchId เดิมเมื่อยังเป็นแกนหรือคู่สายตาเดิม
- screenDirectionCode, entryDirection และ exitDirection ของ Subject เดิมต้องต่อกันข้าม cut เมื่อ axisTransition=preserve
- dialogue แบบ on-camera ที่ต้องซิงก์ปากให้ lipSync=true และใช้ ECU/ CU/ MCU/ MS/ MLS โดย ECU ต้อง focus ที่ใบหน้าหรือปาก; offscreen และ voice-over ต้องใช้ lipSync=false`;
}

export function referencePromptsPrompt(story, shots, existingReferences = [], revision = "") {
  return `${STORY_FRAMEWORK}\n${jsonInstruction}\n\nสร้าง prompt ภาษาอังกฤษสำหรับ generate ภาพอ้างอิงที่จำเป็นต่อวิดีโอนี้ โดยสร้างเฉพาะตัวละคร สถานที่ และวัตถุสำคัญที่ปรากฏจริงใน STORY/SHOTS\nSTORY:\n${JSON.stringify(story, null, 2)}\nSHOTS:\n${JSON.stringify(shots, null, 2)}\nEXISTING_REFERENCES:\n${JSON.stringify(existingReferences, null, 2)}\nREVISION REQUEST:\n${revision || "ไม่มี"}\n\nใช้ schema นี้:\n{
  "projectTitle":"string",
  "globalStyle":{"visualDirection":"string","mood":"string","styleLock":"ข้อกำหนดที่ทุกภาพต้องใช้ร่วมกัน"},
  "existingReferences":[{"pictureId":"Picture 1","description":"string","assetType":"character|location|object|other","linkedSubjects":["Subject 1"],"locationKey":"stable-location-id หรือ null","objectKey":"stable-object-id หรือ null","usedInShots":[1]}],
  "textOnlyRequirements":[{"assetType":"character|object","key":"Subject 2 หรือ stable-object-id","description":"English visual description ready to embed in video prompts","reason":"เหตุผลที่ไม่จำเป็นต้องสร้างภาพ reference","usedInShots":[1]}],
  "assets":[{
    "pictureId":"Picture 2",
    "assetType":"character|location|object",
    "locationKey":"stable-location-id สำหรับ location หรือ null สำหรับประเภทอื่น",
    "objectKey":"single-object-id สำหรับ object หรือ null สำหรับประเภทอื่น",
    "name":"string",
    "linkedSubjects":["Subject 1"],
    "usedInShots":[1],
    "purpose":"string",
    "prompt":"English image-generation prompt",
    "negativePrompt":"English negative prompt",
    "consistencyNotes":["string"]
  }],
  "usageGuide":["string"]
}\nข้อกำหนด:\n- รักษา visualDirection, mood, ยุคสมัย, palette และระดับความสมจริงจาก STORY อย่างเคร่งครัด\n- existingReferences ต้องคง Picture ID ตามที่ได้รับ ห้ามสร้าง prompt ซ้ำให้ภาพที่มีอยู่แล้ว แต่ต้องจำแนก assetType และเติม linkedSubjects/locationKey/objectKey/usedInShots เพื่อสร้าง mapping ที่ตรวจสอบได้ หากภาพเดิมไม่ครอบคลุม requirement ใด ให้สร้าง asset ใหม่\n- assets ใหม่ต้องเริ่มหมายเลข Picture ต่อจาก existingReferences และห้ามซ้ำกัน\n- character: ต้องสร้าง character sheet สำหรับตัวละครหลักทุกตัว และตัวประกอบสำคัญที่ปรากฏซ้ำ มี identity/wardrobe continuity หรือมีผลต่อเรื่องอย่างชัดเจน ส่วนตัวประกอบเล็กน้อยที่ไม่ต้องล็อก identity ให้ใส่ textOnlyRequirements พร้อมคำอธิบายภาพภาษาอังกฤษและเหตุผล แต่ละ character asset linkedSubjects ได้หนึ่ง Subject เท่านั้น ใช้พื้นหลังเรียบ มี full-body front, three-quarter, side, back, facial expressions เสื้อผ้าและอุปกรณ์ประจำตัว\n- location: ต้องมี environment reference ครบทุก referenceNeeds.locationKey แต่ละภาพกำหนด locationKey เดียว ไม่มีตัวละคร มี wide establishing view และรายละเอียดสถาปัตยกรรม แสง วัสดุ สี และจุดที่ใช้จัดฉาก\n- object: วิเคราะห์ความสำคัญก่อนสร้างภาพ ให้สร้าง object asset เฉพาะ key prop ที่ขับเคลื่อนเหตุการณ์ ปรากฏซ้ำ ต้องล็อกรูปลักษณ์/สถานะ หรือมี close-up สำคัญ วัตถุย่อยทั่วไปให้ใส่ textOnlyRequirements พร้อม description ภาษาอังกฤษที่ละเอียดพอใช้ใน prompt; object asset หนึ่งภาพครอบคลุมได้เพียง objectKey เดียว\n- prompt ทุกข้อเป็นภาษาอังกฤษ ใช้คำบรรยายเชิงภาพที่ generate ได้จริง และห้ามใส่ชื่อศิลปินที่ยังมีชีวิต\n- linkedSubjects, locationKey, objectKey และ usedInShots ต้องตรงกับ SHOTS โดย usedInShots ต้องรวมทุก shot ที่ใช้ reference นั้น ห้ามขาดหรือใส่ shot ที่ไม่เกี่ยวข้อง\n- LLM ต้องวิเคราะห์ทุก Subject และ objectKey ว่าควรเป็น image reference หรือ text-only โดยพิจารณาบทบาท ความถี่ การต้องรักษา identity/continuity ความสำคัญต่อเนื้อเรื่องและการเห็นรายละเอียด; locationKey ทุกแห่งต้องเป็น image reference และห้ามเป็น text-only จำนวน assets ต้องตรงกับ requirement ที่เลือกเป็น image reference และยังไม่มี existing reference รองรับ\n- ก่อนตอบให้ตรวจ coverage จาก Subject ที่มองเห็น, locationKey และ objectKey ของทุก shot ว่าทุก requirement มี Picture ID รองรับหรือมี textOnlyRequirements ที่ระบุ key/description/reason/usedInShots ครบ โดยตัวละครหลักและ location ห้ามเป็น text-only\n- หากไม่มีวัตถุสำคัญ ไม่ต้องสร้าง assetType object`;
}

function storyboardGrid(shotCount) {
  const columns = shotCount <= 2 ? Math.max(shotCount, 1) : shotCount <= 4 ? 2 : shotCount <= 6 ? 3 : shotCount <= 8 ? 4 : Math.ceil(Math.sqrt(shotCount));
  return { columns, rows: Math.ceil(shotCount / columns) };
}

export function storyboardPrompt(story, shots, referenceAssets, aspectRatio = "9:16", revision = "") {
  const shotCount = shots?.shots?.length || 0;
  const grid = storyboardGrid(shotCount);
  const storyboardShots = normalizeShotListCameras(shots);
  return `${STORY_FRAMEWORK}\n${SHOT_LIST_FRAMEWORK}\n${jsonInstruction}\n\nสร้าง prompt ภาษาอังกฤษสำหรับ generate storyboard key image แบบ contact sheet หนึ่งภาพ ซึ่งมีหนึ่ง panel ต่อหนึ่ง shot เพื่อให้ผู้ใช้เห็นภาพรวมทั้ง sequence ก่อนสร้างวิดีโอ\nSTORY:\n${JSON.stringify(story, null, 2)}\nSHOTS:\n${JSON.stringify(storyboardShots, null, 2)}\nREFERENCE_ASSETS:\n${JSON.stringify(referenceAssets, null, 2)}\nGRID_SPEC:\n${JSON.stringify({ ...grid, panelAspectRatio: aspectRatio, shotCount }, null, 2)}\nREVISION REQUEST:\n${revision || "ไม่มี"}\n\nใช้ schema นี้:\n{
  "projectTitle":"string",
  "shotCount":${shotCount},
  "grid":{"columns":${grid.columns},"rows":${grid.rows},"readingOrder":"left-to-right, top-to-bottom","panelAspectRatio":"${aspectRatio}"},
  "globalStyle":{"visualDirection":"string","mood":"string","continuityLock":"identity, wardrobe, props, geography, lighting and palette shared across panels"},
  "referenceMapping":[{"pictureId":"Picture 1","usage":"identity, location, prop or look locked by this image"}],
  "panels":[{
    "shotNumber":1,
    "timeRange":"00:00.000-00:03.000",
    "keyframeMoment":"เหตุการณ์หนึ่งขณะที่มองเห็นได้ในเฟรมเดียวและเป็นภาพตัวแทนของ shot",
    "subjects":["Subject 1"],
    "referencePictures":["Picture 1"],
    "camera":{"lensMm":"คัดลอกจาก SHOT","shotSize":"คัดลอกจาก SHOT","angle":"คัดลอกจาก SHOT","perspective":"คัดลอกจาก SHOT","height":"คัดลอกจาก SHOT","position":"คัดลอกจาก SHOT","primaryMovement":{"type":"คัดลอก","direction":"คัดลอก","speed":"คัดลอก","motivation":"คัดลอก"},"focus":{"subject":"คัดลอก","depth":"คัดลอก","transition":"คัดลอก"},"screenDirection":"คัดลอก","screenDirectionCode":"คัดลอก","screenDirectionSubject":"คัดลอก","intent":"คัดลอก","continuity":{"axis":"คัดลอก","axisId":"คัดลอก","cameraSide":"คัดลอก","axisTransition":"คัดลอก","eyeline":"คัดลอก","eyelineMatchId":"คัดลอก","eyelineDirection":"คัดลอก","eyelineTransition":"คัดลอก","entryDirection":"คัดลอก","exitDirection":"คัดลอก","changeMotivation":"คัดลอก","previousShotBridge":"คัดลอก"}},
    "composition":"foreground, midground, background, screen direction and attention focus",
    "prompt":"English still-image prompt for this single panel",
    "continuityNotes":["string"],
    "negativeConstraints":["string"]
  }],
  "masterPrompt":"Complete English prompt for generating the entire storyboard as one composite image",
  "negativePrompt":"English negative prompt for the complete contact sheet",
  "usageGuide":["string"]
}\nข้อกำหนด:\n- ต้องมี panels เท่ากับจำนวน SHOTS และเรียง shotNumber จาก 1 โดยไม่ข้าม\n- แต่ละ panel เป็น still keyframe เพียงหนึ่งขณะ ห้ามรวมต้น กลาง และจบของ action ไว้ในช่องเดียว ห้ามใช้ภาพซ้อน ghost pose หรือหลายเวลาใน panel เดียว\n- เลือก keyframeMoment จาก attentionFocus, visualPayoff และ action/result ที่สำคัญที่สุด โดยต้องเกิดขึ้นจริงใน shot นั้นและไม่เพิ่มเหตุการณ์ใหม่\n- timeRange ต้องตรงกับ startTime/endTime ของ SHOTS ทุกข้อ\n- subjects ต้องเป็นผู้ที่มองเห็นจริงใน keyframe; ตัวละครนอกเฟรมไม่ต้องวาด แต่สามารถส่งผลผ่านแสง เงา เสียง หรือวัตถุได้เมื่อ shot รองรับ\n- referenceMapping ต้องมี Picture ID ทุกภาพจาก REFERENCE_ASSETS อย่างละหนึ่งครั้ง ใช้ Picture ID เฉพาะจากรายการนั้น และ referencePictures ต้องตรงกับตัวละคร สถานที่ หรือวัตถุใน panel ห้ามสร้าง Picture ID ใหม่\n- รายการ textOnlyRequirements ใน REFERENCE_ASSETS ไม่มี Picture ID และห้ามใส่ใน referencePictures แต่ต้องถ่ายทอด description ที่เกี่ยวข้องลงใน prompt ของ panel ตาม usedInShots โดยตรง\n- prompt ของแต่ละ panel ต้องรักษา lensMm, shotSize, angle, perspective, height, position, focus, screenDirection, intent และ cameraContinuity จาก SHOTS; primaryMovement ใช้เพื่อเลือก composition ของ keyframe เท่านั้น ห้ามบรรยาย motion หลายขั้นในภาพนิ่ง\n- masterPrompt ต้องสั่งสร้าง contact sheet หนึ่งภาพตาม GRID_SPEC มี ${shotCount} panels ขนาดเท่ากัน คั่นด้วยเส้น gutter สะอาด เรียงซ้ายไปขวาและบนลงล่าง แต่ละ panel รักษาอัตราส่วน ${aspectRatio}\n- หาก grid มีช่องเกินจำนวน shot ให้ช่องที่เหลือเป็นพื้นกลางเรียบ ไม่มีตัวละคร ฉาก หรือข้อความ\n- ห้ามสร้าง title, subtitle, dialogue text, watermark, logo, UI, speech bubble หรือข้อความภายใน artwork; การจับคู่ panel กับ shot ให้อาศัยลำดับช่องใน usageGuide\n- รักษา identity, wardrobe, prop ownership/state, geography, screen direction, lighting direction, palette และระดับความสมจริงข้ามทุก panel\n- masterPrompt, panel prompt, negativePrompt และ usageGuide ต้องพร้อมนำไปใช้จริงและเป็นภาษาอังกฤษ`;
}

function seedanceFinalPrompt(story, shots, visualDirection, referenceAssets) {
  return `สร้าง production prompt ภาษาอังกฤษก้อนเดียวสำหรับ Seedance 2.5 จากข้อมูลที่อนุมัติแล้วเท่านั้น\n\nSTORY:\n${JSON.stringify(story, null, 2)}\nSHOTS:\n${JSON.stringify(shots, null, 2)}\nVISUAL_DIRECTION:\n${JSON.stringify(visualDirection, null, 2)}\nREFERENCE_ASSETS:\n${JSON.stringify(referenceAssets, null, 2)}\n\nข้อกำหนด:\n- บรรทัดแรกต้องเป็น REFERENCE_MAPPING:\n- ใช้หัวข้อตามลำดับและมีครั้งเดียว: REFERENCE_MAPPING:, SEQUENCE_SPECIFICATION:, TIMECODED_BEATS:, GLOBAL_CONSTRAINTS:\n- ใน REFERENCE_MAPPING ให้ map <Picture N> ทุกภาพเป็น @ImageN โดยรักษาหมายเลขเดิม และคัดลอก assetType, name, linkedSubjects, locationKey/objectKey และ purpose จาก REFERENCE_ASSETS ให้สัมพันธ์กัน ใช้หนึ่งบรรทัดต่อหนึ่ง @ImageN/<Picture N> ห้ามสลับความหมายหรือสร้าง Image ID เพิ่ม\n- SEQUENCE_SPECIFICATION ระบุ Generator target: Seedance 2.5, duration, aspect ratio, Visual direction, Mood, look, location geography, language และแนวทางเสียงจากข้อมูลต้นฉบับ\n- TIMECODED_BEATS แบ่งเป็น [Beat N] 00:00.000-00:03.000 ตาม startTime/endTime จริงของทุก shot ห้ามเปลี่ยนจำนวน ลำดับ หรือระยะเวลา\n- แต่ละ Beat ต้องเป็นย่อหน้า production prompt ภาษาอังกฤษที่เก็บ camera ทุกช่อง ได้แก่ lensMm, canonical shotSize, angle, perspective, height, position, primaryMovement พร้อม direction/speed/motivation, focus, screenDirection, intent และ cameraContinuity ก่อนระบุองค์ประกอบ ตำแหน่ง Subject เฟรมแรก actionBeats ตามช่วงเวลา แสง performance เสียง transition และเฟรมสุดท้าย\n- ใช้ <Subject N> สำหรับทุก Subject และ @ImageN สำหรับภาพอ้างอิงที่เกี่ยวข้อง แยกผู้ที่เห็นในเฟรมกับผู้กระทำจากนอกเฟรมให้ชัด แต่ละ Beat ต้องกล่าวถึง @ImageN ทุกภาพที่มี shot number นั้นใน usedInShots และห้ามใส่ภาพที่ไม่เกี่ยวข้อง\n- รักษา startState, endState, continuityBridge, causalLink, continuityIn/continuityOut และ state ของ prop โดยไม่เริ่ม motion ซ้ำหรือทำให้ของปรากฏเอง\n- Dialogue ต้องตรงข้อมูลต้นฉบับทุกคำและใช้รูปแบบ <d>[Language] dialogue</d> พร้อมรักษา delivery และ lipSync จาก SHOTS; ช็อตที่ไม่มีบทพูดให้ระบุ No dialogue.\n- GLOBAL_CONSTRAINTS สรุป identity, anatomy, character count, wardrobe, prop ownership/state, geography, screen direction, lighting, physics, audio, dialogue/lip-sync, visible text และข้อห้ามจากทุก shot\n- ห้ามเพิ่มเหตุการณ์ ตัวละคร prop Picture ID บทพูด subtitle logo watermark UI หรือ camera gimmick ที่ไม่มีในข้อมูลต้นฉบับ\n- ห้ามมี citation, Markdown heading, code fence, คำอธิบายภาษาไทย หรือรายงานการตรวจ\n- ส่งเฉพาะ prompt ฉบับสมบูรณ์`;
}

export function finalPrompt(story, shots, prefix = "DY,", visualDirection = story.visualDirection, referenceAssets = {}, generationTarget = "minimax-h3") {
  if (generationTarget === "seedance-2.5") return seedanceFinalPrompt(story, shots, visualDirection, referenceAssets);
  return `สร้าง prompt ภาษาอังกฤษตามโครงสร้างตัวอย่างอย่างเคร่งครัด ข้อมูลทั้งหมดต้องมาจาก STORY, SHOTS, VISUAL_DIRECTION และ REFERENCE_ASSETS เท่านั้น\n\nSTORY:\n${JSON.stringify(story, null, 2)}\nSHOTS:\n${JSON.stringify(shots, null, 2)}\nVISUAL_DIRECTION:\n${JSON.stringify(visualDirection, null, 2)}\nREFERENCE_ASSETS:\n${JSON.stringify(referenceAssets, null, 2)}\n\nข้อกำหนด:\n- บรรทัดแรกต้องเริ่มด้วย ${prefix}subject_definitions:\n- ใช้หัวข้อตามลำดับ: subject_definitions, summary, retention_analysis, detailed_description, overall_soundscape, non_diegetic_music\n- กำหนดทุกตัวละครและสภาพแวดล้อมเป็น <Subject N> เท่านั้น แม้ Subject นั้นจะเป็นสถานที่ ห้ามใช้ <Environment N> หรือรูปแบบอื่น\n- ใช้ <Picture N> ทุกภาพตาม mapping ใน REFERENCE_ASSETS เพื่อกำหนดรูปลักษณ์ของตัวละคร สถานที่ และวัตถุ ห้ามสร้าง Picture ID อื่น ใน subject_definitions ต้องมีบรรทัด mapping แยกสำหรับทุก Picture โดยระบุ assetType, name, linkedSubjects, locationKey/objectKey และ purpose ตามข้อมูลเดิม ห้ามสลับความหมายระหว่าง Picture\n- detailed_description ต้องแบ่ง [Shot N] และตั้งแต่ shot 2 เป็นต้นไป หัวบรรทัดต้องใช้รูปแบบ [Shot N] At 00:05.000 โดยคำนวณจาก startTime จริง ห้ามใช้เพียง (5s)\n- แต่ละ [Shot N] ต้องกล่าวถึง <Picture N> ทุกภาพที่มี shot number นั้นใน usedInShots และห้ามนำ Picture ที่ไม่เกี่ยวข้องมาใช้แทน asset อื่น\n- เขียนแต่ละ [Shot N] เป็นย่อหน้า production prompt ภาษาอังกฤษแบบละเอียดและต่อเนื่อง ห้ามเขียนเป็น bullet list, ตาราง, JSON หรือสรุปสั้น ๆ\n- เปิดย่อหน้าแต่ละ shot ด้วยตำแหน่งกล้อง canonical shotSize มุม perspective ความสูง เลนส์ screen direction องค์ประกอบภาพ และตำแหน่ง Subject พร้อม axis/eyeline เพื่อให้เห็น geography ตั้งแต่เฟรมแรก\n- บรรยาย startState ก่อน แล้วเรียง actionBeats ทีละจังหวะตามเหตุและผล ระบุว่า Subject ใดใช้มือหรือร่างกายส่วนใด เคลื่อนไปทิศไหน สัมผัสวัตถุอะไร วัตถุหรือ Subject ตอบสนองอย่างไร และจบด้วย endState ที่ชัดเจน ห้ามรวมหลาย action เป็นคำกว้างเพียงประโยคเดียว\n- แทรก primaryMovement เพียงชนิดเดียวพร้อม direction, speed และ motivation ณ จังหวะที่เกิดจริง; แทรก rack-focus จาก focus.transition แยกจาก movement และห้ามเปลี่ยน pan/tilt/dolly/zoom เป็นเทคนิคอื่นนอก SHOTS\n- ระบุแสง สี reflection วัสดุ depth of field และการเปลี่ยนแสงที่มองเห็นได้ระหว่าง shot ตาม lighting, composition และ VISUAL_DIRECTION\n- ระบุสีหน้า สายตา ท่าทาง micro-expression ลมหายใจ และ performance cue ที่ทำให้อารมณ์จาก emotion.start ไปถึง emotion.end มองเห็นหรือได้ยินได้จริง\n- บทพูดต้องอยู่ตรงจังหวะการกระทำ ใช้รูปแบบ <Subject N> (S1) ... <d>[English] dialogue</d> โดยเปลี่ยนภาษาและหมายเลขผู้พูดตามข้อมูลจริง พร้อม delivery, lipSync, performance ก่อนคำพูดและ reaction หลังคำพูด\n- ใส่ ambience, sync effects, voice, music และ sound bridge ณ จังหวะที่ได้ยินจริงในย่อหน้า อย่าทิ้งรายละเอียดเสียงทั้งหมดไว้เฉพาะ overall_soundscape\n- ปิดย่อหน้าแต่ละ shot ด้วยภาพสุดท้าย ตำแหน่งและท่าทางของ Subject สภาพวัตถุ อารมณ์ และ transition ที่ส่งต่อไป shot ถัดไป โดยรักษา continuityIn/continuityOut อย่างเคร่งครัด\n- แต่ละ shot ต้องกล่าวถึง <Subject N> ทุกตัวที่อยู่ใน subjects และใช้ <Picture N> ที่เกี่ยวข้องเมื่อเป็นข้อมูลกำหนดรูปลักษณ์ ห้ามแทน Subject ด้วยชื่อหรือสรรพนามเพียงอย่างเดียวจนระบุตัวอ้างอิงไม่ได้\n- เก็บรายละเอียด spatialAnchor, startState, actionBeats ทุกข้อ, endState, camera ทุกช่อง, composition, lighting, dialogue, sound ทุกช่อง, transition, emotion, continuityIn/continuityOut และ negativeConstraints จาก SHOTS ให้ครบ ห้ามย่อ ตัด หรือเพิ่มเหตุการณ์ใหม่\n- negativeConstraints ให้เขียนเป็นข้อจำกัดเชิงบวกในคำบรรยายเมื่อทำได้ และระบุข้อห้ามตรง ๆ เฉพาะสิ่งที่อาจทำให้การ generate ผิด continuity\n- retention_analysis ต้องระบุ shot ที่ subject และ reference image ปรากฏ รวมถึงสิ่งที่ต้องรักษา\n- ต้องสะท้อน VISUAL_DIRECTION ทั้งรูปแบบภาพและ mood อย่างสม่ำเสมอใน subject_definitions, summary และทุก shot โดยระบุผลต่อรูปลักษณ์ตัวละคร ฉาก แสง สี เลนส์ กล้อง และการเคลื่อนไหวเท่าที่เกี่ยวข้อง\n- ห้ามมี Markdown heading หรือ code fence\n- ส่งเฉพาะ prompt ฉบับสมบูรณ์`;
}

export const SYSTEM_PROMPT = "คุณเป็นนักวิเคราะห์บท ผู้กำกับ และผู้วาง shot list สำหรับวิดีโอสั้น ให้ความสำคัญกับความชัดเจน ความต่อเนื่อง ความเป็นไปได้ และเจตนาของผู้ใช้ ออกแบบภาพด้วยภาษาภาพยนตร์ที่ดึงดูดผู้ชม โดยทุก shot ต้องมี attention path, cinematic intent และ visual payoff ที่รับใช้เรื่อง startState/endState ต้องเป็นสิ่งที่มองเห็นในเฟรมของ shot นั้น และใช้ continuityBridge สำหรับสถานะข้าม cut ห้ามบรรยาย motion, action beat หรือบทพูดเดิมซ้ำเต็มเหตุการณ์ในหลาย shot หาก cut on action ให้แบ่งคนละเฟสของ motion และเริ่ม shot ถัดไปจากเฟสถัดไปทันที ทุก action beat ต้องอยู่ในช่วง startOffset/endOffset โดยไม่ซ้อนและต้องทำได้จริงภายในเวลา ห้ามให้ prop เปลี่ยนผู้ถือ ตำแหน่ง หรือสภาพโดยไม่มีเหตุบนจอหรือ continuity อธิบาย reference image ของ object ต้องมีวัตถุหลักชนิดเดียว ห้ามรวมวัตถุคนละชนิดใน Picture เดียว และให้แยก location reference เมื่อแต่ละพื้นที่ต้องจัดเฟรมหรือ exclude ต่างกัน เมื่อนำ shot list ไปเขียน generation prompt ต้องถ่ายทอด cinematicIntent, attentionFocus, visualPayoff, causalLink และจังหวะ action ผ่าน staging, composition, camera, light, performance และ reveal อย่างเป็นธรรมชาติ กำหนดคุณลักษณะถาวรใน subject_definitions เท่านั้น ห้ามเขียนว่า Subject ถือ prop เป็นลักษณะถาวรถ้าไม่ได้ถือในทุก shot";

export function generationSystemPrompt(generationTarget = "minimax-h3") {
  const targetRule = generationTarget === "seedance-2.5"
    ? "คุณกำลังเขียน prompt สำหรับ Seedance 2.5 ต้องใช้ Reference mapping แบบ @ImageN, Timecoded beats และ Global constraints ตามคำสั่ง ห้ามใช้โครงสร้าง DY,subject_definitions"
    : "คุณกำลังเขียน prompt สำหรับ MiniMax H3 ต้องใช้โครงสร้าง DY,subject_definitions, <Subject N>, <Picture N> และรายละเอียดราย Shot ตามคำสั่ง";
  return `${SYSTEM_PROMPT} ${targetRule}`;
}
