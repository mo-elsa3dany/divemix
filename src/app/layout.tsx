import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import AnalyticsClient from './_analytics';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://divemix-app.vercel.app',
  ),
  title: { default: 'DiveMix', template: '%s · DiveMix' },
  description:
    'Plan dives & build gas mixes — free. Cloud save with email login. Metric & imperial.',
  openGraph: {
    title: 'DiveMix',
    description: 'Plan dives & build gas mixes.',
    siteName: 'DiveMix',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DiveMix',
    description: 'Plan dives & build gas mixes.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsClient />
        <header className="max-w-4xl mx-auto p-4 flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-semibold hover:underline hover:text-zinc-200"
          >
            DiveMix
          </Link>

          <nav className="ml-auto flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/planner" className="hover:underline hover:text-zinc-200">
              Planner
            </Link>
            <Link href="/saved" className="hover:underline hover:text-zinc-200">
              Saved
            </Link>
            <Link href="/nitrox" className="hover:underline hover:text-zinc-200">
              Nitrox
            </Link>
            <Link href="/trimix" className="hover:underline hover:text-zinc-200">
              Trimix
            </Link>
            <Link href="/pricing" className="hover:underline hover:text-zinc-200">
              Pricing
            </Link>
            <Link href="/docs" className="hover:underline hover:text-zinc-200">
              Docs
            </Link>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
        <footer className="max-w-4xl mx-auto p-6 text-xs text-zinc-500">
          Disclaimer: educational planning tool. Always verify with training agency and a
          dive computer.
        </footer>
      </body>
    </html>
  );
}
