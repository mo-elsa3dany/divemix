export function gasFromFo2(fo2: number) {
  const fO2 = fo2;
  const fHe = 0;
  const fN2 = Math.max(0, 1 - fO2 - fHe);
  return { fN2, fHe };
}
