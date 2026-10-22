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
6. ระบุกล้องให้ถ่ายได้จริง: lensMm, shotSize, angle, ตำแหน่งสัมพันธ์กับ subject, movement และ focus ห้ามให้กล้องทะลุกำแพง วัตถุ หรือตัวละคร และให้การสั่น/หลบ/แพนเกิดจากเหตุการณ์ในภาพ
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
}\nshotCountRecommendation ต้องประเมินจาก durationSeconds จำนวนการเปลี่ยนข้อมูล/action/emotional beat ความซับซ้อนของฉาก และเวลาที่ต้องใช้ให้ motion อ่านออก ห้ามใช้สูตรตายตัว หาก input.requestedShotCount มีค่า ให้ยังคงเสนอจำนวนที่เหมาะสมอย่างอิสระเพื่อให้ผู้ใช้เปรียบเทียบ\nvisualDirection.source ต้องเป็น explicit เฉพาะเมื่อ brief หรือคำตอบของผู้ใช้ระบุรูปแบบภาพอย่างชัดเจน เช่น ภาพยนตร์, live action, anime, 3D, illustration, documentary หรือ commercial หากไม่พบให้ตั้ง source เป็น missing และ medium/label เป็น null ห้ามเดา และไม่ต้องสร้าง clarificationQuestions สำหรับ visualDirection เพราะ CLI จะถามจากรายการโดยตรง ถามข้อมูลอื่นเฉพาะที่มีผลต่อโครงเรื่องหรือการสร้าง shot จริง ไม่เกิน 7 ข้อ หากอนุมานได้อย่างปลอดภัยให้ระบุเป็นสมมติฐานใน constraints แทนการถาม`;
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
}\nต้องใช้ selectedVisualDirection จาก ANALYSIS เป็นข้อกำหนดด้านภาพของเรื่อง และใช้ selectedCores ทุก Core ตาม role ที่ผู้ใช้เลือก โดยให้ primary เป็นแกนขับเคลื่อนเรื่องและ secondary เป็นแกนสนับสนุน ห้ามแทนด้วย Core อื่น วางจังหวะเรื่องให้รองรับ ANALYSIS.selectedShotCount โดยแต่ละ shot มีหน้าที่ต่างกัน ต้องบอกความสัมพันธ์เหตุและผลชัดเจน ให้จุดเริ่ม กลาง และจบพอดีกับระยะเวลา`;
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
    "spatialAnchor":"ตำแหน่ง subject, เป้าหมาย, อันตราย, ทางเข้าออก และทิศทางในฉาก",
    "startState":"สิ่งที่มองเห็นจริงในเฟรมแรกของ shot นี้",
    "continuityBridge":"อธิบายว่าสถานะจาก endState ก่อนหน้าส่งต่อมายังเฟรมใหม่นี้อย่างไร รวมสิ่งที่ยังเกิดอยู่นอกเฟรม",
    "causalLink":"เหตุจาก shot ก่อน -> ผลใน shot นี้ -> สิ่งที่ setup ให้ shot ถัดไป",
    "action":"สรุปการกระทำหลักที่มองเห็นได้",
    "actionBeats":[{"order":1,"startOffset":0.5,"endOffset":2.0,"action":"การกระทำที่มองเห็นได้","result":"ผลทางกายภาพหรือข้อมูลที่เกิดขึ้น"}],
    "endState":"สิ่งที่มองเห็นจริงในเฟรมสุดท้ายของ shot นี้",
    "camera":{"lensMm":"35mm","shotSize":"medium close-up","angle":"eye level","position":"ตำแหน่งกล้องสัมพันธ์กับ subject และฉาก","movement":"การเคลื่อนกล้องและเหตุผล หรือ locked-off","focus":"subject/ระนาบโฟกัสและการเปลี่ยน focus"},
    "composition":"string",
    "lighting":"string",
    "dialogue":[{"speaker":"Subject 1","language":"English","line":"string","performance":"string"}],
    "sound":{"ambience":"string","syncEffects":["string"],"voice":"string","music":"string","bridge":"เสียงที่ลากเข้า/ออก shot หรือ none"},
    "transition":{"type":"hard cut|match cut|cut on action|whip pan|hold|อื่นๆ","motivation":"เหตุผลจาก action, sound, eyeline หรือข้อมูล"},
    "continuityIn":["string"],
    "continuityOut":["string"],
    "emotion":{"start":"string","end":"string","visibleCue":"สีหน้า ท่าทาง หรือลมหายใจที่มอง/ได้ยินได้"},
    "negativeConstraints":["สิ่งที่ห้ามเกิดเฉพาะ shot นี้"]
  }],
  "continuityChecklist":["กฎ global สำหรับ identity, wardrobe, props, geography, screen direction, lighting และ state changes"],
  "totalDuration":15
}\nข้อกำหนดเพิ่มเติม:\n- เวลา shot แรกต้องเริ่ม 0 แต่ละ shot ต้องต่อกันโดยไม่มีช่องว่างหรือซ้อนกัน และ shot สุดท้ายต้องจบตรง durationSeconds\n- number ต้องเรียงจาก 1 โดยไม่ข้าม และ totalDuration ต้องเท่ากับ durationSeconds ของ STORY\n- จำนวนและความยาว shot ต้องเกิดจาก action และ emotional beat ห้ามเฉลี่ยเวลาเท่ากันโดยไม่มีเหตุผล\n- shot แรกต้องมี storyPhase=hook และช่วงท้ายต้องให้ผลของ climax อ่านได้ชัดก่อนจบ\n- startState ของ shot 2 เป็นต้นไปต้องสอดคล้องกับ endState ของ shot ก่อนหน้า\n- หากไม่มีบทพูดให้ใช้ dialogue เป็น [] หากไม่มีดนตรีให้ sound.music เป็น none\n- ห้ามเพิ่มตัวละคร สถานที่ prop พลัง ความเสียหาย หรือเหตุการณ์ที่ STORY ไม่รองรับ`;
}

export function referencePromptsPrompt(story, shots, existingReferences = [], revision = "") {
  return `${STORY_FRAMEWORK}\n${jsonInstruction}\n\nสร้าง prompt ภาษาอังกฤษสำหรับ generate ภาพอ้างอิงที่จำเป็นต่อวิดีโอนี้ โดยสร้างเฉพาะตัวละคร สถานที่ และวัตถุสำคัญที่ปรากฏจริงใน STORY/SHOTS\nSTORY:\n${JSON.stringify(story, null, 2)}\nSHOTS:\n${JSON.stringify(shots, null, 2)}\nEXISTING_REFERENCES:\n${JSON.stringify(existingReferences, null, 2)}\nREVISION REQUEST:\n${revision || "ไม่มี"}\n\nใช้ schema นี้:\n{
  "projectTitle":"string",
  "globalStyle":{"visualDirection":"string","mood":"string","styleLock":"ข้อกำหนดที่ทุกภาพต้องใช้ร่วมกัน"},
  "existingReferences":[{"pictureId":"Picture 1","description":"string"}],
  "assets":[{
    "pictureId":"Picture 2",
    "assetType":"character|location|object",
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
}\nข้อกำหนด:\n- รักษา visualDirection, mood, ยุคสมัย, palette และระดับความสมจริงจาก STORY อย่างเคร่งครัด\n- existingReferences ต้องคง Picture ID ตามที่ได้รับ ห้ามสร้าง prompt ซ้ำให้ภาพที่มีอยู่แล้ว\n- assets ใหม่ต้องเริ่มหมายเลข Picture ต่อจาก existingReferences และห้ามซ้ำกัน\n- character: สร้าง character sheet บนพื้นหลังเรียบ มี full-body front, three-quarter, side, back, facial expressions, เสื้อผ้า และอุปกรณ์ประจำตัว โดยห้ามใส่ตัวละครอื่น\n- location: สร้าง environment reference ที่ไม่มีตัวละคร มี wide establishing view และรายละเอียดสถาปัตยกรรม แสง วัสดุ สี และจุดที่ใช้จัดฉาก\n- object: สร้างเฉพาะวัตถุสำคัญต่อการกระทำหรือ continuity แยกวัตถุบนพื้นหลังเรียบ พร้อมหลายมุมและรายละเอียดวัสดุ ห้ามสร้างวัตถุทั่วไปที่ไม่ต้องรักษารูปลักษณ์\n- prompt ทุกข้อเป็นภาษาอังกฤษ ใช้คำบรรยายเชิงภาพที่ generate ได้จริง และห้ามใส่ชื่อศิลปินที่ยังมีชีวิต\n- linkedSubjects และ usedInShots ต้องตรงกับ STORY/SHOTS\n- หากไม่มีวัตถุสำคัญ ไม่ต้องสร้าง assetType object`;
}

export function finalPrompt(story, shots, prefix = "DY,", visualDirection = story.visualDirection, referenceAssets = {}) {
  return `สร้าง prompt ภาษาอังกฤษตามโครงสร้างตัวอย่างอย่างเคร่งครัด ข้อมูลทั้งหมดต้องมาจาก STORY, SHOTS, VISUAL_DIRECTION และ REFERENCE_ASSETS เท่านั้น\n\nSTORY:\n${JSON.stringify(story, null, 2)}\nSHOTS:\n${JSON.stringify(shots, null, 2)}\nVISUAL_DIRECTION:\n${JSON.stringify(visualDirection, null, 2)}\nREFERENCE_ASSETS:\n${JSON.stringify(referenceAssets, null, 2)}\n\nข้อกำหนด:\n- บรรทัดแรกต้องเริ่มด้วย ${prefix}subject_definitions:\n- ใช้หัวข้อตามลำดับ: subject_definitions, summary, retention_analysis, detailed_description, overall_soundscape, non_diegetic_music\n- กำหนดทุกตัวละครและสภาพแวดล้อมเป็น <Subject N> เท่านั้น แม้ Subject นั้นจะเป็นสถานที่ ห้ามใช้ <Environment N> หรือรูปแบบอื่น\n- ใช้ <Picture N> ทุกภาพตาม mapping ใน REFERENCE_ASSETS เพื่อกำหนดรูปลักษณ์ของตัวละคร สถานที่ และวัตถุ ห้ามสร้าง Picture ID อื่น\n- detailed_description ต้องแบ่ง [Shot N] และตั้งแต่ shot 2 เป็นต้นไป หัวบรรทัดต้องใช้รูปแบบ [Shot N] At 00:05.000 โดยคำนวณจาก startTime จริง ห้ามใช้เพียง (5s)\n- เขียนแต่ละ [Shot N] เป็นย่อหน้า production prompt ภาษาอังกฤษแบบละเอียดและต่อเนื่อง ห้ามเขียนเป็น bullet list, ตาราง, JSON หรือสรุปสั้น ๆ\n- เปิดย่อหน้าแต่ละ shot ด้วยตำแหน่งกล้อง ขนาดภาพ มุม เลนส์ องค์ประกอบภาพ และตำแหน่งของ Subject ในฉาก เพื่อให้เห็น geography ตั้งแต่เฟรมแรก\n- บรรยาย startState ก่อน แล้วเรียง actionBeats ทีละจังหวะตามเหตุและผล ระบุว่า Subject ใดใช้มือหรือร่างกายส่วนใด เคลื่อนไปทิศไหน สัมผัสวัตถุอะไร วัตถุหรือ Subject ตอบสนองอย่างไร และจบด้วย endState ที่ชัดเจน ห้ามรวมหลาย action เป็นคำกว้างเพียงประโยคเดียว\n- แทรก movement และ focus ของกล้อง ณ จังหวะที่เกิดจริง รวมถึงการเปลี่ยน framing, rack focus, push-in, pan, tilt, handheld response หรือ locked-off hold ตามข้อมูลใน SHOTS ห้ามเพียงลิสต์ชื่อเทคนิคกล้อง\n- ระบุแสง สี reflection วัสดุ depth of field และการเปลี่ยนแสงที่มองเห็นได้ระหว่าง shot ตาม lighting, composition และ VISUAL_DIRECTION\n- ระบุสีหน้า สายตา ท่าทาง micro-expression ลมหายใจ และ performance cue ที่ทำให้อารมณ์จาก emotion.start ไปถึง emotion.end มองเห็นหรือได้ยินได้จริง\n- บทพูดต้องอยู่ตรงจังหวะการกระทำ ใช้รูปแบบ <Subject N> (S1) ... <d>[English] dialogue</d> โดยเปลี่ยนภาษาและหมายเลขผู้พูดตามข้อมูลจริง พร้อม performance ก่อนคำพูดและ reaction หลังคำพูด\n- ใส่ ambience, sync effects, voice, music และ sound bridge ณ จังหวะที่ได้ยินจริงในย่อหน้า อย่าทิ้งรายละเอียดเสียงทั้งหมดไว้เฉพาะ overall_soundscape\n- ปิดย่อหน้าแต่ละ shot ด้วยภาพสุดท้าย ตำแหน่งและท่าทางของ Subject สภาพวัตถุ อารมณ์ และ transition ที่ส่งต่อไป shot ถัดไป โดยรักษา continuityIn/continuityOut อย่างเคร่งครัด\n- แต่ละ shot ต้องกล่าวถึง <Subject N> ทุกตัวที่อยู่ใน subjects และใช้ <Picture N> ที่เกี่ยวข้องเมื่อเป็นข้อมูลกำหนดรูปลักษณ์ ห้ามแทน Subject ด้วยชื่อหรือสรรพนามเพียงอย่างเดียวจนระบุตัวอ้างอิงไม่ได้\n- เก็บรายละเอียด spatialAnchor, startState, actionBeats ทุกข้อ, endState, camera ทุกช่อง, composition, lighting, dialogue, sound ทุกช่อง, transition, emotion, continuityIn/continuityOut และ negativeConstraints จาก SHOTS ให้ครบ ห้ามย่อ ตัด หรือเพิ่มเหตุการณ์ใหม่\n- negativeConstraints ให้เขียนเป็นข้อจำกัดเชิงบวกในคำบรรยายเมื่อทำได้ และระบุข้อห้ามตรง ๆ เฉพาะสิ่งที่อาจทำให้การ generate ผิด continuity\n- retention_analysis ต้องระบุ shot ที่ subject และ reference image ปรากฏ รวมถึงสิ่งที่ต้องรักษา\n- ต้องสะท้อน VISUAL_DIRECTION ทั้งรูปแบบภาพและ mood อย่างสม่ำเสมอใน subject_definitions, summary และทุก shot โดยระบุผลต่อรูปลักษณ์ตัวละคร ฉาก แสง สี เลนส์ กล้อง และการเคลื่อนไหวเท่าที่เกี่ยวข้อง\n- ห้ามมี Markdown heading หรือ code fence\n- ส่งเฉพาะ prompt ฉบับสมบูรณ์`;
}

export const SYSTEM_PROMPT = "คุณเป็นนักวิเคราะห์บท ผู้กำกับ และผู้วาง shot list สำหรับวิดีโอสั้น ให้ความสำคัญกับความชัดเจน ความต่อเนื่อง ความเป็นไปได้ และเจตนาของผู้ใช้ ออกแบบภาพด้วยภาษาภาพยนตร์ที่ดึงดูดผู้ชม โดยทุก shot ต้องมี attention path, cinematic intent และ visual payoff ที่รับใช้เรื่อง startState/endState ต้องเป็นสิ่งที่มองเห็นในเฟรมของ shot นั้น และใช้ continuityBridge สำหรับสถานะข้าม cut ห้ามบรรยาย motion, action beat หรือบทพูดเดิมซ้ำเต็มเหตุการณ์ในหลาย shot หาก cut on action ให้แบ่งคนละเฟสของ motion และเริ่ม shot ถัดไปจากเฟสถัดไปทันที ทุก action beat ต้องอยู่ในช่วง startOffset/endOffset โดยไม่ซ้อนและต้องทำได้จริงภายในเวลา ห้ามให้ prop เปลี่ยนผู้ถือ ตำแหน่ง หรือสภาพโดยไม่มีเหตุบนจอหรือ continuity อธิบาย reference image ของ object ต้องมีวัตถุหลักชนิดเดียว ห้ามรวมวัตถุคนละชนิดใน Picture เดียว และให้แยก location reference เมื่อแต่ละพื้นที่ต้องจัดเฟรมหรือ exclude ต่างกัน เมื่อนำ shot list ไปเขียน generation prompt ต้องถ่ายทอด cinematicIntent, attentionFocus, visualPayoff, causalLink และจังหวะ action ผ่าน staging, composition, camera, light, performance และ reveal อย่างเป็นธรรมชาติ กำหนดคุณลักษณะถาวรใน subject_definitions เท่านั้น ห้ามเขียนว่า Subject ถือ prop เป็นลักษณะถาวรถ้าไม่ได้ถือในทุก shot";
