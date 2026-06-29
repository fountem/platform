import { mapToLiveStatus, verifyLiveClaim } from '../src/verify-worker'

describe('mapToLiveStatus', () => {
  it('maps the 8-value scale onto the live vocabulary', () => {
    expect(mapToLiveStatus('true')).toBe('supported')
    expect(mapToLiveStatus('mostly_true')).toBe('supported')
    expect(mapToLiveStatus('false')).toBe('disputed')
    expect(mapToLiveStatus('mostly_false')).toBe('disputed')
    expect(mapToLiveStatus('half_true')).toBe('needs_context')
    expect(mapToLiveStatus('misleading')).toBe('needs_context')
    expect(mapToLiveStatus('unverifiable')).toBe('unverifiable')
    expect(mapToLiveStatus('inconclusive')).toBe('unverifiable')
  })
})

describe('verifyLiveClaim (mock mode)', () => {
  const ORIGINAL = process.env.MOCK_SERVICES
  beforeAll(() => {
    process.env.MOCK_SERVICES = '1'
  })
  afterAll(() => {
    process.env.MOCK_SERVICES = ORIGINAL
  })

  it('returns a provisional verdict with citations', async () => {
    const v = await verifyLiveClaim('Unemployment fell to 4 percent', { dbClient: {} })
    expect(['supported', 'disputed', 'needs_context', 'unverifiable']).toContain(v.status)
    expect(v.citations.length).toBeGreaterThan(0)
    expect(v.confidencePct).toBeGreaterThanOrEqual(0)
  })
})
