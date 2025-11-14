export default function PricingPage() {
  return (
    <main className="container mx-auto max-w-3xl p-4 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Pricing</h1>
        <p className="text-sm text-zinc-400">
          Simple, transparent, and focused on giving divers solid tools.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/40 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold">Launch Tier</h2>
            <p className="mt-1 text-sm text-zinc-400">Free while in beta.</p>
            <ul className="mt-3 text-sm space-y-1 text-zinc-300">
              <li>• Full access to Planner, Nitrox, and Trimix tools</li>
              <li>• Local saves in your browser</li>
              <li>• Cloud-saved plans for logged-in users</li>
              <li>• Public share links for plans</li>
            </ul>
          </div>
          <div className="mt-4 text-sm text-zinc-500">
            No credit card. No subscriptions (yet).
          </div>
        </div>

        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/40 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold">Pro (Coming Soon)</h2>
            <p className="mt-1 text-sm text-zinc-400">
              For divers and teams who want more.
            </p>
            <ul className="mt-3 text-sm space-y-1 text-zinc-300">
              <li>• Advanced gas planning features</li>
              <li>• Expanded history & audit trails</li>
              <li>• Team / shop accounts</li>
              <li>• Priority updates and support</li>
            </ul>
          </div>
          <div className="mt-4 text-sm text-zinc-500">
            We&apos;ll announce pricing before anything goes live.
          </div>
        </div>
      </section>

      <p className="text-xs text-zinc-500">
        Note: DiveMix is currently in active development. Always verify plans against your
        training agency guidance and dive computers.
      </p>
    </main>
  );
}
