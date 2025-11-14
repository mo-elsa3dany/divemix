/**
 * Minimal ZHL-16C + Gradient Factors for square-profile NDL.
 * Educational use only. Not a substitute for training or a dive computer.
 */
export type GasComp = { fN2: number; fHe: number }; // O2 inferred
export type GF = { low: number; high: number };

type Comp = {
  aN2: number;
  bN2: number;
  halfN2: number;
  aHe: number;
  bHe: number;
  halfHe: number;
};

// ZHL-16C coefficients (N2 + He). Sources: public summaries of Bühlmann values.
const comps: Comp[] = [
  { aN2: 1.1696, bN2: 0.5578, halfN2: 4.0, aHe: 1.6189, bHe: 0.477, halfHe: 1.51 },
  { aN2: 1.0, bN2: 0.6514, halfN2: 5.0, aHe: 1.383, bHe: 0.5747, halfHe: 1.88 },
  { aN2: 0.8618, bN2: 0.7222, halfN2: 8.0, aHe: 1.1919, bHe: 0.6527, halfHe: 3.02 },
  { aN2: 0.7562, bN2: 0.7825, halfN2: 12.5, aHe: 1.0458, bHe: 0.7223, halfHe: 4.72 },
  { aN2: 0.6667, bN2: 0.8126, halfN2: 18.5, aHe: 0.922, bHe: 0.7582, halfHe: 6.99 },
  { aN2: 0.5933, bN2: 0.8434, halfN2: 27.0, aHe: 0.8205, bHe: 0.7957, halfHe: 10.21 },
  { aN2: 0.5282, bN2: 0.8693, halfN2: 38.3, aHe: 0.7305, bHe: 0.8279, halfHe: 14.48 },
  { aN2: 0.4701, bN2: 0.891, halfN2: 54.3, aHe: 0.6502, bHe: 0.8553, halfHe: 20.53 },
  { aN2: 0.4187, bN2: 0.9092, halfN2: 77.0, aHe: 0.595, bHe: 0.8757, halfHe: 29.11 },
  { aN2: 0.3798, bN2: 0.9222, halfN2: 109.0, aHe: 0.5545, bHe: 0.8903, halfHe: 41.2 },
  { aN2: 0.3497, bN2: 0.9319, halfN2: 146.0, aHe: 0.5333, bHe: 0.8997, halfHe: 55.19 },
  { aN2: 0.3223, bN2: 0.9403, halfN2: 187.0, aHe: 0.5189, bHe: 0.9073, halfHe: 70.69 },
  { aN2: 0.2971, bN2: 0.9477, halfN2: 239.0, aHe: 0.5181, bHe: 0.9122, halfHe: 90.34 },
  { aN2: 0.2737, bN2: 0.9544, halfN2: 305.0, aHe: 0.5176, bHe: 0.9171, halfHe: 115.29 },
  { aN2: 0.2523, bN2: 0.9602, halfN2: 390.0, aHe: 0.5172, bHe: 0.9217, halfHe: 147.42 },
  { aN2: 0.2327, bN2: 0.9653, halfN2: 498.0, aHe: 0.5119, bHe: 0.9267, halfHe: 188.24 },
];

const LN2 = Math.log(2);

function schreiner(
  p0: number, // starting tissue tension
  pinsp: number, // inspired inert partial pressure at depth
  k: number, // ln2 / half-time
  t: number, // minutes at depth
): number {
  // Constant inspired pressure model (square profile): solution collapses to simple exponential
  return pinsp + (p0 - pinsp) * Math.exp(-k * t);
}

function inspPartial(ata: number, gas: GasComp) {
  // Water vapor ~0.0627 ata (47 mmHg) at sea level, scaled with ambient ~not; keep surface subtraction.
  const PH2O = 0.0627;
  const piN2 = (ata - PH2O) * gas.fN2;
  const piHe = (ata - PH2O) * gas.fHe;
  return { piN2, piHe };
}

function mixGF(currentDepthAta: number, gf: GF): number {
  // Linear interpolation vs ambient from surface (1 ata) to depth; classic GF application during ascent.
  // For NDL at depth, approximate by GF_high (conservative) or interpolate—use GF_high here.
  return gf.high;
}

