import type { PlatformAdapter, SocialMention } from '@fountem/social'

// X (Twitter) adapter: polls the @unfaked account's mentions and posts replies
// via X API v2 with OAuth 1.0a (HMAC-SHA1) user-context auth.

const X_API_KEY = process.env.X_API_KEY
const X_API_SECRET = process.env.X_API_SECRET
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET
const BOT_USER_ID = process.env.X_BOT_USER_ID ?? '' // numeric id of the @unfaked account

async function signRequest(method: string, url: string, params: Record<string, string>): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: X_API_KEY!,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: X_ACCESS_TOKEN!,
    oauth_version: '1.0',
  }

  const allParams = { ...params, ...oauthParams }
  const paramString = Object.keys(allParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&')

  const baseString = [method.toUpperCase(), encodeURIComponent(url), encodeURIComponent(paramString)].join('&')
  const signingKey = `${encodeURIComponent(X_API_SECRET!)}&${encodeURIComponent(X_ACCESS_TOKEN_SECRET!)}`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(signingKey), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(baseString))
  const oauthSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))

  oauthParams.oauth_signature = oauthSignature
  return 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ')
}

/** Builds the X platform adapter. `id` doubles as the idempotency cursor key. */
export function createXAdapter(): PlatformAdapter {
  return {
    id: 'unfaked',

    async fetchMentions(sinceId?: string): Promise<SocialMention[]> {
      const params: Record<string, string> = { max_results: '10', 'tweet.fields': 'text,author_id,entities' }
      if (sinceId) params.since_id = sinceId

      const url = `https://api.twitter.com/2/users/${BOT_USER_ID}/mentions`
      const authHeader = await signRequest('GET', url, params)
      const queryString = new URLSearchParams(params).toString()

      const response = await fetch(`${url}?${queryString}`, { headers: { Authorization: authHeader } })
      if (!response.ok) return []

      const data = (await response.json()) as { data?: Array<{ id: string; text?: string }> }
      return (data.data ?? []).map(t => ({ id: String(t.id), text: t.text ?? '', raw: t }))
    },

    async reply(mention: SocialMention, text: string): Promise<void> {
      const url = 'https://api.twitter.com/2/tweets'
      const body = { text, reply: { in_reply_to_tweet_id: mention.id } }
      const authHeader = await signRequest('POST', url, {})

      await fetch(url, {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    },
  }
}
