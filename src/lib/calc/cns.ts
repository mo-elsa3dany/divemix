/**
 * NOAA single-exposure limits (minutes) by PPO2 (ata).
 * We'll linearly interpolate between points. <=0.5 ata => 0 (no CNS load).
 * Ref values (rounded): 1.6:45, 1.5:120, 1.4:150, 1.3:180, 1.2:210,
 * 1.1:240, 1.0:300, 0.9:360, 0.8:450, 0.7:570, 0.6:720, 0.5:Infinity.
 */
const TABLE: Array<{ po2: number; limit: number }> = [
  { po2: 1.6, limit: 45 },
  { po2: 1.5, limit: 120 },
  { po2: 1.4, limit: 150 },
  { po2: 1.3, limit: 180 },
  { po2: 1.2, limit: 210 },
  { po2: 1.1, limit: 240 },
  { po2: 1.0, limit: 300 },
  { po2: 0.9, limit: 360 },
  { po2: 0.8, limit: 450 },
  { po2: 0.7, limit: 570 },
  { po2: 0.6, limit: 720 },
  { po2: 0.5, limit: Infinity },
];

export function ambientAtaFromMeters(depthM: number): number {
  return +(depthM / 10 + 1).toFixed(2);
}

export function noaaCnsLimitMin(po2: number): number {
  if (po2 <= 0.5) return Infinity;
  // find bracketing points
  for (let i = 0; i < TABLE.length - 1; i++) {
    const a = TABLE[i],
      b = TABLE[i + 1];
    if (po2 >= b.po2 && po2 <= a.po2) {
      // linear interpolate on po2 between a and b
      const t = (po2 - b.po2) / (a.po2 - b.po2);
      if (!isFinite(a.limit) || !isFinite(b.limit)) return Infinity;
      return b.limit + t * (a.limit - b.limit);
    }
  }
  // above highest ( >1.6 ) → clamp to 1.6 row
  if (po2 > TABLE[0].po2) return TABLE[0].limit;
  // below lowest but >0.5 → infinite
  return Infinity;
}

export function cnsPercent(po2: number, minutes: number): number {
  if (po2 <= 0.5 || minutes <= 0) return 0;
  const limit = noaaCnsLimitMin(po2);
  if (!isFinite(limit)) return 0;
  return Math.round((minutes / limit) * 100);
}

/** OTU (a.k.a. UPTD) rate: (PO2 - 0.5)^0.83 * minutes, PO2 > 0.5 */
export function otu(po2: number, minutes: number): number {
  if (po2 <= 0.5 || minutes <= 0) return 0;
  const rate = Math.pow(po2 - 0.5, 0.83);
  return Math.round(rate * minutes);
}
