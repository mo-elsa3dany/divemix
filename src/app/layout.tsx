import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'DiveMix — Dive Planner & Gas Mixer',
  description: 'Plan dives, build gas mixes, Trimix tools. Educational use only.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <div className="container-page">{children}</div>
        <footer className="mx-auto max-w-3xl px-6 pb-10 pt-6 text-xs text-zinc-500">
          Disclaimer: Educational planning tool. Not a substitute for formal training or a
          dive computer.
        </footer>
      </body>
    </html>
  );
}
