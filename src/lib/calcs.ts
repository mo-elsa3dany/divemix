export function ambientPressureATA(depth_m: number) {
  return depth_m / 10 + 1;
}
export function modMeters(fo2: number, ppo2_limit: number) {
  if (fo2 <= 0) return 0;
  return Math.max(0, (ppo2_limit / fo2 - 1) * 10);
}
export function ppo2AtDepth(fo2: number, depth_m: number) {
  return fo2 * ambientPressureATA(depth_m);
}
// Conservative NDL approximation (educational only)
export function ndlMinutesApprox(depth_m: number) {
  if (depth_m <= 12) return 147;
  if (depth_m <= 15) return 72;
  if (depth_m <= 18) return 56;
  if (depth_m <= 21) return 45;
  if (depth_m <= 24) return 37;
  if (depth_m <= 27) return 30;
  if (depth_m <= 30) return 25;
  if (depth_m <= 33) return 20;
  if (depth_m <= 36) return 17;
  if (depth_m <= 40) return 12;
  return 8;
}
export function gasRequiredLiters(rmv_l_min: number, depth_m: number, time_min: number) {
  return rmv_l_min * ambientPressureATA(depth_m) * time_min;
}
export function turnPressureBar(
  cyl_volume_l: number,
  start_bar: number,
  gas_needed_l: number,
  reserve_bar: number,
) {
  const used_bar = gas_needed_l / cyl_volume_l;
  const turn_bar = start_bar - used_bar / 2; // simple thirds-style
  return Math.max(reserve_bar, Math.round(turn_bar));
}
export function eadMeters(depth_m: number, fo2: number) {
  const fn2 = 1 - fo2;
  return (depth_m + 10) * (fn2 / 0.79) - 10;
}
