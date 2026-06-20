import { scoreDomainCredibility, normaliseWebResults, mockWebSearchEvidence } from '../src/web-search'

describe('scoreDomainCredibility', () => {
  it('ranks high-trust domains above medium above unknown', () => {
    const high = scoreDomainCredibility('https://www.ons.gov.uk/data')
    const medium = scoreDomainCredibility('https://www.theguardian.com/politics')
    const unknown = scoreDomainCredibility('https://random-blog.example.com/post')
    expect(high).toBeGreaterThan(medium)
    expect(medium).toBeGreaterThan(unknown)
  })

  it('boosts government/academic TLDs', () => {
    expect(scoreDomainCredibility('https://example.ac.uk/paper')).toBeGreaterThan(
      scoreDomainCredibility('https://example.com/paper'),
    )
  })

  it('handles malformed URLs without throwing', () => {
    expect(scoreDomainCredibility('not a url')).toBeGreaterThanOrEqual(0)
  })
})

describe('normaliseWebResults', () => {
  it('maps results into RetrievedChunk shape with web tier', () => {
    const { chunks, sourceMetadata, tierBySourceId } = normaliseWebResults([
      { title: 'A', url: 'https://www.bbc.co.uk/news/a', content: 'evidence text', score: 0.9 },
      { title: 'B', url: 'https://blog.example.com/b', content: 'weak text', score: 0.3 },
    ])
    expect(chunks).toHaveLength(2)
    chunks.forEach((c) => {
      expect(c.source_id.startsWith('web:')).toBe(true)
      expect(tierBySourceId[c.source_id]).toBe('web')
      expect(sourceMetadata[c.source_id]).toBeDefined()
    })
    // BBC (higher credibility + relevance) should out-rank the blog.
    const bbc = chunks.find((c) => sourceMetadata[c.source_id].publisher.includes('bbc'))!
    const blog = chunks.find((c) => sourceMetadata[c.source_id].publisher.includes('example'))!
    expect(bbc.rrf_score).toBeGreaterThan(blog.rrf_score)
  })

  it('drops results without url or content', () => {
    const { chunks } = normaliseWebResults([
      { url: 'https://x.com/a', content: '' },
      { url: '', content: 'text' } as any,
    ])
    expect(chunks).toHaveLength(0)
  })
})

describe('mockWebSearchEvidence', () => {
  it('returns deterministic fixtures', () => {
    const a = mockWebSearchEvidence('did unemployment fall?')
    expect(a.chunks.length).toBeGreaterThan(0)
  })

  it('returns nothing for explicit no-evidence queries', () => {
    expect(mockWebSearchEvidence('no evidence here').chunks).toHaveLength(0)
  })
})
