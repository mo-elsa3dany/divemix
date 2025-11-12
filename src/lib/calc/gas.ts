export function ppO2(depthMeters: number, fo2: number): number {
  const ata = depthMeters / 10 + 1; // ~10 m per ATA
  return +(ata * fo2).toFixed(2);
}

export function modMeters(targetPpO2: number, fo2: number): number {
  if (fo2 <= 0) return 0;
  const meters = (targetPpO2 / fo2 - 1) * 10;
  return Math.max(0, Math.round(meters));
}

export const mToFt = (m: number) => Math.round(m * 3.28084);
export const ftToM = (ft: number) => Math.round(ft / 3.28084);

export function gasUsedLiters(
  sacLpm: number,
  timeMin: number,
  depthMeters: number,
): number {
  const ata = depthMeters / 10 + 1;
  return Math.round(sacLpm * ata * timeMin);
}

export function tankCapacityLiters(cylLiters: number, fillBar: number) {
  return Math.round(cylLiters * fillBar);
}
