import { isMockMode, seededUnit, seededPick } from '../src/mock'

describe('mock helpers', () => {
  describe('isMockMode', () => {
    const prev = process.env.MOCK_SERVICES
    afterEach(() => {
      if (prev === undefined) delete process.env.MOCK_SERVICES
      else process.env.MOCK_SERVICES = prev
    })

    it('is off by default / when unset', () => {
      delete process.env.MOCK_SERVICES
      delete process.env.NEXT_PUBLIC_MOCK_SERVICES
      expect(isMockMode()).toBe(false)
    })

    it('is on for "1" and "true"', () => {
      process.env.MOCK_SERVICES = '1'
      expect(isMockMode()).toBe(true)
      process.env.MOCK_SERVICES = 'true'
      expect(isMockMode()).toBe(true)
      process.env.MOCK_SERVICES = '0'
      expect(isMockMode()).toBe(false)
    })
  })

  describe('seededUnit', () => {
    it('is deterministic and within [0, 1)', () => {
      const a = seededUnit('hello')
      const b = seededUnit('hello')
      expect(a).toBe(b)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThan(1)
    })

    it('varies by input', () => {
      expect(seededUnit('a')).not.toBe(seededUnit('b'))
    })
  })

  describe('seededPick', () => {
    it('picks deterministically from a list', () => {
      const items = ['x', 'y', 'z'] as const
      expect(seededPick('seed', items)).toBe(seededPick('seed', items))
      expect(items).toContain(seededPick('anything', items))
    })
  })
})
