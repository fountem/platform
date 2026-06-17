import { validateSubmittedUrl } from '../src/url-guard'

describe('validateSubmittedUrl', () => {
  it('accepts a normal https URL', () => {
    expect(validateSubmittedUrl('https://youtube.com/watch?v=abc').ok).toBe(true)
  })

  it('rejects non-http schemes', () => {
    expect(validateSubmittedUrl('file:///etc/passwd').ok).toBe(false)
    expect(validateSubmittedUrl('ftp://example.com/x').ok).toBe(false)
  })

  it('blocks localhost and loopback', () => {
    expect(validateSubmittedUrl('http://localhost/x').ok).toBe(false)
    expect(validateSubmittedUrl('http://127.0.0.1/x').ok).toBe(false)
  })

  it('blocks the cloud metadata endpoint', () => {
    expect(validateSubmittedUrl('http://169.254.169.254/latest/meta-data/').ok).toBe(false)
  })

  it('blocks private ranges including 172.16-31', () => {
    expect(validateSubmittedUrl('http://10.0.0.5/x').ok).toBe(false)
    expect(validateSubmittedUrl('http://192.168.1.1/x').ok).toBe(false)
    expect(validateSubmittedUrl('http://172.20.0.1/x').ok).toBe(false)
    expect(validateSubmittedUrl('http://172.15.0.1/x').ok).toBe(true) // outside private range
  })

  it('rejects garbage and over-long input', () => {
    expect(validateSubmittedUrl('not a url').ok).toBe(false)
    expect(validateSubmittedUrl('https://x.com/' + 'a'.repeat(3000)).ok).toBe(false)
  })
})
