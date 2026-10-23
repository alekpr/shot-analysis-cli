# Shot Analysis CLI — Improvement Roadmap

อัปเดตล่าสุด: 2026-10-23

เอกสารนี้เป็นแผนงานหลักสำหรับยกระดับระบบจาก CLI ที่ใช้งานแบบมีผู้ควบคุม ไปเป็นเครื่องมือที่ทนต่อ API failure, ย้ายเครื่องได้, ตรวจสอบผลลัพธ์ได้ และเผยแพร่ให้ผู้ใช้ทั่วไปได้อย่างมั่นใจ

## สถานะ

- `TODO` ยังไม่เริ่ม
- `IN PROGRESS` กำลังดำเนินการ
- `DONE` พัฒนาและผ่านการทดสอบตามเกณฑ์แล้ว
- `BLOCKED` มี dependency หรือข้อมูลที่ต้องรอ

## ลำดับดำเนินงาน

| ลำดับ | ระดับ | งาน | สถานะ | เกณฑ์เสร็จ |
|---:|:---:|---|:---:|---|
| 1 | P0 | HTTP resilience สำหรับ LLM providers | DONE | มี timeout, retry 408/429/5xx, `Retry-After`, jitter, แยก error และมี automated tests |
| 2 | P0 | Session durability และ concurrency lock | DONE | เขียน session แบบ atomic, มี backup, กู้ไฟล์เสียได้, ป้องกัน workflow ซ้อน และมี tests |
| 3 | P0 | Session schema migration และ portable paths | DONE | ตรวจ schema/version, migrate session เก่า, path ใน session ย้ายข้ามเครื่องได้ และมี tests |
| 4 | P0 | Provider doctor และ model compatibility | DONE | มี `doctor` ตรวจ key/model/JSON response, ปรับ DeepSeek default และแสดง error ที่แก้ตามได้ |
| 5 | P1 | Canonical asset manifest และ cross-stage validation | DONE | subject/location/object ใช้ ID กลาง, ปฏิเสธ ID ที่ไม่มีจริง และตรวจ reference coverage ได้ |
| 6 | P1 | Deterministic final prompt renderer | DONE | headings, mapping, shot number และ timestamps ประกอบโดยโค้ด; LLM สร้างเฉพาะข้อมูลเชิงสร้างสรรค์ |
| 7 | P1 | Prompt sizing และ chunked generation | DONE | ประเมินขนาดก่อนเรียก API, เตือน/แบ่งงานขนาดใหญ่ และรวมผลอย่าง deterministic |
| 8 | P1 | Regenerate ราย stage และ dependency invalidation | DONE | regenerate story/shots/references/storyboard/final ได้ และ mark downstream artifacts ว่าล้าสมัย |
| 9 | P2 | Revision history และ overwrite safety | DONE | เก็บ revision ที่อนุมัติแล้ว, rollback ได้ และไม่เหลือ artifact เก่าเมื่อเริ่มทับโปรเจกต์ |
| 10 | P2 | Provider contract และ failure integration tests | DONE | ครอบคลุม 429/503, timeout, truncated output, empty 200 และ provider response shapes |
| 11 | P2 | CLI automation/diagnostics | DONE | รองรับ status discovery แบบเดียวกับ resume, machine-readable output และข้อความ error ที่ระบุขั้นตอนแก้ไข |
| 12 | P2 | CI และ release packaging | DONE | มี GitHub Actions, local CI-equivalent ผ่าน, check ครบทุก JS, package ไม่มี demo เก่า, มี LICENSE และ pack test |

## หลักการทำงาน

1. ทำงานตามลำดับเพื่อไม่สร้าง feature บน state/API layer ที่ยังไม่ทนทาน
2. เมื่อเริ่มงาน เปลี่ยนสถานะเป็น `IN PROGRESS`
3. เปลี่ยนเป็น `DONE` หลัง implementation และ automated tests ผ่านเท่านั้น
4. บันทึกหลักฐานการทดสอบและ commit ในหัวข้อ Change log
5. หากพบ dependency ใหม่ ให้เพิ่ม task โดยไม่ลดเกณฑ์ของงานเดิม

## Change log

- 2026-10-23 — สร้าง roadmap จากผล review ระบบ และเริ่ม Task 1: HTTP resilience
- 2026-10-23 — Task 1 เสร็จ: เพิ่ม timeout/retry/backoff/Retry-After/typed errors; `npm test` ผ่าน 60 tests และเริ่ม Task 2
- 2026-10-23 — Task 2–3 เสร็จ: atomic save, backup recovery, workflow lock, session v4 migration และ portable artifact paths; `npm test` ผ่าน 64 tests และเริ่ม Task 4
- 2026-10-23 — Task 4–7 เสร็จ: provider doctor, DeepSeek V4 default, canonical asset manifest, deterministic renderer และ shot batching; `npm test` ผ่าน 70 tests และเริ่ม Task 8–9
- 2026-10-23 — Task 8–11 เสร็จ: stage regeneration, dependency invalidation, history/rollback, provider contract tests และ JSON status; `npm test` ผ่าน 75 tests
- 2026-10-23 — Task 12 เสร็จ: CI สำหรับ Node 20/22, syntax check ครบทุก JS, MIT LICENSE และ package allowlist; `npm run check`, `npm test`, `npm audit` และ `npm pack --dry-run` ผ่าน
- 2026-10-23 — Live verification ผ่าน: `shot-analysis doctor` เชื่อมต่อ Gemini `gemini-3.5-flash` และตรวจ JSON output สำเร็จใน 1749ms
