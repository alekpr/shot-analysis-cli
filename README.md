# shot-analysis-cli

CLI สำหรับเปลี่ยน brief ของคลิปให้เป็นโครงเรื่อง, shot list, prompt สำหรับสร้างภาพอ้างอิง และ generation prompt ฉบับสุดท้าย ผู้ใช้สามารถตรวจ อนุมัติ หรือขอแก้ไขผลลัพธ์ในแต่ละขั้นได้ รองรับ Google Gemini, Anthropic Claude และ DeepSeek

## ความสามารถ

- รับ brief จากการพิมพ์ใน Terminal หรือไฟล์ข้อความ
- วิเคราะห์ข้อมูลที่ขาดและถามผู้ใช้เพิ่มเติม
- เลือกรูปแบบภาพ เช่น Cinematic, Anime, 3D, Illustration, Documentary และ Commercial
- กำหนด mood และเลือก Core หลักของเรื่องผ่านรายการใน CLI
- สร้างและตรวจโครงเรื่องกับ production shot list ที่ระบุ geography, action beats, กล้อง, เสียง และ continuity ก่อนสร้าง prompt
- สร้าง prompt สำหรับ Character sheets, Locations และ Objects พร้อม Picture ID
- บันทึก checkpoint และทำงานต่อด้วย `resume` เมื่อหยุดหรือเกิดข้อผิดพลาด
- ตั้ง provider, model และ API key ผ่าน `.env` หรือคำสั่ง `config`

## ความต้องการ

- Node.js 20.17 ขึ้นไป
- API key ของ provider ที่ต้องการใช้
- อินเทอร์เน็ตสำหรับเรียก LLM API

ตรวจสอบ Node.js:

```bash
node --version
npm --version
```

## ติดตั้ง

Clone repository และติดตั้ง dependencies:

```bash
git clone https://github.com/alekpr/shot-analysis-cli.git
cd shot-analysis-cli
npm install
npm link
```

หลัง `npm link` สามารถเรียกคำสั่ง `shot-analysis` ได้จากทุกโฟลเดอร์ในเครื่อง:

```bash
shot-analysis --help
```

หากไม่ต้องการ `npm link` ให้เรียกผ่าน npm ภายใน repository:

```bash
npm start -- --help
npm start -- new
```

## Quick start

1. สร้าง `.env` จากไฟล์ตัวอย่าง

   ```bash
   cp .env.example .env
   ```

2. ใส่ provider, model และ API key ที่ต้องการใน `.env`

   ```dotenv
   SHOT_ANALYSIS_PROVIDER=gemini
   GEMINI_MODEL=gemini-3.5-flash
   GEMINI_API_KEY=your_key_here
   ```

3. เริ่มสร้างโปรเจกต์

   ```bash
   shot-analysis new
   ```

4. ตรวจเอกสารที่ CLI สร้าง แล้วเลือกอนุมัติ ขอแก้ไข หรือหยุดไว้เพื่อกลับมาทำต่อ

## ตั้งค่า LLM

### ตั้งค่าผ่าน `.env`

ตัวอย่างที่รองรับทุก provider:

```dotenv
SHOT_ANALYSIS_PROVIDER=gemini

GEMINI_MODEL=gemini-3.5-flash
ANTHROPIC_MODEL=claude-sonnet-5-5
DEEPSEEK_MODEL=deepseek-chat

SHOT_ANALYSIS_PROMPT_PREFIX=DY,

GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_anthropic_key
DEEPSEEK_API_KEY=your_deepseek_key
```

เปลี่ยน `SHOT_ANALYSIS_PROVIDER` เป็นค่าต่อไปนี้:

| Provider | ค่าใน `.env` | ตัวแปร model | ตัวแปร API key |
| --- | --- | --- | --- |
| Google Gemini | `gemini` | `GEMINI_MODEL` | `GEMINI_API_KEY` |
| Anthropic Claude | `anthropic` | `ANTHROPIC_MODEL` | `ANTHROPIC_API_KEY` |
| DeepSeek | `deepseek` | `DEEPSEEK_MODEL` | `DEEPSEEK_API_KEY` |

ใส่เฉพาะ API key ที่ใช้งานจริงได้ ไม่ต้องใส่ครบทุก provider และไม่ควร commit `.env` ขึ้น Git

CLI ค้นหา `.env` ตามลำดับนี้ โดยค่าที่พบก่อนมีลำดับความสำคัญสูงกว่า:

1. `.env` ที่ใกล้ที่สุด เริ่มจากโฟลเดอร์ที่เรียกคำสั่งแล้วย้อนขึ้นไปยังโฟลเดอร์แม่
2. `~/.config/shot-analysis-cli/.env` สำหรับใช้ร่วมกันทุกโปรเจกต์บนเครื่อง
3. `.env` ใน root ของแพ็กเกจ เหมาะกับการติดตั้งด้วย `npm link`

