import { mockRetrieve, mockGenerateVerdict } from '../src/mock'

const VALID_VERDICTS = ['true', 'mostly_true', 'half_true', 'mostly_false', 'false', 'misleading', 'unverifiable', 'inconclusive']

describe('rag mock fixtures', () => {
  it('mockRetrieve returns evidence for a normal claim', () => {
    const { chunks, sourceMetadata } = mockRetrieve('NHS waiting lists have fallen')
    expect(chunks.length).toBeGreaterThan(0)
    expect(Object.keys(sourceMetadata).length).toBeGreaterThan(0)
  })

  it('mockRetrieve returns nothing for "no evidence" queries', () => {
    expect(mockRetrieve('no evidence for this').chunks).toHaveLength(0)
  })

  it('mockGenerateVerdict returns unverifiable with no chunks', () => {
    const r = mockGenerateVerdict('some claim', [], {})
    expect(r.verdict).toBe('unverifiable')
    expect(r.source_citations).toHaveLength(0)
  })

  it('mockGenerateVerdict is deterministic and cites sources', () => {
    const { chunks, sourceMetadata } = mockRetrieve('the economy grew last year')
    const a = mockGenerateVerdict('the economy grew last year', chunks, sourceMetadata)
    const b = mockGenerateVerdict('the economy grew last year', chunks, sourceMetadata)
    expect(a.verdict).toBe(b.verdict)
    expect(VALID_VERDICTS).toContain(a.verdict)
    expect(a.source_citations.length).toBeGreaterThan(0)
    expect(a.evidence_chunk_ids.length).toBe(chunks.length)
  })

  it('superlative claims skew to misleading', () => {
    const { chunks, sourceMetadata } = mockRetrieve('UK has the highest growth ever recorded')
    const r = mockGenerateVerdict('UK has the highest growth ever recorded', chunks, sourceMetadata)
    expect(r.verdict).toBe('misleading')
  })
})
