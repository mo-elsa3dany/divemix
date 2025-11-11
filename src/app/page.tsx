export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <h1 className="text-3xl font-semibold">DiveMix</h1>
      <p>Plan dives + build gas mixes — free.</p>

      <nav className="space-x-4 underline">
        <a href="/planner">Dive Planner</a>
        <a href="/mixer">Gas Mixer</a>
        <a href="/pricing">Pricing</a>
      </nav>

      <p className="text-sm text-zinc-500 mt-6">
        Disclaimer: Educational planning tool only. Not a substitute for formal training
        or a dive computer.
      </p>
    </main>
  );
}
// ok
