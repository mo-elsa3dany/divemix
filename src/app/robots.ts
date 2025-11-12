import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const host = 'divemix-app.vercel.app';
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `https://${host}/sitemap.xml`,
    host: `https://${host}`,
  };
}
