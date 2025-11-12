/**
 * Conservative Air NDL (minutes) vs depth (m), interpolated.
 * Pairs: [depth_m, ndl_min]
 */
const NDL_POINTS: Array<[number, number]> = [
  [10, 200],
  [12, 160],
  [15, 100],
  [18, 60],
  [21, 45],
  [24, 35],
  [27, 30],
  [30, 25],
  [33, 20],
  [36, 17],
  [40, 13],
];

export function ndlAirAtDepthM(depthM: number): number {
  if (depthM <= NDL_POINTS[0][0]) return NDL_POINTS[0][1];
  for (let i = 0; i < NDL_POINTS.length - 1; i++) {
    const [d1, n1] = NDL_POINTS[i];
    const [d2, n2] = NDL_POINTS[i + 1];
    if (depthM >= d1 && depthM <= d2) {
      const t = (depthM - d1) / (d2 - d1);
      return Math.round(n1 + t * (n2 - n1));
    }
  }
  return Math.max(
    5,
    Math.round(NDL_POINTS[NDL_POINTS.length - 1][1] * (40 / Math.max(40, depthM))),
  );
}

/** Loading index = (bottom/NDL)*100; decays with 60-min halftime; RNT = NDL*index/100 */
export function n2IndexAfterDive(bottomMin: number, ndlMin: number): number {
  if (bottomMin <= 0 || ndlMin <= 0) return 0;
  return Math.max(0, Math.min(200, Math.round((bottomMin / ndlMin) * 100)));
}
export function decayIndex(index: number, siMin: number, halftimeMin = 60): number {
  if (index <= 0 || siMin <= 0) return Math.max(0, index);
  const decayed = index * Math.pow(2, -siMin / halftimeMin);
  return +decayed.toFixed(1);
}
export function rntFromIndex(nextNdL: number, index: number): number {
  if (nextNdL <= 0 || index <= 0) return 0;
  return Math.round(nextNdL * (index / 100));
}
