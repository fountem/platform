import { chunkDocument } from '../src/chunker'

const SAMPLE_TEXT = `The UK housing market saw significant changes in 2024. According to the Office for National Statistics, housing starts fell by 8.2% compared to 2023. This represents the largest annual decline since 2008.

The government's planning reform programme, introduced in late 2023, aimed to increase housing delivery. However, the data suggests the reforms have not yet translated into increased construction activity.

Local authorities approved 245,000 planning applications in 2024, down from 267,000 in 2023. The shortfall is concentrated in the South East and London, where land constraints are most acute. New figures from MHCLG confirm the trend is continuing into 2025.`

describe('chunkDocument', () => {
  it('returns at least one chunk', () => {
    const chunks = chunkDocument(SAMPLE_TEXT)
    expect(chunks.length).toBeGreaterThan(0)
  })

  it('each chunk has content and index', () => {
    const chunks = chunkDocument(SAMPLE_TEXT)
    chunks.forEach((chunk, i) => {
      expect(chunk.content).toBeTruthy()
      expect(chunk.chunkIndex).toBe(i)
      expect(chunk.estimatedTokens).toBeGreaterThan(0)
    })
  })

  it('chunks do not exceed MAX_TOKENS threshold roughly', () => {
    const longText = SAMPLE_TEXT.repeat(10)
    const chunks = chunkDocument(longText)
    chunks.forEach(chunk => {
      // Rough check: 300 tokens * 4 chars = 1200 chars max per chunk
      expect(chunk.content.length).toBeLessThan(2000)
    })
  })

  it('preserves content across all chunks', () => {
    const chunks = chunkDocument(SAMPLE_TEXT)
    const allText = chunks.map(c => c.content).join(' ')
    // Key facts should be in the combined output
    expect(allText).toContain('8.2%')
    expect(allText).toContain('245,000')
  })

  it('handles empty string', () => {
    expect(chunkDocument('')).toEqual([])
  })

  it('handles single short sentence', () => {
    const chunks = chunkDocument('Housing starts fell in 2024.')
    expect(chunks.length).toBeLessThanOrEqual(1)
  })
})
