/**
 * Open-web evidence layer.
 *
 * The closed corpus (ONS/IFS/Hansard) can't cover fresh or general claims —
 * essential for live debates. This module fetches live web evidence (Tavily)
 * and normalises it into the SAME `RetrievedChunk` + `sourceMetadata` shape the
 * Claude verdict engine already consumes, so nothing downstream changes.
 *
 * Web evidence is tagged `source_tier: 'web'` and scored for domain credibility
 * so it is weighted BELOW the trusted primary corpus.
 */

import { createHash } from 'crypto'
import type { SourceTier } from '@fountem/db'
import type { RetrievedChunk } from './retriever'
import { isMockMode } from './mock'

export interface WebSourceMeta {
  title: string
  url: string
  publisher: string
  published_at: string
}

export interface WebEvidence {
  chunks: RetrievedChunk[]
  sourceMetadata: Record<string, WebSourceMeta>
  /** source_id → tier. Always 'web' here; merged with corpus tiers upstream. */
  tierBySourceId: Record<string, SourceTier>
}

export interface WebSearchOptions {
  limit?: number
  /** Bias the search toward recent material (good for live debates). */
  recencyDays?: number
  fetchImpl?: typeof fetch
}

/**
 * Domains we trust more for factual corroboration. Returns a 0–1 credibility
 * multiplier; higher means the source counts for more in fusion/ranking.
 * This is a coarse heuristic, not an editorial ranking.
 */
const HIGH_TRUST_DOMAINS = [
  'ons.gov.uk', 'ifs.org.uk', 'parliament.uk', 'hansard.parliament.uk', 'nao.org.uk',
  'gov.uk', 'bankofengland.co.uk', 'oecd.org', 'imf.org', 'who.int', 'un.org',
  'fullfact.org', 'bbc.co.uk', 'reuters.com', 'apnews.com', 'ft.com',
  'nature.com', 'science.org', 'thelancet.com',
]
const MEDIUM_TRUST_DOMAINS = [
  'theguardian.com', 'telegraph.co.uk', 'economist.com', 'nytimes.com',
  'washingtonpost.com', 'sky.com', 'independent.co.uk', 'wikipedia.org',
]

export function scoreDomainCredibility(url: string): number {
  let host: string
  try {
    host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return 0.3
  }
  const matches = (d: string) => host === d || host.endsWith(`.${d}`)
  if (HIGH_TRUST_DOMAINS.some(matches)) return 1
  if (MEDIUM_TRUST_DOMAINS.some(matches)) return 0.7
  // Government/academic TLDs get a modest boost.
  if (/\.(gov|gov\.uk|ac\.uk|edu)$/.test(host)) return 0.85
  return 0.45
}

function publisherFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'web source'
  }
}

function webSourceId(url: string): string {
  return `web:${createHash('sha256').update(url).digest('hex').slice(0, 16)}`
}

interface TavilyResult {
  title?: string
  url: string
  content?: string
  published_date?: string
  score?: number
}

/** Fetch open-web evidence and normalise into RetrievedChunk shape. */
export async function webSearchEvidence(
  query: string,
  opts: WebSearchOptions = {},
): Promise<WebEvidence> {
  const limit = opts.limit ?? 5
  if (isMockMode()) return mockWebSearchEvidence(query, limit)

  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return { chunks: [], sourceMetadata: {}, tierBySourceId: {} }

  const fetchImpl = opts.fetchImpl ?? fetch
  let results: TavilyResult[] = []
  try {
    const res = await fetchImpl('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        max_results: limit,
        include_answer: false,
        ...(opts.recencyDays ? { days: opts.recencyDays, topic: 'news' } : {}),
      }),
    })
    if (!res.ok) return { chunks: [], sourceMetadata: {}, tierBySourceId: {} }
    const data = (await res.json()) as { results?: TavilyResult[] }
    results = data.results ?? []
  } catch {
    return { chunks: [], sourceMetadata: {}, tierBySourceId: {} }
  }

  return normaliseWebResults(results)
}

export function normaliseWebResults(results: TavilyResult[]): WebEvidence {
  const chunks: RetrievedChunk[] = []
  const sourceMetadata: Record<string, WebSourceMeta> = {}
  const tierBySourceId: Record<string, SourceTier> = {}

  results
    .filter((r) => r.url && r.content)
    .forEach((r) => {
      const sourceId = webSourceId(r.url)
      const credibility = scoreDomainCredibility(r.url)
      // Blend retrieval relevance with domain credibility; keep web below the
      // corpus by capping the contribution (corpus chunks use raw RRF ~0.016+).
      const relevance = typeof r.score === 'number' ? Math.max(0, Math.min(1, r.score)) : 0.5
      chunks.push({
        id: `${sourceId}:0`,
        content: (r.content ?? '').slice(0, 1200),
        source_id: sourceId,
        topic_tags: [],
        bm25_rank: null,
        vector_rank: null,
        rrf_score: 0.012 * (0.5 * relevance + 0.5 * credibility),
      })
      sourceMetadata[sourceId] = {
        title: r.title ?? publisherFromUrl(r.url),
        url: r.url,
        publisher: publisherFromUrl(r.url),
        published_at: r.published_date ?? '',
      }
      tierBySourceId[sourceId] = 'web'
    })

  return { chunks, sourceMetadata, tierBySourceId }
}

// ── Mock ────────────────────────────────────────────────────────────────────

export function mockWebSearchEvidence(query: string, limit = 5): WebEvidence {
  if (/no evidence|gibberish|asdf/i.test(query)) {
    return { chunks: [], sourceMetadata: {}, tierBySourceId: {} }
  }
  const fixtures: TavilyResult[] = [
    {
      title: 'Reuters — fact check and reporting',
      url: 'https://www.reuters.com/fact-check/example',
      content:
        'Reporting and contemporaneous records indicate the figure cited is broadly consistent with official releases, though the framing omits relevant context about the comparison period.',
      published_date: '2026-06-18',
      score: 0.82,
    },
    {
      title: 'Full Fact — claim review',
      url: 'https://fullfact.org/example-claim',
      content:
        'An independent fact-check of a similar statement found it to be partly accurate but missing important caveats around the baseline used.',
      published_date: '2026-06-15',
      score: 0.74,
    },
    {
      title: 'Personal blog — opinion',
      url: 'https://someblog.example.com/post',
      content: 'A commentary piece asserting the claim is completely true, without citing primary sources.',
      published_date: '2026-06-10',
      score: 0.4,
    },
  ]
  return normaliseWebResults(fixtures.slice(0, limit))
}
