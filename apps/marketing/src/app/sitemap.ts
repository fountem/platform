import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://fountem.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
