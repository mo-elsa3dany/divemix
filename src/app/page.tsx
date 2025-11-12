export default function Home() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">DiveMix</h1>
      <p className="text-zinc-400 max-w-xl">
        Plan dives and build gas mixes — free. Cloud save with email login. Metric &
        imperial. Nitrox now, Trimix ready.
      </p>
      <div className="flex gap-3 flex-wrap">
        <a className="btn btn-primary" href="/planner">
          Open Planner
        </a>
        <a className="btn" href="/nitrox">
          Nitrox
        </a>
        <a className="btn" href="/trimix">
          Trimix
        </a>
        <a className="btn" href="/login">
          Sign in
        </a>
      </div>
      <p className="hint">
        Disclaimer: educational planning tool. Always verify with training agency and a
        dive computer.
      </p>
    </main>
  );
}
