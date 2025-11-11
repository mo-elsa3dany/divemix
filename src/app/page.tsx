export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">DiveMix</h1>
      <p>Plan dives and build gas mixes — free.</p>
      <p>
        <a className="underline" href="/planner">Dive Planner</a>
        {' '}·{' '}
        <a className="underline" href="/mixer">Gas Mixer</a>
      </p>
      <p className="text-xs text-gray-500 mt-6">
        Disclaimer: Educational planning tool. Not a substitute for formal training or a dive computer.
      </p>
    </main>
  );
}
