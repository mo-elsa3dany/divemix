export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const toInt = (v: string, def = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};

export const toFloat = (v: string, def = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
};
