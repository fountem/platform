import { captureException } from '../src/monitoring'

describe('captureException', () => {
  const original = console.error
  afterEach(() => {
    console.error = original
    delete process.env.SENTRY_DSN
  })

  it('logs a structured JSON line', () => {
    const lines: string[] = []
    console.error = (msg?: unknown) => lines.push(String(msg))
    captureException(new Error('boom'), { route: 'test' })
    expect(lines).toHaveLength(1)
    const parsed = JSON.parse(lines[0])
    expect(parsed.message).toBe('boom')
    expect(parsed.route).toBe('test')
    expect(parsed.level).toBe('error')
  })

  it('handles non-Error values', () => {
    console.error = () => {}
    expect(() => captureException('plain string')).not.toThrow()
  })
})
