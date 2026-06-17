import { analyseTemporal } from '../src/temporal'

describe('analyseTemporal', () => {
  it('returns nulls for insufficient data', () => {
    const r = analyseTemporal([1, 2])
    expect(r.interval_irregularity).toBeNull()
    expect(r.uniform_intervals).toBe(false)
  })

  it('flags perfectly uniform intervals as suspicious', () => {
    const r = analyseTemporal([2, 2, 2, 2, 2])
    expect(r.uniform_intervals).toBe(true)
    expect(r.interval_irregularity).toBe(0)
  })

  it('computes irregularity for natural intervals', () => {
    const r = analyseTemporal([3.2, 5.1, 2.8, 4.4])
    expect(r.uniform_intervals).toBe(false)
    expect(r.interval_irregularity).toBeGreaterThan(0)
  })

  it('passes through null', () => {
    expect(analyseTemporal(null).clip_transition_intervals).toBeNull()
  })
})