Environment variable ที่ `export` ไว้ใน shell มีลำดับความสำคัญสูงสุด ส่วนค่าจาก `.env` มีลำดับความสำคัญเหนือ settings ที่สร้างด้วย `shot-analysis config`

หากติดตั้ง CLI แบบ global หรือใช้งานจากหลายโฟลเดอร์ แนะนำให้เก็บค่าไว้ที่:

```text
~/.config/shot-analysis-cli/.env
```

### ตั้งค่าผ่าน CLI

```bash
shot-analysis config
```

ระบบจะถาม provider, model, ชื่อ environment variable ที่เก็บ API key, prompt prefix และ custom API base URL จากนั้นบันทึก settings ที่:

```text
~/.config/shot-analysis-cli/settings.json
```

คำสั่งนี้เก็บเฉพาะการตั้งค่าและชื่อ environment variable โดยไม่เก็บ API key จริง จึงยังต้องใส่ API key ใน `.env` หรือ `export` ใน shell เช่น:

```bash
export GEMINI_API_KEY="your_key_here"
```

หากกำหนด `.env` ครบแล้ว ไม่จำเป็นต้องรัน `shot-analysis config`

## เริ่มโปรเจกต์ใหม่

```bash
shot-analysis new
```

ระบบจะถามว่าต้องการพิมพ์ brief หรืออ่านจากไฟล์

### พิมพ์ brief ใน Terminal

เลือก `พิมพ์หรือวางข้อความใน Terminal` จากนั้นพิมพ์ brief ได้หลายบรรทัด เมื่อจบให้พิมพ์ `.done` ในบรรทัดใหม่แล้วกด Enter:

```text
> คลิปสั้นเกี่ยวกับนักเดินทางที่กลับบ้านหลังจากหายไปหลายปี
  บรรยากาศอบอุ่นแบบภาพยนตร์ ความยาว 30 วินาที
  .done
```

### อ่าน brief จากไฟล์

เลือก `อ่านจากไฟล์ข้อความ` แล้วระบุ path หรือใช้ option โดยตรง:

```bash
shot-analysis new --brief ./brief.md
```

`--brief-file` เป็นชื่อเรียกอีกแบบของ `--brief`:

```bash
shot-analysis new --brief-file ./brief.txt
```

กำหนดไฟล์ brief และโฟลเดอร์ผลลัพธ์พร้อมกัน:

```bash
shot-analysis new --brief ./briefs/restaurant.md --output ./projects/restaurant-clip
```

Path ที่มีช่องว่างควรครอบด้วย quote:

```bash
shot-analysis new --brief "~/Desktop/My Clip Brief.md"
```

