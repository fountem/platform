import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import { nextSinceId, pickBatch } from '../../../lib/cursor'

// Identifies this bot's cursor row in public.bot_cursor.
const BOT_ID = 'unfaked'

// Cap mentions handled per invocation so the cron stays under the function
// timeout (each one does a detection call + reply). Backlog drains over runs.
const MAX_MENTIONS_PER_RUN = Number(process.env.BOT_MAX_MENTIONS_PER_RUN ?? '3')

const X_API_KEY = process.env.X_API_KEY
const X_API_SECRET = process.env.X_API_SECRET
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET
const BOT_USER_ID = process.env.X_BOT_USER_ID ?? '' // numeric id of the @unfaked account

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
  // Verify this is a legitimate scheduled call (Netlify scheduled function -> /api/cron).
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createServiceClient()

    // Resume from the last processed mention so we only pull new ones.
    const { data: cursorRow } = await db
      .from('bot_cursor')
      .select('since_id')
      .eq('bot', BOT_ID)
      .maybeSingle()
    const sinceId = cursorRow?.since_id ?? undefined

    const mentions = await getMentions(sinceId)
    const results: string[] = []

    // Process the oldest new mentions first, capped per run. Anything beyond the
    // cap is picked up next run (the cursor only advances past the handled batch).
    const byId = new Map(mentions.map(t => [String(t.id), t]))
    const batchIds = pickBatch([...byId.keys()], MAX_MENTIONS_PER_RUN)

    for (const tweetId of batchIds) {
      const tweet = byId.get(tweetId)!
      // Atomically claim the mention: insert ignoring duplicates. If another run
      // (or an earlier pass) already claimed it, `inserted` is empty — skip so we
      // never reply to the same tweet twice.
      const { data: inserted } = await db
        .from('processed_mentions')
        .upsert({ tweet_id: tweet.id }, { onConflict: 'tweet_id', ignoreDuplicates: true })
        .select('tweet_id')
      if (!inserted || inserted.length === 0) continue

      const videoUrl = await extractVideoUrl(tweet)
      if (!videoUrl) continue

      // Call the Unfaked detection API with the bot's API key so it uses the
      // monthly B2B quota rather than the public per-IP limit.
      const detectionResponse = await fetch(`${process.env.UNFAKED_API_URL}/api/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.UNFAKED_API_KEY ? { 'x-api-key': process.env.UNFAKED_API_KEY } : {}),
        },
        body: JSON.stringify({ video_url: videoUrl }),
      })

      if (!detectionResponse.ok) continue

      const card = await detectionResponse.json() as any
      const replyText = `${card.share_text}\n\nVerdict: ${card.verdict_label} (${card.confidence_pct}% confidence)\n${card.correction_pack_url}`

      await replyToTweet(tweet.id, replyText)
      await db.from('processed_mentions').update({ replied: true }).eq('tweet_id', tweet.id)
      results.push(`Replied to tweet ${tweet.id}`)
    }

    // Advance the cursor only past the batch we actually handled, so any
    // mentions beyond the per-run cap are fetched again next run.
    const newSinceId = nextSinceId(sinceId, batchIds)
    if (newSinceId && newSinceId !== sinceId) {
      await db
        .from('bot_cursor')
        .upsert({ bot: BOT_ID, since_id: newSinceId, updated_at: new Date().toISOString() }, { onConflict: 'bot' })
    }

    return NextResponse.json({ processed: results.length, results })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
