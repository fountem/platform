import { NextRequest, NextResponse } from 'next/server'

const X_BEARER = process.env.X_BEARER_TOKEN
const X_API_KEY = process.env.X_API_KEY
const X_API_SECRET = process.env.X_API_SECRET
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET
const BOT_USER_ID = '...' // Set after @unfaked account is created

// Simple HMAC-SHA1 OAuth 1.0a signing for X API v2
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
  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ')

  return authHeader
}

async function getMentions(sinceId?: string): Promise<any[]> {
  const params: Record<string, string> = { max_results: '10', 'tweet.fields': 'text,author_id,entities' }
  if (sinceId) params.since_id = sinceId

  const url = `https://api.twitter.com/2/users/${BOT_USER_ID}/mentions`
  const authHeader = await signRequest('GET', url, params)
  const queryString = new URLSearchParams(params).toString()

  const response = await fetch(`${url}?${queryString}`, {
    headers: { Authorization: authHeader },
  })

  if (!response.ok) return []
  const data = await response.json() as any
  return data.data ?? []
}

async function extractVideoUrl(tweet: any): Promise<string | null> {
  const text: string = tweet.text ?? ''
  const urlMatch = text.match(/https?:\/\/[^\s]+/)
  return urlMatch?.[0] ?? null
}

async function replyToTweet(tweetId: string, replyText: string): Promise<void> {
  const url = 'https://api.twitter.com/2/tweets'
  const body = { text: replyText, reply: { in_reply_to_tweet_id: tweetId } }
  const authHeader = await signRequest('POST', url, {})

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel Cron call
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const mentions = await getMentions()
    const results: string[] = []

    for (const tweet of mentions) {
      const videoUrl = await extractVideoUrl(tweet)
      if (!videoUrl) continue

      // Call the Unfaked detection API
      const detectionResponse = await fetch(`${process.env.UNFAKED_API_URL}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: videoUrl }),
      })

      if (!detectionResponse.ok) continue

      const card = await detectionResponse.json() as any
      const replyText = `${card.share_text}\n\nVerdict: ${card.verdict_label} (${card.confidence_pct}% confidence)\n${card.correction_pack_url}`

      await replyToTweet(tweet.id, replyText)
      results.push(`Replied to tweet ${tweet.id}`)
    }

    return NextResponse.json({ processed: results.length, results })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