function ceilingFromTensions(tN2: number, tHe: number, c: Comp, gfVal: number): number {
  // Combined a, b per Buhlmann for mixed inert gas: weighted by partial pressure fractions
  // Using standard approach: a = (aN2*PN2 + aHe*PHe) / (PN2+PHe), same for b
  const PN2 = tN2,
    PHe = tHe;
  const sum = PN2 + PHe;
  const a = sum > 0 ? c.aN2 * (PN2 / sum) + c.aHe * (PHe / sum) : c.aN2;
  const b = sum > 0 ? c.bN2 * (PN2 / sum) + c.bHe * (PHe / sum) : c.bN2;

  // M-value at a given ambient Pamb: M = (Pamb - a) * b  (rearranged forms exist)
  // We want the maximum allowed tissue tension at current ambient given GF:
  // M_gf = Pamb * (1/b) + a - gf * ( (Pamb * (1/b) + a) - Pamb )
  // Easier: permissible supersaturation = gf * (M - Pamb)
  // To get ceiling, we invert: find Pamb where tissue <= Pamb + gf*(M(Pamb)-Pamb)
  // For NDL check, commonly compare tissue <= a + b * Pamb_gf, with Pamb_gf = (t - a) / b, then apply GF:
  // Use standard simplified form: allowed = (t - a*gf) / (b*gf)
  const allowedAmbient = (PN2 + PHe - a * gfVal) / (b * gfVal);
  return Math.max(0, allowedAmbient);
}

export function ndlAtDepthMinutes(
  depthMeters: number,
  gas: GasComp, // e.g., EAN32: fN2=0.68, fHe=0
  gf: GF, // e.g., {low:0.3, high:0.85}
  initialN2 = 0.79 * 0.933, // start near surface equilibrium N2 (approx)
  initialHe = 0, // assume no helium in tissues at start
): number {
  const ata = 1 + depthMeters / 10;
  const { piN2, piHe } = inspPartial(ata, gas);

  // Iterate time until any compartment’s ceiling exceeds current ambient (i.e., ascent ceiling > current depth)
  const maxMinutes = 600; // safety cap
  let t = 0;
  const step = 1; // minute resolution

  // current tissue tensions per comp (N2/He)
  const tN2 = comps.map(() => initialN2);
  const tHe = comps.map(() => initialHe);

  for (t = 0; t <= maxMinutes; t += step) {
    // update tissues for this minute at depth
    for (let i = 0; i < comps.length; i++) {
      tN2[i] = schreiner(tN2[i], piN2, LN2 / comps[i].halfN2, step);
      tHe[i] = schreiner(tHe[i], piHe, LN2 / comps[i].halfHe, step);
    }

    const gfVal = mixGF(ata, gf);
    // check ceilings
    let violates = false;
    for (let i = 0; i < comps.length; i++) {
      const ceilAmb = ceilingFromTensions(tN2[i], tHe[i], comps[i], gfVal);
      if (ceilAmb > ata + 1e-6) {
        // requires stop deeper than current amb → NDL exceeded
        violates = true;
        break;
      }
    }
    if (violates) return Math.max(0, t - step);
  }
  return maxMinutes;
}

export type Stop = { depthM: number; timeMin: number };
export type Schedule = {
  stops: Stop[];
  ascentMin: number;
  decoMin: number;
  runtimeMin: number;
};

/**
 * Compute a simple ascent schedule (square profile) using ZHL-16C + GF.
 * - Bottom at depthMeters for bottomMin
 * - Ascent rate 9 m/min
 * - Hold at 3 m steps until ceilings clear
 * - Returns stops & totals (educational only)
 */
