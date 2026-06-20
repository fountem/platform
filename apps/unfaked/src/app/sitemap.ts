import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://unfaked.ai'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/cases', changeFrequency: 'daily', priority: 0.9 },
    { path: '/methodology', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/acceptable-use', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/cookies', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/disclaimer', changeFrequency: 'yearly', priority: 0.3 },
  ]

  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