บน macOS สามารถลากไฟล์จาก Finder มาวางที่ช่อง path ใน Terminal ได้ ระบบรองรับ `~`, quote และ path ที่ escape ช่องว่างด้วย `\` เช่น `My\ Clip.md`

ไฟล์ brief ต้องเป็นไฟล์ข้อความ UTF-8 ที่มีขนาดไม่เกิน 5 MB เช่น `.txt`, `.md`, `.json` หรือ `.yaml` ชื่อไฟล์จะถูกใช้เป็นชื่อโปรเจกต์เริ่มต้น และ path ต้นทางจะถูกบันทึกใน `00-brief.md` กับ session

## ขั้นตอนการทำงาน

CLI จะทำงานตามลำดับดังนี้:

1. รับ brief ชื่อโปรเจกต์ ความยาวคลิป จำนวน shot ที่ต้องการ แพลตฟอร์ม อัตราส่วนภาพ และภาพอ้างอิงที่มี โดยเว้นจำนวน shot ว่างเพื่อให้ LLM แนะนำได้
2. วิเคราะห์ brief ถามข้อมูลสำคัญที่ยังขาด และเสนอจำนวน shot พร้อมช่วงที่เหมาะสมและเหตุผล
3. ให้ผู้ใช้ยืนยันจำนวน shot โดยใช้ค่าที่ระบุเองหรือค่าที่ LLM แนะนำ
4. เลือกรูปแบบภาพและ mood หาก brief ยังไม่ได้ระบุ
5. เลือก Core 1–3 รายการและกำหนด Primary Core
6. สร้างโครงเรื่องให้ตรวจและอนุมัติ
7. สร้าง shot list ตามจำนวนที่ยืนยัน พร้อมออกแบบ cinematic hook, attention path และ visual payoff แล้วตรวจเวลา continuity, ผู้ที่อยู่ใน/นอกเฟรม, เหตุและผล, ช่วงเวลาของ action และการเปลี่ยน state ของ prop
8. สร้าง prompt สำหรับ Character sheets, Locations และ Objects พร้อม Picture ID โดยแยก Object reference หนึ่งชนิดต่อหนึ่งภาพ
9. เลือกโมเดลปลายทางระหว่าง `MiniMax H3` และ `Seedance 2.5`
10. สร้าง generation prompt ฉบับสุดท้ายจากข้อมูลที่อนุมัติแล้วในรูปแบบเฉพาะของโมเดลที่เลือก

`MiniMax H3` ใช้โครงสร้าง `DY,subject_definitions`, `<Subject N>`, `<Picture N>` และรายละเอียดราย Shot ส่วน `Seedance 2.5` ใช้ `REFERENCE_MAPPING`, `@ImageN`, `SEQUENCE_SPECIFICATION`, timecoded Beat และ `GLOBAL_CONSTRAINTS` ค่าที่เลือกจะถูกบันทึกใน session และนำกลับมาใช้เมื่อ resume

ในหน้าเลือก Core ใช้ปุ่มลูกศรขึ้น/ลงเพื่อเลื่อน, `Space` เพื่อเลือกหรือยกเลิก และ `Enter` เพื่อยืนยัน รายการที่ LLM แนะนำจะแสดงด้านบนพร้อมเครื่องหมาย `★ แนะนำ` และสามารถเลือก `กำหนด Core เอง` ได้

เมื่อระบบสร้างเอกสารสำหรับ review จะมีตัวเลือก:

- `อนุมัติ` เพื่อไปขั้นถัดไป
- `ขอแก้ไข` เพื่อระบุรายละเอียดให้ LLM สร้างเอกสารใหม่
- `หยุดและบันทึกไว้` เพื่อเก็บ checkpoint แล้วกลับมาทำต่อภายหลัง

ระบบอนุญาตให้ขอแก้เอกสารแต่ละขั้นได้สูงสุด 6 รอบ

## ไฟล์ผลลัพธ์

ไฟล์จะถูกสร้างในโฟลเดอร์ที่เลือก:

| ไฟล์ | เนื้อหา |
| --- | --- |
| `00-brief.md` | Brief ข้อมูลพื้นฐาน และจำนวน shot ที่ผู้ใช้ระบุหรือสถานะให้ LLM แนะนำ |
| `01-analysis.md` | ผลวิเคราะห์ จำนวน shot ที่ LLM แนะนำและผู้ใช้เลือก ข้อมูลภาพ mood และ Core |
| `02-story.md` | โครงเรื่องที่ผ่านขั้น review |
| `03-shots.md` | Production shot list พร้อม cinematic intent, attention path, visual payoff, beat, geography, visible state, timed action, causal link, กล้อง, เสียง และ continuity bridge |
| `04-reference-image-prompts.md` | Prompt สำหรับ Character, Location และ Object references โดยแยกวัตถุแต่ละชนิดเป็นคนละ Picture |
| `05-generation-prompt.txt` | Generation prompt ฉบับรวมในรูปแบบ MiniMax H3 หรือ Seedance 2.5 ตามที่ผู้ใช้เลือก พร้อมรายละเอียดกล้อง geography ลำดับ action สีหน้า แสง เสียง บทพูด transition และ continuity |
| `.shot-analysis/session.json` | สถานะและข้อมูล checkpoint สำหรับ `status` และ `resume` |

หาก generation prompt ไม่ผ่าน validation ระบบอาจเก็บคำตอบล่าสุดไว้ที่ `05-generation-prompt.failed.txt` เพื่อช่วยตรวจสอบปัญหา

## ดูสถานะ

ระบุโฟลเดอร์โปรเจกต์ที่มี `.shot-analysis/session.json`:

```bash
shot-analysis status ./projects/restaurant-clip
```

ข้อมูลที่แสดงประกอบด้วยชื่อโปรเจกต์ สถานะ provider/model โฟลเดอร์ผลลัพธ์ และ error ล่าสุดถ้ามี

## ทำงานต่อจาก checkpoint

หากหยุดไว้ การเรียก LLM ล้มเหลว หรืออินเทอร์เน็ตหลุด ให้ทำงานต่อจากขั้นล่าสุดด้วย:

```bash
shot-analysis resume ./projects/restaurant-clip
```

ระบบจะอ่าน `.shot-analysis/session.json` และทำต่อจากขั้น analysis, story, shot list, reference image prompts, การเลือกโมเดลปลายทาง หรือ final prompt โดยไม่สร้างขั้นที่ผ่านการอนุมัติแล้วซ้ำ หากเลือก MiniMax H3 หรือ Seedance 2.5 ไปแล้ว ระบบจะใช้ตัวเลือกเดิมเมื่อ resume

สามารถเปลี่ยน provider หรือ model ใน `.env` หรือด้วย `shot-analysis config` ก่อน resume ได้ หากระบุโฟลเดอร์แม่และพบ session เพียงโปรเจกต์เดียวในโฟลเดอร์ย่อย ระบบจะค้นหาให้โดยอัตโนมัติ หากพบหลาย session ระบบจะแสดง path ที่พบเพื่อให้ระบุโปรเจกต์โดยตรง

Session อยู่ในโฟลเดอร์ผลลัพธ์ของแต่ละโปรเจกต์ หากย้ายงานไปอีกเครื่อง ต้องคัดลอกทั้งโฟลเดอร์โปรเจกต์ รวมถึงโฟลเดอร์ซ่อน `.shot-analysis`:

```bash
cp -R ./projects/restaurant-clip /path/on/another-machine/
```

## สรุปคำสั่ง

| คำสั่ง | การใช้งาน |
| --- | --- |
| `shot-analysis --help` | แสดงคู่มือคำสั่งแบบย่อ |
| `shot-analysis config` | ตั้งค่า provider และ model แบบ interactive |
| `shot-analysis new` | เริ่มโปรเจกต์ใหม่ |
| `shot-analysis new --brief FILE` | เริ่มโปรเจกต์จากไฟล์ brief |
| `shot-analysis new --brief FILE --output DIR` | ระบุไฟล์ brief และโฟลเดอร์ผลลัพธ์ |
| `shot-analysis status DIR` | ดูสถานะ session ของโปรเจกต์ |
| `shot-analysis resume DIR` | ทำงานต่อจาก checkpoint |

## แก้ปัญหาเบื้องต้น

### ไม่พบ API key ใน environment variable

ตรวจว่าชื่อ provider และตัวแปร API key ตรงกัน เช่น:

```dotenv
SHOT_ANALYSIS_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

