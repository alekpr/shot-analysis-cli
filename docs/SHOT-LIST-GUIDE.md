# หลักการสร้าง Production Shot List

เอกสารนี้สรุปหลักการที่ใช้ใน `shotsPrompt`, `validateShots` และ `renderShots` หลังศึกษาตัวอย่างวิดีโอ 30 วินาทีจำนวน 26 ชุดจากคลัง ZERO TO HERO / VERAMINE รวม 110 หน้า ตัวอย่างมีตั้งแต่ดราม่า การช่วยเหลือ การไล่ล่า แอ็กชัน และงาน VFX โดยมีจำนวน shot ตั้งแต่ประมาณ 8 ถึง 35 shot ต่อคลิป จำนวนที่เหมาะสมจึงควรประเมินจากเนื้อหา หรือใช้จำนวนที่ผู้ใช้ยืนยัน แทนการใช้สูตรตายตัวตามความยาวเพียงอย่างเดียว

ก่อนสร้างเรื่อง LLM จะเสนอ `minimum`, `recommended`, `maximum` และเหตุผลจากจำนวน action beat, emotional beat, ความซับซ้อนของฉาก และเวลาที่ต้องใช้ให้ผู้ชมอ่านภาพ ผู้ใช้สามารถระบุจำนวนเองตั้งแต่รับ brief หรือเว้นว่างแล้วใช้ค่าที่แนะนำ จำนวนที่ยืนยันจะถูกตรวจซ้ำกับจำนวนรายการใน shot list

## Cinematic engagement

ทุก shot ต้องกำหนด `cinematicIntent`, `attentionFocus` และ `visualPayoff` เพื่ออธิบายว่าภาพดึงสายตาอย่างไร ผู้ชมเห็นอะไรเป็นอันดับแรก สิ่งใดค่อยเปิดเผย และเฟรมท้ายให้อารมณ์หรือข้อมูลอะไร กล้องและการเปลี่ยนขนาดภาพต้องมีแรงจูงใจจาก action, eyeline, sound, reveal หรือ emotional shift พร้อมสร้าง visual rhythm โดยไม่ใช้การตัดถี่ กล้องสั่น หรือมุมหวือหวาแทนการเล่าเรื่องที่ชัดเจน

## หลักการสำคัญ

1. **เริ่มจากเหตุการณ์ที่อ่านได้ทันที** — 1–3 วินาทีแรกควรทำให้เข้าใจ subject, ปัญหา และแรงกดดันหลัก โดยเริ่มกลาง action ได้เมื่อ geography ยังชัดเจน
2. **แบ่งตาม beat ไม่ใช่หารเวลาเท่ากัน** — เปลี่ยน shot เมื่อข้อมูล อารมณ์ ตำแหน่ง การกระทำ หรือมุมมองเปลี่ยน จังหวะแอ็กชันอาจสั้นกว่า 1 วินาที ส่วน reaction หรือ payoff อาจต้องใช้หลายวินาที
3. **สร้าง geography ก่อน action ซับซ้อน** — บอกตำแหน่ง subject, อันตราย, เป้าหมาย, ทางเข้าออก และระยะห่าง แล้วรักษา screen direction ข้าม shot
4. **เหตุเกิดก่อนผล** — ต้องเห็น contact ก่อน reaction, การปล่อยก่อนของตก, การกดปุ่มก่อนกลไกทำงาน และการเปลี่ยน state ก่อนนำ state ใหม่ไปใช้
5. **แยกสิ่งที่เห็นออกจากข้อมูลที่ส่งต่อ** — `startState` และ `endState` อธิบายเฉพาะสิ่งที่มองเห็นในเฟรมแรกและเฟรมสุดท้าย ส่วน `continuityBridge` บอกว่าอะไรถูกส่งต่อ เปลี่ยนไป หรืออยู่นอกเฟรมเมื่อมี hard cut หรือเปลี่ยนสถานที่
6. **กล้องต้องมีตำแหน่งและเหตุผล** — ระบุ lens, shot size, angle, position, movement และ focus กล้องสั่น หลบ หรือ whip pan เมื่อมีเหตุการณ์ในฉากรองรับ และห้ามเคลื่อนผ่านผนังหรือ subject
7. **เฟรมต้องอธิบายความสัมพันธ์** — เมื่อการเอาตัวรอดหรือ action ต้องอาศัยพื้นที่ ควรเห็น subject, อันตราย และเป้าหมายในเฟรมเดียวกัน หรือมี spatial cue จาก shot ก่อนหน้า
8. **เสียงเป็นส่วนหนึ่งของจังหวะ** — แยก ambience, sync effects, voice, music และ sound bridge เพื่อให้ contact, ฝีเท้า ลมหายใจ หรือเสียงนอกจอสัมพันธ์กับภาพ
9. **ติดตาม continuity เป็น state** — ตรวจ identity, wardrobe, มือที่ถือ prop, สภาพ prop, ตำแหน่ง, แสง, ความเปียก/เสียหาย, อารมณ์ และสิ่งที่ออกจากฉาก
10. **transition ต้องมีแรงจูงใจ** — ใช้ action, sound, eyeline หรือการเปิดเผยข้อมูลเป็นเหตุผลของ cut และระบุข้อห้ามราย shot เฉพาะสิ่งที่มีความเสี่ยงจริง
11. **ทุก action มีช่วงเวลาของตัวเอง** — แต่ละรายการใน `actionBeats` ต้องมี `startOffset` และ `endOffset` อยู่ภายใน shot เรียงตามเวลา และไม่ซ้อนกัน เพื่อป้องกันคำสั่ง motion หลายอย่างเกิดพร้อมกันโดยไม่ตั้งใจ
12. **ติดตามผู้แสดงและ prop ตามภาพจริง** — ผู้ที่มองเห็นต้องอยู่ใน `subjects` ผู้ที่มีผลต่อเหตุการณ์แต่ยังอยู่นอกเฟรมต้องอยู่ใน `offscreenSubjects` และการหยิบ ส่ง ปล่อย หรือเปลี่ยนสภาพ prop ต้องเกิดขึ้นใน action หรือ continuity ก่อนนำ state ใหม่ไปใช้
13. **เชื่อมเหตุและผลข้าม shot** — `causalLink` ระบุเหตุจาก shot ก่อน ผลที่เกิดใน shot นี้ หรือสิ่งที่ shot นี้เตรียมไว้สำหรับ shot ถัดไป เพื่อไม่ให้ payoff เกิดขึ้นโดยไม่มี setup
14. **หนึ่ง Object reference ต่อหนึ่งชนิดวัตถุ** — ภาพอ้างอิง Object แต่ละภาพใช้ `objectKey` เดียว ไม่รวมวัตถุคนละชนิดใน Picture เดียว และควรแยก Location reference เมื่อ framing หรือสิ่งที่ต้องห้ามต่างกัน

