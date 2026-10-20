# แผนพัฒนา shot-analysis-cli

## เป้าหมาย

สร้าง CLI ที่เปลี่ยนความคิดเริ่มต้นของผู้ใช้ให้เป็นเอกสารที่ตรวจสอบและอนุมัติได้ตามลำดับ:

1. Brief และข้อมูลตั้งต้น
2. การวิเคราะห์ความต้องการ
3. โครงเรื่อง
4. Shot list ที่มีเวลาและ continuity ครบ
5. Generation prompt ตามแม่แบบ `subject_definitions` ถึง `non_diegetic_music`

## Workflow

```text
User brief
   ↓
LLM analysis ── ข้อมูลไม่พอ ──→ Clarifying questions ──┐
   ↑                                                   │
   └───────────────────────────────────────────────────┘
   ↓
Visual direction → ถ้าไม่ระบุ ให้เลือก Style และ Mood
   ↓
Core checkbox (1–3) → Select Primary Core
   ↓
Story draft → User approve/revise
   ↓
Shot list → Timing/continuity validation → User approve/revise
   ↓
Reference image prompts → Character / Location / Object → User approve/revise
   ↓
Final prompt → Structure validation → Save artifacts
```

## ขอบเขตเวอร์ชัน 0.1

- Node.js 20.17+ และใช้ `@inquirer/prompts` สำหรับหน้าจอเลือกแบบ interactive
- รองรับ Gemini, Anthropic Claude และ DeepSeek ผ่าน REST API
- เก็บ provider/model/prompt prefix ใน settings ส่วน API key อ่านจาก environment variable
- ถามข้อมูลเพิ่มเติมได้สูงสุด 3 รอบ
- ตรวจรูปแบบภาพจาก brief และถามผู้ใช้จากรายการเมื่อยังไม่ระบุ พร้อมรับ mood/โทนเพิ่มเติม
- ให้ผู้ใช้เลือก Core 1–3 รายการจากรายการที่ LLM เรียงแนะนำ และกำหนด Primary Core
- สร้าง prompt สำหรับ character sheets, locations และ continuity objects พร้อม Picture ID ที่ไม่ซ้ำกับ reference เดิม
- อนุมัติหรือขอแก้โครงเรื่องและ shot list ได้
- ตรวจเวลา shot ว่าต่อเนื่องและรวมตรงกับความยาวคลิป
- บันทึก session และ error ล่าสุดเพื่อใช้ตรวจสถานะและ resume
- คำสั่ง `resume` ทำงานต่อจาก checkpoint ล่าสุดและ retry เฉพาะขั้นที่ยังไม่สำเร็จ

## โครงสร้างข้อมูล

เอกสารของแต่ละงานอยู่ในโฟลเดอร์เดียวกัน:

- `00-brief.md`
- `01-analysis.md`
- `02-story.md`
- `03-shots.md`
- `04-reference-image-prompts.md`
- `05-generation-prompt.txt`
- `.shot-analysis/session.json`

## แผนรุ่นต่อไป

### 0.2

- เปิด editor ที่ผู้ใช้เลือกจาก CLI
- JSON Schema แบบ strict สำหรับ provider ที่รองรับ
- streaming response และ retry/backoff เมื่อ API จำกัดอัตรา

### 0.3

- รับรูปภาพและวิดีโออ้างอิง พร้อมตรวจ metadata
- export CSV/JSON สำหรับ production pipeline
- template สำหรับประเภทคลิป เช่น drama, product, action, educational
- cost/token report ต่อโปรเจกต์

### 1.0

- plugin interface สำหรับเพิ่ม LLM provider และ prompt exporter
- regression evaluation สำหรับคุณภาพ story/shot continuity
- automated migration ของ session schema
