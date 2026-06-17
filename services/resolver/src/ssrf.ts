import { lookup } from 'node:dns/promises'
import net from 'node:net'

/**
 * Server-side SSRF guard. The web tier already runs a lightweight pre-check,
 * but the resolver is the component that actually performs network fetches, so
 * it must independently resolve the hostname and reject private/loopback/link-
 * local/reserved address space before connecting.
 */

const BLOCKED_V4 = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local (AWS metadata 169.254.169.254)
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved
] as const

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0
}

function inCidrV4(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask)
}

export function isBlockedAddress(addr: string): boolean {
  const type = net.isIP(addr)
  if (type === 4) {
    return BLOCKED_V4.some(([base, bits]) => inCidrV4(addr, base, bits))
  }
  if (type === 6) {
    const a = addr.toLowerCase()
    if (a === '::1' || a === '::') return true
    if (a.startsWith('fe80') || a.startsWith('fc') || a.startsWith('fd')) return true // link-local + ULA
    // IPv4-mapped (::ffff:a.b.c.d)
    const mapped = a.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isBlockedAddress(mapped[1])
    return false
  }
  return true // not a literal IP — caller should resolve first
}

export interface UrlCheckResult {
  ok: boolean
  reason?: string
  resolvedIp?: string
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const MAX_URL_LENGTH = 2048

/** Validate a URL and confirm every resolved address is public. */
export async function assertPublicUrl(raw: string): Promise<UrlCheckResult> {
  if (!raw || raw.length > MAX_URL_LENGTH) return { ok: false, reason: 'invalid url length' }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, reason: 'malformed url' }
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return { ok: false, reason: 'protocol not allowed' }
  if (url.username || url.password) return { ok: false, reason: 'credentials in url not allowed' }

  const host = url.hostname
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    return { ok: false, reason: 'blocked host' }
  }

  // If host is a literal IP, check directly. Otherwise resolve all A/AAAA records.
  if (net.isIP(host)) {
    if (isBlockedAddress(host)) return { ok: false, reason: 'private/reserved address' }
    return { ok: true, resolvedIp: host }
  }

  let records: { address: string }[]
  try {
    records = await lookup(host, { all: true })
  } catch {
    return { ok: false, reason: 'dns resolution failed' }
  }
  if (records.length === 0) return { ok: false, reason: 'no dns records' }
  for (const rec of records) {
    if (isBlockedAddress(rec.address)) return { ok: false, reason: 'resolves to private/reserved address' }
  }
  return { ok: true, resolvedIp: records[0].address }
}
