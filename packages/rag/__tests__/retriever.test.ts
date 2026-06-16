import { embedQuery } from '../src/retriever'

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.1) }],
      }),
    },
  }))
})

describe('embedQuery', () => {
  it('returns an array of 1536 floats', async () => {
    const embedding = await embedQuery('housing starts 2024')
    expect(Array.isArray(embedding)).toBe(true)
    expect(embedding).toHaveLength(1536)
    expect(typeof embedding[0]).toBe('number')
  })
})
