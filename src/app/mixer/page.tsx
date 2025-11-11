'use client';
import { useState } from 'react';
import { modMeters, ppo2AtDepth } from '@/lib/calcs';

export default function MixerPage() {
  const [depth, setDepth] = useState(30);
  const [ppo2Limit, setPpo2Limit] = useState(1.4);
  const [fo2, setFo2] = useState(0.32);

  const mod = modMeters(fo2, ppo2Limit);
  const ppo2 = ppo2AtDepth(fo2, depth);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">🧪 Gas Mixer (Nitrox)</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          Target Depth (m)
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            value={depth}
            onChange={(e) => setDepth(+e.target.value)}
          />
        </label>
        <label className="space-y-1">
          PPO₂ limit (ATA)
          <input
            className="w-full border rounded px-3 py-2"
            step="0.1"
            type="number"
            value={ppo2Limit}
            onChange={(e) => setPpo2Limit(+e.target.value)}
          />
        </label>
        <label className="space-y-1">
          FO₂ (0.21–0.40 typical)
          <input
            className="w-full border rounded px-3 py-2"
            step="0.01"
            min={0.21}
            max={0.4}
            type="number"
            value={fo2}
            onChange={(e) => setFo2(+e.target.value)}
          />
        </label>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h3 className="font-medium mb-2">Results</h3>
          <p>
            MOD for FO₂ {Math.round(fo2 * 100)}% @ {ppo2Limit} ATA:{' '}
            <b>{mod.toFixed(1)} m</b>
          </p>
          <p>
            PPO₂ at {depth} m: <b>{ppo2.toFixed(2)} ATA</b>
          </p>
        </div>
        <div className="border rounded p-4">
          <h3 className="font-medium mb-2">Notes</h3>
          <p className="text-sm">
            Typical recreational limits: PPO₂ ≤ 1.4 ATA (working), ≤ 1.6 ATA
            (contingency). Verify with your agency standards.
          </p>
        </div>
      </section>

      <p className="text-xs text-gray-500">
        Disclaimer: Educational use only. Not a substitute for formal training or a dive
        computer.
      </p>
    </main>
  );
}