## โครงสร้างข้อมูลต่อ Shot

| กลุ่ม | Fields | จุดประสงค์ |
| --- | --- | --- |
| เวลาและเรื่อง | `number`, `startTime`, `endTime`, `duration`, `beat`, `storyPhase`, `objective` | ล็อกจังหวะและหน้าที่เชิงเรื่อง |
| พื้นที่ | `subjects`, `offscreenSubjects`, `setting`, `spatialAnchor` | แยกผู้ที่เห็นในเฟรม ผู้ที่อยู่นอกเฟรม และทำให้ geography อ่านได้ |
| การกระทำ | `startState`, `action`, `actionBeats`, `endState`, `causalLink` | บังคับลำดับเวลา เหตุ→ผล และ state ที่มองเห็น |
| ภาพ | `camera`, `composition`, `lighting` | ทำให้คำสั่งกล้องถ่ายหรือ generate ได้จริง |
| เสียง | `dialogue`, `sound` | sync คำพูด เสียงสัมผัส ambience และดนตรี |
| การส่งต่อ | `transition`, `continuityBridge`, `continuityIn`, `continuityOut` | อธิบายการส่งต่อข้าม cut โดยไม่บังคับให้คนหรือสถานที่ที่ไม่อยู่ในเฟรมปรากฏใน state |
| การแสดง | `emotion` | แปลงอารมณ์เป็น cue ที่มองเห็นหรือได้ยิน |
| ข้อห้าม | `negativeConstraints` | ป้องกันความผิดพลาดเฉพาะ shot |

## Validation Gates

- Shot number เรียงจาก 1 โดยไม่ข้าม
- เวลาเริ่มและจบต่อกัน ไม่มีช่องว่างหรือซ้อนกัน
- `duration` ตรงกับผลต่างของ `startTime` และ `endTime`
- Shot สุดท้ายจบตรงความยาวเรื่อง และ `totalDuration` ตรงกับ `durationSeconds`
- ทุก shot มี spatial anchor, visible start/end state, causal link, action beats, camera specification, sound, transition, continuity และ visible emotion cue
- Shot ที่สองเป็นต้นไปมี `continuityBridge` และไม่บังคับให้ `startState` ซ้ำข้อความจาก `endState` ของ shot ก่อน
- `actionBeats` เรียงลำดับ มีทั้ง action กับผลที่เกิดขึ้น และมีช่วงเวลาที่ไม่ซ้อนกันภายใน duration
- Subject ที่ปรากฏใน generation prompt ต้องถูกประกาศเป็น `subjects` หรือ `offscreenSubjects` ของ shot นั้น
- Object reference ทุกภาพมี `objectKey` ที่ไม่ซ้ำกัน
- Shot list มี global continuity checklist

Validator ตรวจความครบของโครงสร้าง ส่วนผู้ใช้ยังเป็นผู้ตัดสินคุณภาพทางความคิดและความเหมาะสมของแต่ละ shot ในขั้น review
