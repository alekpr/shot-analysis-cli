# หลักการสร้าง Production Shot List

เอกสารนี้สรุปหลักการที่ใช้ใน `shotsPrompt`, `validateShots` และ `renderShots` หลังศึกษาตัวอย่างวิดีโอ 30 วินาทีจำนวน 26 ชุดจากคลัง ZERO TO HERO / VERAMINE รวม 110 หน้า ตัวอย่างมีตั้งแต่ดราม่า การช่วยเหลือ การไล่ล่า แอ็กชัน และงาน VFX โดยมีจำนวน shot ตั้งแต่ประมาณ 8 ถึง 35 shot ต่อคลิป จำนวนที่เหมาะสมจึงควรประเมินจากเนื้อหา หรือใช้จำนวนที่ผู้ใช้ยืนยัน แทนการใช้สูตรตายตัวตามความยาวเพียงอย่างเดียว

ก่อนสร้างเรื่อง LLM จะเสนอ `minimum`, `recommended`, `maximum` และเหตุผลจากจำนวน action beat, emotional beat, ความซับซ้อนของฉาก และเวลาที่ต้องใช้ให้ผู้ชมอ่านภาพ ผู้ใช้สามารถระบุจำนวนเองตั้งแต่รับ brief หรือเว้นว่างแล้วใช้ค่าที่แนะนำ จำนวนที่ยืนยันจะถูกตรวจซ้ำกับจำนวนรายการใน shot list

## หลักการสำคัญ

1. **เริ่มจากเหตุการณ์ที่อ่านได้ทันที** — 1–3 วินาทีแรกควรทำให้เข้าใจ subject, ปัญหา และแรงกดดันหลัก โดยเริ่มกลาง action ได้เมื่อ geography ยังชัดเจน
2. **แบ่งตาม beat ไม่ใช่หารเวลาเท่ากัน** — เปลี่ยน shot เมื่อข้อมูล อารมณ์ ตำแหน่ง การกระทำ หรือมุมมองเปลี่ยน จังหวะแอ็กชันอาจสั้นกว่า 1 วินาที ส่วน reaction หรือ payoff อาจต้องใช้หลายวินาที
3. **สร้าง geography ก่อน action ซับซ้อน** — บอกตำแหน่ง subject, อันตราย, เป้าหมาย, ทางเข้าออก และระยะห่าง แล้วรักษา screen direction ข้าม shot
4. **เหตุเกิดก่อนผล** — ต้องเห็น contact ก่อน reaction, การปล่อยก่อนของตก, การกดปุ่มก่อนกลไกทำงาน และการเปลี่ยน state ก่อนนำ state ใหม่ไปใช้
5. **หนึ่ง shot มี state ที่ส่งต่อกันได้** — `startState` รับจาก shot ก่อน, `actionBeats` บอกขั้นตอนที่มองเห็นได้ และ `endState` เป็นข้อมูลตั้งต้นของ shot ถัดไป
6. **กล้องต้องมีตำแหน่งและเหตุผล** — ระบุ lens, shot size, angle, position, movement และ focus กล้องสั่น หลบ หรือ whip pan เมื่อมีเหตุการณ์ในฉากรองรับ และห้ามเคลื่อนผ่านผนังหรือ subject
7. **เฟรมต้องอธิบายความสัมพันธ์** — เมื่อการเอาตัวรอดหรือ action ต้องอาศัยพื้นที่ ควรเห็น subject, อันตราย และเป้าหมายในเฟรมเดียวกัน หรือมี spatial cue จาก shot ก่อนหน้า
8. **เสียงเป็นส่วนหนึ่งของจังหวะ** — แยก ambience, sync effects, voice, music และ sound bridge เพื่อให้ contact, ฝีเท้า ลมหายใจ หรือเสียงนอกจอสัมพันธ์กับภาพ
9. **ติดตาม continuity เป็น state** — ตรวจ identity, wardrobe, มือที่ถือ prop, สภาพ prop, ตำแหน่ง, แสง, ความเปียก/เสียหาย, อารมณ์ และสิ่งที่ออกจากฉาก
10. **transition ต้องมีแรงจูงใจ** — ใช้ action, sound, eyeline หรือการเปิดเผยข้อมูลเป็นเหตุผลของ cut และระบุข้อห้ามราย shot เฉพาะสิ่งที่มีความเสี่ยงจริง

## โครงสร้างข้อมูลต่อ Shot

| กลุ่ม | Fields | จุดประสงค์ |
| --- | --- | --- |
| เวลาและเรื่อง | `number`, `startTime`, `endTime`, `duration`, `beat`, `storyPhase`, `objective` | ล็อกจังหวะและหน้าที่เชิงเรื่อง |
| พื้นที่ | `subjects`, `setting`, `spatialAnchor` | ทำให้ geography และทิศทางอ่านได้ |
| การกระทำ | `startState`, `action`, `actionBeats`, `endState` | บังคับเหตุ→ผลและ state handoff |
| ภาพ | `camera`, `composition`, `lighting` | ทำให้คำสั่งกล้องถ่ายหรือ generate ได้จริง |
| เสียง | `dialogue`, `sound` | sync คำพูด เสียงสัมผัส ambience และดนตรี |
| การส่งต่อ | `transition`, `continuityIn`, `continuityOut` | รักษาความต่อเนื่องข้าม cut |
| การแสดง | `emotion` | แปลงอารมณ์เป็น cue ที่มองเห็นหรือได้ยิน |
| ข้อห้าม | `negativeConstraints` | ป้องกันความผิดพลาดเฉพาะ shot |

## Validation Gates

- Shot number เรียงจาก 1 โดยไม่ข้าม
- เวลาเริ่มและจบต่อกัน ไม่มีช่องว่างหรือซ้อนกัน
- `duration` ตรงกับผลต่างของ `startTime` และ `endTime`
- Shot สุดท้ายจบตรงความยาวเรื่อง และ `totalDuration` ตรงกับ `durationSeconds`
- ทุก shot มี spatial anchor, start/end state, action beats, camera specification, sound, transition, continuity และ visible emotion cue
- `actionBeats` เรียงลำดับและมีทั้ง action กับผลที่เกิดขึ้น
- Shot list มี global continuity checklist

Validator ตรวจความครบของโครงสร้าง ส่วนผู้ใช้ยังเป็นผู้ตัดสินคุณภาพทางความคิดและความเหมาะสมของแต่ละ shot ในขั้น review
