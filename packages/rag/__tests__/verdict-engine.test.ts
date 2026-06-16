import { generateVerdict } from '../src/verdict-engine'
import type { RetrievedChunk } from '../src/retriever'

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              verdict: 'false',
              confidence_pct: 87,
              summary: 'Housing starts fell, not rose, according to ONS data.',
              reasoning: 'The ONS data clearly shows an 8.2% decline in housing starts in 2024.',
              what_would_change_this: 'Revised ONS data showing an increase would change this verdict.',
            }),
            citations: [],
          },
        ],
        usage: { input_tokens: 1500, output_tokens: 280 },
      }),
    },
  }))
})

const mockChunks: RetrievedChunk[] = [
  {
    id: 'chunk_001',
    content: 'Housing starts fell by 8.2% in 2024 according to ONS data.',
    source_id: 'src_001',
    topic_tags: ['housing'],
    bm25_rank: 0,
    vector_rank: 0,
    rrf_score: 0.03,
  },
]

const mockSourceMeta = {
  src_001: {
    title: 'ONS Housing Statistics 2024',
    url: 'https://ons.gov.uk/housing/2024',
    publisher: 'Office for National Statistics',
    published_at: '2025-03-01',
  },
}

describe('generateVerdict', () => {
  it('returns unverifiable when no chunks provided', async () => {
    const result = await generateVerdict('Some claim', [], {})
    expect(result.verdict).toBe('unverifiable')
    expect(result.confidence_pct).toBe(0)
  })

  it('calls Claude and returns structured verdict', async () => {
    const result = await generateVerdict(
      'Housing starts rose by 12% since 2024.',
      mockChunks,
      mockSourceMeta
    )
    expect(result.verdict).toBe('false')
    expect(result.confidence_pct).toBe(87)
    expect(result.summary).toContain('fell')
    expect(result.evidence_chunk_ids).toContain('chunk_001')
    expect(result.prompt_tokens).toBe(1500)
  })
})
