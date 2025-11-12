// Trimix calculations (meters as canonical).
// Assumptions: seawater ~10 m/ATA; O2 considered narcotic for END (FNarc = FN2 + FO2).

export function ataAtDepth(depthM: number): number {
  return depthM / 10 + 1;
}

export function ppo2AtDepth(depthM: number, fo2: number): number {
  // fo2 is fraction (0.18..0.40..)
  return +(ataAtDepth(depthM) * fo2).toFixed(2);
}

export function modForMix(fo2: number, maxPPO2 = 1.4): number {
  if (fo2 <= 0) return 0;
  // ((maxPPO2 / FO2) - 1) * 10
  const m = (maxPPO2 / fo2 - 1) * 10;
  return Math.max(0, Math.round(m));
}

// END with O2 narcotic: FNarc = FN2 + FO2
// Formula: END = (((FNarc / 0.79) * (depth + 10)) - 10)
export function endMeters(depthM: number, fo2: number, fhe: number): number {
  const fn2 = Math.max(0, 1 - fo2 - fhe);
  const fnarc = Math.min(1, Math.max(0, fn2 + fo2));
  const end = (fnarc / 0.79) * (depthM + 10) - 10;
  return Math.max(0, Math.round(end));
}

// Validate fractions (sum <= 1, none negative). Returns normalized parts & errors.
export function validateFractions(fo2Pct: number, fhePct: number) {
  const fo2 = Math.max(0, fo2Pct) / 100;
  const fhe = Math.max(0, fhePct) / 100;
  let fn2 = 1 - fo2 - fhe;
  const errors: string[] = [];

  if (fo2 > 1 || fhe > 1) errors.push('Percentages must be <= 100%.');
  if (fn2 < 0) {
    errors.push('FO₂% + He% cannot exceed 100%.');
    fn2 = 0;
  }
  return { fo2, fhe, fn2, errors };
}
