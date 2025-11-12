// CNS% via NOAA single-exposure limits (approx), with linear interpolation.
// Table: ppO2 (ata) -> minutes for 100% CNS
const NOAA_LIMITS: [number, number][] = [
  [1.6, 45],
  [1.5, 120],
  [1.4, 150],
  [1.3, 180],
  [1.2, 210],
  [1.1, 240],
  [1.0, 300],
  [0.9, 360],
  [0.8, 450],
  [0.7, 570],
  [0.6, 720],
  [0.5, 1440], // effectively safe for CNS calc; used for interpolation floor
];

function interpMinutes(ppO2: number): number {
  if (ppO2 <= 0.5) return 1e9; // essentially zero CNS accumulation
  // find surrounding points
  for (let i = 0; i < NOAA_LIMITS.length - 1; i++) {
    const [p1, m1] = NOAA_LIMITS[i];
    const [p2, m2] = NOAA_LIMITS[i + 1];
    // table is descending ppO2; ensure segment covers ppO2
    if ((ppO2 <= p1 && ppO2 >= p2) || (ppO2 >= p1 && ppO2 <= p2)) {
      const t = (ppO2 - p2) / (p1 - p2);
      return m2 + t * (m1 - m2);
    }
  }
  // if above highest ( >1.6 ), be conservative use 45 min
  if (ppO2 > 1.6) return 45;
  // below lowest (>0.5 but <0.5 handled): use last
  return NOAA_LIMITS[NOAA_LIMITS.length - 1][1];
}

export function cnsPercent(ppO2: number, minutes: number): number {
  const limitMin = interpMinutes(ppO2);
  const pct = (minutes / limitMin) * 100;
  return Math.max(0, +pct.toFixed(0));
}

// OTU approximation (NOAA). For ppO2 <= 0.5, zero; else OTU/min ≈ (ppO2 - 0.5)^0.83
export function otus(ppO2: number, minutes: number): number {
  if (ppO2 <= 0.5) return 0;
  const perMin = Math.pow(ppO2 - 0.5, 0.83);
  return Math.max(0, Math.round(perMin * minutes));
}
