export const applyCount = (count, card) => count + (card?.countValue ?? 0);
export function roundTrueCount(value, method='truncate'){
  if(method==='floor') return Math.floor(value);
  if(method==='nearest') return Math.round(value);
  return value < 0 ? Math.ceil(value) : Math.floor(value);
}
export function getTrueCount(runningCount, decksLeft, method='truncate'){
  const raw = runningCount / Math.max(decksLeft, .25);
  return { raw, rounded: roundTrueCount(raw, method) };
}
