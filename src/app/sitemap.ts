import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://divemix-app.vercel.app'\;
  return [
    { url: `${base}/`,         changefreq: 'weekly',  priority: 0.9 },
    { url: `${base}/planner`,  changefreq: 'monthly', priority: 0.7 },
    { url: `${base}/nitrox`,   changefreq: 'monthly', priority: 0.6 },
    { url: `${base}/trimix`,   changefreq: 'monthly', priority: 0.6 },
    { url: `${base}/pricing`,  changefreq: 'yearly',  priority: 0.3 },
    { url: `${base}/status`,   changefreq: 'yearly',  priority: 0.1 },
  ];
}
