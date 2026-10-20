# shot-analysis-cli

CLI สำหรับเปลี่ยน brief ของคลิปให้เป็นโครงเรื่อง, shot list และ generation prompt ที่ผู้ใช้ตรวจและอนุมัติทีละขั้น รองรับ Gemini, Claude และ DeepSeek

## ความต้องการ

- Node.js 20.17 ขึ้นไป
- API key ของ provider ที่เลือก

## ติดตั้งในเครื่อง

```bash
npm link
shot-analysis config
```

CLI จะเก็บเฉพาะชื่อ provider, model และชื่อ environment variable ที่ `~/.config/shot-analysis-cli/settings.json` ส่วน API key ใส่ได้ในไฟล์ `.env` ที่ root ของโปรเจกต์:

```bash
SHOT_ANALYSIS_PROVIDER=gemini

GEMINI_MODEL=gemini-3.5-flash
ANTHROPIC_MODEL=claude-sonnet-5-5
DEEPSEEK_MODEL=deepseek-chat

GEMINI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
```

เปลี่ยน `SHOT_ANALYSIS_PROVIDER` เป็น `gemini`, `anthropic` หรือ `deepseek` เพื่อเลือก provider ค่า model ของ provider นั้นจะถูกอ่านจากตัวแปร `*_MODEL` ที่ตรงกัน ค่าใน `.env` มีลำดับความสำคัญเหนือ settings ที่สร้างด้วยคำสั่ง `config`

CLI โหลด `.env` ให้อัตโนมัติตามลำดับต่อไปนี้ โดยค่าที่พบก่อนมีลำดับความสำคัญสูงกว่า:

1. `.env` ที่ใกล้ที่สุดจากโฟลเดอร์ที่เรียกคำสั่งขึ้นไปยังโฟลเดอร์แม่
2. `~/.config/shot-analysis-cli/.env` สำหรับใช้ร่วมกันทุกโปรเจกต์บนเครื่อง
3. `.env` ใน root ของแพ็กเกจ เหมาะกับการติดตั้งแบบ `npm link`

Environment variable ที่ export ไว้ใน shell มีลำดับความสำคัญสูงสุด ไฟล์ `.env` ในโปรเจกต์นี้ถูกกันออกจาก Git แล้ว และดูแม่แบบได้ที่ [`.env.example`](./.env.example) หากตั้งค่าใน `.env` ครบ ไม่จำเป็นต้องรัน `shot-analysis config`

หากติดตั้ง CLI แบบ global ด้วย `npm install -g` แนะนำให้คัดลอก `.env.example` ไปเป็น `~/.config/shot-analysis-cli/.env` เพราะตัวจัดการแพ็กเกจจะไม่คัดลอก `.env` ส่วนตัวจาก repository ไปยัง global package

## เริ่มงานใหม่

```bash
shot-analysis new
```

อ่าน brief จากไฟล์และกำหนดโฟลเดอร์ผลลัพธ์ได้:

```bash
shot-analysis new --brief ./idea.md --output ./my-clip
```

ขั้นตอน interactive จะทำงานตามลำดับ:

1. รับ brief และข้อมูลพื้นฐาน
2. วิเคราะห์และถามข้อมูลที่จำเป็นเพิ่มเติม
3. หาก brief ไม่ได้ระบุรูปแบบภาพ ระบบจะให้เลือก Cinematic, Anime, 3D, Illustration, Documentary, Commercial หรือกำหนดเอง พร้อมระบุ mood เพิ่มเติม
4. แสดงรายการ Core แบบ checkbox ให้เลือก 1–3 รายการ แล้วกำหนด Primary Core
5. สร้าง `02-story.md` ให้ผู้ใช้อนุมัติหรือขอแก้ไข
6. สร้าง `03-shots.md` และตรวจเวลา/continuity
7. เมื่อผู้ใช้อนุมัติ จึงสร้าง `04-generation-prompt.txt` ซึ่งต้องมีรูปแบบภาพและ mood ที่เลือก

ในหน้าเลือก Core ใช้ปุ่มลูกศรขึ้น/ลงเพื่อเลื่อน, `Space` เพื่อเลือกหรือยกเลิก และ `Enter` เพื่อยืนยัน รายการที่ LLM แนะนำจะแสดงด้านบนพร้อมเครื่องหมาย `★ แนะนำ` และสามารถเลือก `กำหนด Core เอง` ได้

## ดูสถานะ

```bash
shot-analysis status ./my-clip
```

## ไฟล์ความรู้

- [แผนการพัฒนา](./docs/PLAN.md)

## ตรวจสอบโค้ด

```bash
npm run check
npm test
```
