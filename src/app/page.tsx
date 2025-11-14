'use client';

import Link from 'next/link';
import Logo from '../components/Logo';

export default function HomePage() {
  return (
    <main className="container max-w-3xl mx-auto p-4 min-h-[70vh] flex flex-col justify-center">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="flex-1">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Dive planning & gas mixing
            </p>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold">
          For Divers Who Actually Read Their Tables.
        </h1>

        <p className="text-zinc-300 text-sm md:text-base max-w-xl">
          DiveMix is a fast, no-nonsense planner and mixer for divers who care about
          numbers. Plan multi-dive profiles, calculate Nitrox and Trimix, and keep your
          data synced across devices.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/planner" className="btn">
            Open Dive Planner
          </Link>
          <Link href="/login" className="btn">
            Sign in / Manage plans
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/nitrox" className="btn-ghost">
            Nitrox Mixer
          </Link>
          <Link href="/trimix" className="btn-ghost">
            Trimix Tools
          </Link>
          <Link href="/saved" className="btn-ghost">
            Saved cloud plans
          </Link>
        </div>
      </header>
    </main>
  );
}
