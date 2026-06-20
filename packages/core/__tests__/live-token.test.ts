import { signLiveToken, verifyLiveToken } from '../src/live-token'

const SECRET = 'test-secret-key'

describe('live-token', () => {
  it('round-trips a valid token', () => {
    const token = signLiveToken({ sid: 'session-1', uid: 'user-1' }, SECRET)
    const payload = verifyLiveToken(token, SECRET)
    expect(payload).not.toBeNull()
    expect(payload!.sid).toBe('session-1')
    expect(payload!.uid).toBe('user-1')
    expect(payload!.exp).toBeGreaterThan(payload!.iat)
  })

  it('rejects a tampered token', () => {
    const token = signLiveToken({ sid: 'session-1', uid: 'user-1' }, SECRET)
    const tampered = token.slice(0, -2) + 'xy'
    expect(verifyLiveToken(tampered, SECRET)).toBeNull()
  })

  it('rejects a token signed with another secret', () => {
    const token = signLiveToken({ sid: 's', uid: null }, SECRET)
    expect(verifyLiveToken(token, 'other-secret')).toBeNull()
  })

  it('rejects an expired token', () => {
    const token = signLiveToken({ sid: 's', uid: null }, SECRET, -1)
    expect(verifyLiveToken(token, SECRET)).toBeNull()
  })

  it('rejects malformed input', () => {
    expect(verifyLiveToken('garbage', SECRET)).toBeNull()
    expect(verifyLiveToken('a.b.c', SECRET)).toBeNull()
  })
})
