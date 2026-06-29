import { deepgramStreamUrl, parseDeepgramMessage, mockTranscribe } from '../src/asr'

describe('deepgramStreamUrl', () => {
  it('includes diarization and nova-3 by default', () => {
    const url = deepgramStreamUrl()
    expect(url).toContain('wss://api.deepgram.com/v1/listen')
    expect(url).toContain('model=nova-3')
    expect(url).toContain('diarize=true')
  })
  it('honours overrides', () => {
    expect(deepgramStreamUrl({ model: 'nova-2', language: 'es' })).toContain('model=nova-2')
  })
})

describe('parseDeepgramMessage', () => {
  it('parses a final transcript with speaker', () => {
    const seg = parseDeepgramMessage({
      type: 'Results',
      is_final: true,
      start: 1.0,
      duration: 2.0,
      channel: { alternatives: [{ transcript: 'Unemployment fell to 4 percent.', words: [{ speaker: 1, start: 1.0 }] }] },
    })
    expect(seg).not.toBeNull()
    expect(seg!.text).toContain('Unemployment')
    expect(seg!.speaker).toBe('Speaker 1')
    expect(seg!.isFinal).toBe(true)
    expect(seg!.tsStartMs).toBe(1000)
    expect(seg!.tsEndMs).toBe(3000)
  })

  it('returns null for empty transcripts and non-result messages', () => {
    expect(parseDeepgramMessage({ type: 'Metadata' })).toBeNull()
    expect(parseDeepgramMessage({ type: 'Results', channel: { alternatives: [{ transcript: '' }] } })).toBeNull()
    expect(parseDeepgramMessage('not json')).toBeNull()
  })
})

describe('mockTranscribe', () => {
  it('splits text into finalised segments', () => {
    const segs = mockTranscribe('Hello there. Unemployment fell. What about housing?')
    expect(segs.length).toBe(3)
    expect(segs.every((s) => s.isFinal)).toBe(true)
    expect(segs[1].tsStartMs).toBeGreaterThanOrEqual(segs[0].tsEndMs)
  })
})
