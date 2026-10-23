export function estimateTokens(value) {
  return Math.ceil(String(value || "").length / 4);
}

export function splitShotBatches(shots, batchSize = 10) {
  const list = shots?.shots || [];
  if (list.length <= batchSize) return [shots];
  const batches = [];
  for (let index = 0; index < list.length; index += batchSize) {
    batches.push({ ...shots, shots: list.slice(index, index + batchSize) });
  }
  return batches;
}
