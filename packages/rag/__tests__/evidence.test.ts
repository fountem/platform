import type { SourceCitation } from '@fountem/db'

describe('gatherEvidence (mock mode)', () => {
  const ORIGINAL = process.env.MOCK_SERVICES
  beforeAll(() => {
    process.env.MOCK_SERVICES = '1'
  })
  afterAll(() => {
    process.env.MOCK_SERVICES = ORIGINAL
  })

  it('returns corpus chunks tagged primary', async () => {
    const { gatherEvidence } = await import('../src/evidence')
    const res = await gatherEvidence({ query: 'did housing supply rise?', dbClient: {}, allowWeb: false })
    expect(res.chunks.length).toBeGreaterThan(0)
    res.chunks.forEach((c) => expect(res.tierBySourceId[c.source_id]).toBe('primary'))
    expect(res.usedWeb).toBe(false)
  })

  it('augments with web when forceWeb is set', async () => {
    const { gatherEvidence } = await import('../src/evidence')
    const res = await gatherEvidence({ query: 'did housing supply rise?', dbClient: {}, forceWeb: true })
    expect(res.usedWeb).toBe(true)
    const webChunks = res.chunks.filter((c) => res.tierBySourceId[c.source_id] === 'web')
    expect(webChunks.length).toBeGreaterThan(0)
    // Corpus should still out-rank web after re-ranking.
    expect(res.chunks[0].source_id.startsWith('web:')).toBe(false)
  })
})

describe('applyCitationTiers', () => {
  it('stamps citations with the tier of their source', async () => {
    const { applyCitationTiers } = await import('../src/evidence')
    const chunks = [
      { id: 'c1', content: '', source_id: 's-primary', topic_tags: [], bm25_rank: 0, vector_rank: 0, rrf_score: 0.5 },
      { id: 'c2', content: '', source_id: 'web:abc', topic_tags: [], bm25_rank: null, vector_rank: null, rrf_score: 0.01 },
    ]
    const citations: SourceCitation[] = [
      { chunk_id: 'c1', source_title: 'ONS', source_url: '', publisher: 'ONS', published_at: '', excerpt: '' },
      { chunk_id: 'c2', source_title: 'BBC', source_url: '', publisher: 'bbc.co.uk', published_at: '', excerpt: '' },
    ]
    const tiered = applyCitationTiers(citations, chunks as any, { 's-primary': 'primary', 'web:abc': 'web' })
    expect(tiered[0].source_tier).toBe('primary')
    expect(tiered[1].source_tier).toBe('web')
  })

  it('defaults unknown chunks to primary', async () => {
    const { applyCitationTiers } = await import('../src/evidence')
    const tiered = applyCitationTiers(
      [{ chunk_id: 'missing', source_title: '', source_url: '', publisher: '', published_at: '', excerpt: '' }],
      [],
      {},
    )
    expect(tiered[0].source_tier).toBe('primary')
  })
})