ตรวจว่ากำลังเรียกคำสั่งจากโฟลเดอร์ที่ CLI สามารถค้นพบ `.env` ได้ หรือย้าย `.env` ไปไว้ที่ `~/.config/shot-analysis-cli/.env` เมื่อต้องการใช้ร่วมกันทุกโปรเจกต์ ห้ามใส่ quote รอบชื่อ environment variable และไม่ควรมีช่องว่างก่อนชื่อ key

### ไม่พบ session สำหรับ resume

ตรวจว่า path ที่ระบุคือโฟลเดอร์ผลลัพธ์ และมีไฟล์นี้อยู่:

```text
<project>/.shot-analysis/session.json
```

บน macOS ใช้คำสั่งนี้เพื่อตรวจไฟล์ซ่อน:

```bash
ls -la ./projects/restaurant-clip/.shot-analysis
```

หากคัดลอกโปรเจกต์มาจากเครื่องอื่น ต้องคัดลอก `.shot-analysis` มาด้วย

### ไม่พบไฟล์ brief

ตรวจ path ด้วย:

```bash
ls -l "$HOME/Desktop/My Clip Brief.md"
```

หาก path มีช่องว่าง ให้ครอบด้วย quote หรือลากไฟล์จาก Finder มาวางใน Terminal

### Generation prompt ไม่ผ่านการตรวจ

CLI ตรวจว่าแต่ละ shot มี timestamp ตรงกับ shot list, กล่าวถึงเฉพาะ Subject ที่ประกาศว่าอยู่ในหรือนอกเฟรม, เก็บบทพูดในรูปแบบ `<d>[Language] ...</d>` และมีรายละเอียดเพียงพอสำหรับ production prompt ระบบยังแก้หัวข้อ `subject_definitions` ที่ซ้ำติดกันให้อัตโนมัติ หากไม่ผ่าน ระบบจะส่ง STORY, SHOTS และ reference assets ต้นฉบับกลับไปให้ LLM สร้างใหม่อัตโนมัติหนึ่งครั้ง หากยังไม่ผ่าน ระบบจะบันทึก checkpoint และไฟล์ `05-generation-prompt.failed.txt` จากนั้นสามารถเปลี่ยน model หรือ provider แล้วเรียก `shot-analysis resume <project-folder>` ได้

## พัฒนาและตรวจสอบโค้ด

```bash
npm install
npm run check
npm test
npm pack --dry-run
```

## เอกสารเพิ่มเติม

- [แผนการพัฒนา](./docs/PLAN.md)
- [หลักการสร้าง Production Shot List](./docs/SHOT-LIST-GUIDE.md)
- [ตัวอย่าง Environment variables](./.env.example)
