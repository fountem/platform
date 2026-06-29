import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_FOUNTEM_URL ?? 'https://fountem.ai'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/login', '/api', '/auth'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
