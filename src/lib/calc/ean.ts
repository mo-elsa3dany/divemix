/** Shared helpers for recreational EANx planning */
export function ataFromDepthM(depthM: number): number {
  return +(depthM / 10 + 1).toFixed(2);
}

export function mToFt(m: number) {
  return Math.round(m * 3.28084);
}
export function ftToM(ft: number) {
  return Math.round(ft / 3.28084);
}

/** MOD (m) for given FO2 (%) and PPO2 limit (ata) */
export function modM(fo2Pct: number, ppo2Limit: number): number {
  const fo2 = Math.max(0.21, Math.min(0.5, fo2Pct / 100));
  const m = 10 * (ppo2Limit / fo2 - 1);
  return Math.max(0, Math.round(m));
}

/** Best Mix FO2 (%) for depth (m) and PPO2 limit (ata), clamped 21–40% */
export function bestMixPct(depthM: number, ppo2Limit: number): number {
  const ata = ataFromDepthM(depthM);
  const pct = Math.round((ppo2Limit / ata) * 100);
  return Math.max(21, Math.min(40, pct));
}

/** EAD (m) for given FO2 (%) and depth (m) */
export function eadM(fo2Pct: number, depthM: number): number {
  const fn2 = Math.max(0.0, Math.min(0.79, 1 - fo2Pct / 100));
  const ead = (depthM + 10) * (fn2 / 0.79) - 10;
  return Math.max(0, Math.round(ead));
}
