import './globals.css';
import type { Metadata } from 'next';
import AnalyticsClient from './_analytics';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://divemix-app.vercel.app',
  ),
  title: { default: 'DiveMix', template: '%s · DiveMix' },
  description:
    'Plan dives & build gas mixes. Free. Cloud save with email login. Metric & imperial.',
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
        <main className="container mx-auto p-6">{children}</main>
        <AnalyticsClient />
      </body>
    </html>
  );
}
