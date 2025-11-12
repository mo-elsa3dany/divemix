import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://divemix-app.vercel.app'
  ).replace(/\/+$/, '');
  const now = new Date();
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 0.9, lastModified: now },
    {
      url: `${base}/planner`,
      changeFrequency: 'monthly',
      priority: 0.7,
      lastModified: now,
    },
    {
      url: `${base}/nitrox`,
      changeFrequency: 'monthly',
      priority: 0.6,
      lastModified: now,
    },
    {
      url: `${base}/trimix`,
      changeFrequency: 'monthly',
      priority: 0.6,
      lastModified: now,
    },
    {
      url: `${base}/pricing`,
      changeFrequency: 'yearly',
      priority: 0.3,
      lastModified: now,
    },
    {
      url: `${base}/status`,
      changeFrequency: 'yearly',
      priority: 0.1,
      lastModified: now,
    },
  ];
}
