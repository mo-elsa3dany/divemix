'use client';
import { useState } from 'react';
import { ndlMinutesApprox, modMeters, ppo2AtDepth, gasRequiredLiters, turnPressureBar, eadMeters } from '@/lib/calcs';

export default function PlannerPage(){
  const [depth, setDepth] = useState(18);
  const [time, setTime] = useState(40);
  const [fo2, setFo2] = useState(0.32);
  const [ppo2Limit, setPpo2Limit] = useState(1.4);
  const [rmv, setRmv] = useState(18);
  const [cylVol, setCylVol] = useState(12);
  const [startBar, setStartBar] = useState(200);
  const [reserveBar, setReserveBar] = useState(50);

  const ndl = ndlMinutesApprox(depth);
  const mod = modMeters(fo2, ppo2Limit);
  const ppo2 = ppo2AtDepth(fo2, depth);
  const gasL = gasRequiredLiters(rmv, depth, time);
  const turnBar = turnPressureBar(cylVol, startBar, gasL, reserveBar);
  const ead = eadMeters(depth, fo2);
  const warnMOD = depth > mod;
  const warnNDL = time > ndl;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">📝 Dive Planner</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">Depth (m)
          <input className="w-full border rounded px-3 py-2" type="number" value={depth} onChange={e=>setDepth(+e.target.value)}/>
        </label>
        <label className="space-y-1">Bottom time (min)
          <input className="w-full border rounded px-3 py-2" type="number" value={time} onChange={e=>setTime(+e.target.value)}/>
        </label>
        <label className="space-y-1">FO₂ (e.g., 0.32)
          <input className="w-full border rounded px-3 py-2" step="0.01" type="number" value={fo2} onChange={e=>setFo2(+e.target.value)}/>
        </label>
        <label className="space-y-1">PPO₂ limit (ATA)
          <input className="w-full border rounded px-3 py-2" step="0.1" type="number" value={ppo2Limit} onChange={e=>setPpo2Limit(+e.target.value)}/>
        </label>
        <label className="space-y-1">RMV / SAC (L/min @ surface)
          <input className="w-full border rounded px-3 py-2" type="number" value={rmv} onChange={e=>setRmv(+e.target.value)}/>
        </label>
        <label className="space-y-1">Cylinder size (L)
          <input className="w-full border rounded px-3 py-2" type="number" value={cylVol} onChange={e=>setCylVol(+e.target.value)}/>
        </label>
        <label className="space-y-1">Start pressure (bar)
          <input className="w-full border rounded px-3 py-2" type="number" value={startBar} onChange={e=>setStartBar(+e.target.value)}/>
        </label>
        <label className="space-y-1">Reserve pressure (bar)
          <input className="w-full border rounded px-3 py-2" type="number" value={reserveBar} onChange={e=>setReserveBar(+e.target.value)}/>
        </label>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h3 className="font-medium mb-2">Key Results</h3>
          <p>NDL (approx): <b>{ndl} min</b> {warnNDL && '⚠️ exceeds NDL'}</p>
          <p>MOD: <b>{mod.toFixed(1)} m</b> {warnMOD && '⚠️ beyond MOD'}</p>
          <p>PPO₂ at depth: <b>{ppo2.toFixed(2)} ATA</b></p>
          <p>EAD (N₂-only): <b>{ead.toFixed(1)} m</b></p>
        </div>
        <div className="border rounded p-4">
          <h3 className="font-medium mb-2">Gas Planning</h3>
          <p>Gas needed (rough): <b>{gasL.toFixed(0)} L</b></p>
          <p>Turn pressure (est.): <b>{turnBar} bar</b></p>
          <p className="text-xs text-gray-500">Educational use only. Adjust your SOP.</p>
        </div>
      </section>

      <p className="text-xs text-gray-500">Disclaimer: Not a substitute for training or a dive computer.</p>
    </main>
  );
}
