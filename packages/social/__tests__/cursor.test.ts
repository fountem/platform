import { nextSinceId, pickBatch } from '../src/cursor'

describe('nextSinceId', () => {
  it('returns the numerically largest id (not lexicographic)', () => {
    // Lexicographically "9" > "10", so a string sort would regress the cursor.
    expect(nextSinceId(undefined, ['9', '10', '100'])).toBe('100')
  })

  it('never moves the cursor backwards from its current value', () => {
    expect(nextSinceId('500', ['100', '200'])).toBe('500')
    expect(nextSinceId('500', ['600'])).toBe('600')
  })

  it('keeps the current cursor when there are no new ids', () => {
    expect(nextSinceId('123', [])).toBe('123')
    expect(nextSinceId(undefined, [])).toBeUndefined()
  })

  it('handles very large (BigInt-range) ids', () => {
    const a = '1718000000000000000'
    const b = '1718000000000000001'
    expect(nextSinceId(a, [b])).toBe(b)
  })

  it('ignores malformed ids', () => {
    expect(nextSinceId('10', ['not-a-number', '20'])).toBe('20')
  })
})

describe('pickBatch', () => {
  it('returns the oldest ids first, capped to max', () => {
    expect(pickBatch(['30', '10', '20', '40'], 2)).toEqual(['10', '20'])
  })

  it('orders numerically, not lexicographically', () => {
    expect(pickBatch(['100', '9', '20'], 3)).toEqual(['9', '20', '100'])
  })

  it('returns all (sorted) when max exceeds count', () => {
    expect(pickBatch(['2', '1'], 10)).toEqual(['1', '2'])
  })

  it('drains backlog incrementally so newer ids are not skipped', () => {
    const all = ['1', '2', '3', '4', '5']
    const first = pickBatch(all, 2)
    expect(first).toEqual(['1', '2'])
    const cursor = nextSinceId(undefined, first)
    expect(cursor).toBe('2')
    const remaining = all.filter(id => BigInt(id) > BigInt(cursor!))
    expect(pickBatch(remaining, 2)).toEqual(['3', '4'])
  })

  it('drops malformed ids', () => {
    expect(pickBatch(['x', '2', '1'], 5)).toEqual(['1', '2'])
  })
})
