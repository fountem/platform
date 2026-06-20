import type { MetadataRoute } from 'next'
import { PARTIES } from '../data/parties'

const base = process.env.NEXT_PUBLIC_FOUNTEM_URL ?? 'https://fountem.ai'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/check', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/parties', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/methodology', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/acceptable-use', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/cookies', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/disclaimer', changeFrequency: 'yearly', priority: 0.3 },
  ]

  const partyRoutes = PARTIES.map((p) => ({
    path: `/parties/${p.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...partyRoutes].map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
