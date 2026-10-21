function integerInRange(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 100 ? number : null;
}

export function parseShotCountPreference(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const count = integerInRange(value);
  if (!count) throw new Error("จำนวน shots ต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 100 หรือเว้นว่างเพื่อให้ LLM แนะนำ");
  return count;
}

export function shotCountRecommendation(analysis) {
  const recommendation = analysis?.shotCountRecommendation || {};
  const recommended = integerInRange(recommendation.recommended)
    || Math.max(1, Math.min(100, Math.round(Number(analysis?.durationSeconds || 15) / 3)));
  const minimum = integerInRange(recommendation.minimum) || recommended;
  const maximum = integerInRange(recommendation.maximum) || recommended;
  return {
    recommended,
    minimum: Math.min(minimum, recommended),
    maximum: Math.max(maximum, recommended),
    rationale: String(recommendation.rationale || "คำนวณจากความยาวคลิปและจังหวะเล่าเรื่อง")
  };
}

export async function selectShotCount(terminal, analysis, requestedShotCount) {
  const recommendation = shotCountRecommendation(analysis);
  console.log(`จำนวน shot ที่ LLM แนะนำ: ${recommendation.recommended} shots (ช่วงเหมาะสม ${recommendation.minimum}-${recommendation.maximum})`);
  console.log(`เหตุผล: ${recommendation.rationale}`);
  if (requestedShotCount) {
    console.log(`ใช้จำนวนที่ผู้ใช้ระบุ: ${requestedShotCount} shots`);
    return requestedShotCount;
  }
  const answer = await terminal.ask("จำนวน shots ที่ต้องการใช้", String(recommendation.recommended));
  return parseShotCountPreference(answer) || recommendation.recommended;
}
