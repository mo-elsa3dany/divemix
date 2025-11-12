export function nitroxTopoffPSI(
  targetFO2: number, // e.g. 0.32
  currentFO2: number, // e.g. 0.21
  currentPSI: number, // e.g. 500
  finalPSI: number, // e.g. 3000
): { addO2: number; addAir: number } {
  const o2Needed = targetFO2 * finalPSI - currentFO2 * currentPSI;
  const addO2 = Math.max(0, Math.round(o2Needed));
  const addAir = Math.max(0, finalPSI - (currentPSI + addO2));
  return { addO2, addAir };
}

export function modForNitrox(targetPpO2: number, fo2Percent: number): number {
  const fo2 = fo2Percent / 100;
  const meters = (targetPpO2 / fo2 - 1) * 10;
  return Math.max(0, Math.round(meters));
}
