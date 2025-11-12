import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DiveMix — Dive Planner & Gas Mixer',
  description:
    'Free, fast dive planner (NDL/MOD/PPO₂) and nitrox gas mixer. Educational use.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="max-w-3xl mx-auto p-4 flex gap-4">
          <a href="/">DiveMix</a>
          <a href="/planner">Planner</a>
          <a href="/mixer">Mixer</a>
          <a href="/trimix">Trimix</a>
          <a href="/saved">Saved</a>
          <a href="/pricing">Pricing</a>
        </header>
        {children}
      </body>
    </html>
  );
}