export function scheduleAscent(
  depthMeters: number,
  bottomMin: number,
  gas: GasComp,
  gf: GF,
  initialN2 = 0.79 * 0.933,
  initialHe = 0,
): Schedule {
  const step = 1; // 1-min increments
  const ascRateMpm = 9; // ascent rate m/min
  const PH2O = 0.0627;

  // Init tissues at surface, then load at bottom
  const tN2 = comps.map(() => initialN2);
  const tHe = comps.map(() => initialHe);
  const LN2 = Math.log(2);

  function schreiner(p0: number, pinsp: number, half: number, dt: number) {
    return pinsp + (p0 - pinsp) * Math.exp(-(LN2 / half) * dt);
  }
  function inspired(ata: number, g: GasComp) {
    const amb = Math.max(1, ata);
    const dry = Math.max(amb - PH2O, 0.1);
    return { piN2: dry * g.fN2, piHe: dry * g.fHe };
  }
  function ceiling(ambAta: number, gff: number) {
    let maxCeil = 0;
    for (let i = 0; i < comps.length; i++) {
      const PN2 = tN2[i],
        PHe = tHe[i];
      const sum = PN2 + PHe;
      const a =
        sum > 0 ? comps[i].aN2 * (PN2 / sum) + comps[i].aHe * (PHe / sum) : comps[i].aN2;
      const b =
        sum > 0 ? comps[i].bN2 * (PN2 / sum) + comps[i].bHe * (PHe / sum) : comps[i].bN2;
      const allowedAmb = (PN2 + PHe - a * gff) / (b * gff);
      if (allowedAmb > maxCeil) maxCeil = allowedAmb;
    }
    return maxCeil;
  }

  // Bottom loading
  {
    const amb = 1 + depthMeters / 10;
    const { piN2, piHe } = inspired(amb, gas);
    for (let t = 0; t < bottomMin; t += step) {
      for (let i = 0; i < comps.length; i++) {
        tN2[i] = schreiner(tN2[i], piN2, comps[i].halfN2, step);
        tHe[i] = schreiner(tHe[i], piHe, comps[i].halfHe, step);
      }
    }
  }

  const stops: Stop[] = [];
  let decoMin = 0;
  let ascentMin = 0;

  // Target waypoints every 3 m from current depth down to 0
  function roundTo3m(d: number) {
    return Math.max(0, Math.round(d / 3) * 3);
  }
  let current = roundTo3m(depthMeters);

  while (current > 0) {
    // Attempt to ascend one 3 m step (but respect 9 m/min)
    const next = Math.max(0, current - 3);
    const segmentHeight = current - next;
    const segMinutes = Math.max(1, Math.ceil(segmentHeight / ascRateMpm));
    // try the ascent minute by minute; if ceiling says no → hold stop here instead
    let blocked = false;
    for (let m = 0; m < segMinutes; m++) {
      const amb = 1 + (current - (m + 1) * ascRateMpm) / 10;
      const gff = gf.high; // conservative for NDL/deco boundary
      const ceilAmb = ceiling(amb, gff);
      if (ceilAmb > amb + 1e-6) {
        blocked = true;
        break;
      }
      // ok to ascend this minute → update tissues at intermediate amb
      const { piN2, piHe } = inspired(amb, gas);
      for (let i = 0; i < comps.length; i++) {
        tN2[i] = schreiner(tN2[i], piN2, comps[i].halfN2, 1);
        tHe[i] = schreiner(tHe[i], piHe, comps[i].halfHe, 1);
      }
      ascentMin += 1;
    }
    if (!blocked) {
      current = next;
      continue;
    }

    // Hold at current 3 m stop until ceilings clear enough to continue
    let held = 0;
    while (true) {
      const amb = 1 + current / 10;
      const gff =
        current <= 6
          ? gf.low + ((gf.high - gf.low) * (amb - 1)) / (depthMeters / 10)
          : gf.high;
      const ceilAmb = ceiling(amb, gff);
      if (ceilAmb <= amb + 1e-6 && held > 0) break;
      const { piN2, piHe } = inspired(amb, gas);
      for (let i = 0; i < comps.length; i++) {
        tN2[i] = schreiner(tN2[i], piN2, comps[i].halfN2, 1);
        tHe[i] = schreiner(tHe[i], piHe, comps[i].halfHe, 1);
      }
      held += 1;
      decoMin += 1;
      // safety valve
      if (held > 120) break;
    }
    if (held > 0) stops.push({ depthM: current, timeMin: held });
    // after clearing, go loop to try ascending again
  }

  const runtimeMin = bottomMin + ascentMin + decoMin;
  return { stops, ascentMin, decoMin, runtimeMin };
}
