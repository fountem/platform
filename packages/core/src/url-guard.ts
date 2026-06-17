/**
 * First-line URL validation for user-submitted media URLs.
 *
 * This is a cheap pre-check in the web tier. The AUTHORITATIVE SSRF defence runs in
 * the AWS resolver service, which resolves DNS and blocks private/link-local IPs and
 * the cloud metadata endpoint after resolution. We duplicate the obvious checks here
 * so we can reject junk early without a round-trip.
 */

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./, // link-local + AWS/GCP metadata (169.254.169.254)
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

// 172.16.0.0 – 172.31.255.255 (private range)
function isPrivate172(host: string): boolean {
  const m = host.match(/^172\.(\d{1,3})\./)
  if (!m) return false
  const second = Number(m[1])
  return second >= 16 && second <= 31
}

export interface UrlValidationResult {
  ok: boolean
  reason?: string
  url?: URL
}

export function validateSubmittedUrl(raw: string, maxLength = 2048): UrlValidationResult {
  if (!raw || raw.length > maxLength) return { ok: false, reason: 'URL missing or too long' }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, reason: 'Not a valid URL' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http(s) URLs are allowed' }
  }

  const host = url.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets
  if (BLOCKED_HOST_PATTERNS.some((p) => p.test(host)) || isPrivate172(host)) {
    return { ok: false, reason: 'URL host is not permitted' }
  }

  return { ok: true, url }
}
