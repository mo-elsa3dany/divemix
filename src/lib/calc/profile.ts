/**
 * Simple profile model:
 * - Descent: linear from 0 to depth at descentRate (m/min)
 * - Bottom: constant depth for (timeMin - descentMin - ascentMin) if positive
 * - Ascent: linear from depth to 0 at ascentRate (m/min)
 * Returns time-weighted average ATA and segment breakdown.
 */
export function avgAtaOverProfile(
  depthM: number,
  timeMin: number,
  descentRate = 18,
  ascentRate = 9,
) {
  const clamp = (x: number) => Math.max(0, x);
  const tDesc = clamp(depthM / Math.max(1, descentRate));
  const tAsc = clamp(depthM / Math.max(1, ascentRate));
  const tBottom = clamp(timeMin - tDesc - tAsc);

  // average ATA for a linear segment from 0→depth or depth→0 is midpoint pressure
  const ataAt = (m: number) => m / 10 + 1;
  const avgAtaDesc = (ataAt(0) + ataAt(depthM)) / 2;
  const avgAtaAsc = avgAtaDesc; // symmetric
  const avgAtaBottom = ataAt(depthM);

  const totalMin = tDesc + tBottom + tAsc || 1;
  const avgATA =
    (tDesc * avgAtaDesc + tBottom * avgAtaBottom + tAsc * avgAtaAsc) / totalMin;

  return {
    avgATA: +avgATA.toFixed(2),
    segments: {
      tDesc: +tDesc.toFixed(2),
      tBottom: +tBottom.toFixed(2),
      tAsc: +tAsc.toFixed(2),
    },
  };
}
