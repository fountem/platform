import { extractMediaUrl, formatReply } from '../src/format'

describe('extractMediaUrl', () => {
  it('extracts the first http(s) URL from text', () => {
    expect(extractMediaUrl('@unfaked is this real? https://t.co/abc123')).toBe('https://t.co/abc123')
    expect(extractMediaUrl('https://youtube.com/watch?v=test @unfaked')).toBe('https://youtube.com/watch?v=test')
  })

  it('returns null when there is no URL', () => {
    expect(extractMediaUrl('@unfaked check this out')).toBeNull()
    expect(extractMediaUrl('')).toBeNull()
  })
})

describe('formatReply', () => {
  it('renders share text, verdict + confidence, and the pack URL', () => {
    const reply = formatReply({
      share_text: 'We checked this clip.',
      verdict_label: 'AI generated',
      confidence_pct: 91,
      correction_pack_url: 'https://unfaked.ai/check/abc12345',
    })
    expect(reply).toContain('We checked this clip.')
    expect(reply).toContain('Verdict: AI generated (91% confidence)')
    expect(reply).toContain('unfaked.ai/check/abc12345')
  })
})
