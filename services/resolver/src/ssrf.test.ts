import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertPublicUrl, isBlockedAddress } from './ssrf.js'

test('blocks loopback and private ranges', () => {
  assert.equal(isBlockedAddress('127.0.0.1'), true)
  assert.equal(isBlockedAddress('10.1.2.3'), true)
  assert.equal(isBlockedAddress('192.168.0.5'), true)
  assert.equal(isBlockedAddress('172.16.5.5'), true)
  assert.equal(isBlockedAddress('169.254.169.254'), true) // cloud metadata
  assert.equal(isBlockedAddress('100.64.0.1'), true) // CGNAT
})

test('allows public addresses', () => {
  assert.equal(isBlockedAddress('8.8.8.8'), false)
  assert.equal(isBlockedAddress('1.1.1.1'), false)
})

test('blocks IPv6 loopback / ULA / link-local', () => {
  assert.equal(isBlockedAddress('::1'), true)
  assert.equal(isBlockedAddress('fd00::1'), true)
  assert.equal(isBlockedAddress('fe80::1'), true)
  assert.equal(isBlockedAddress('::ffff:127.0.0.1'), true)
})

test('rejects non-http protocols and credentials', async () => {
  assert.equal((await assertPublicUrl('file:///etc/passwd')).ok, false)
  assert.equal((await assertPublicUrl('ftp://example.com/x')).ok, false)
  assert.equal((await assertPublicUrl('http://user:pass@example.com')).ok, false)
  assert.equal((await assertPublicUrl('http://localhost/x')).ok, false)
})

test('rejects literal private IP URLs', async () => {
  assert.equal((await assertPublicUrl('http://169.254.169.254/latest/meta-data')).ok, false)
  assert.equal((await assertPublicUrl('http://127.0.0.1:8080')).ok, false)
})
