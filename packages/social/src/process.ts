import { nextSinceId, pickBatch } from './cursor'
import { extractMediaUrl, formatReply } from './format'
import type { Detector, IdempotencyStore, PlatformAdapter } from './types'

export interface ProcessOptions {
  adapter: PlatformAdapter
  store: IdempotencyStore
  detect: Detector
  /** Max mentions handled per run; backlog drains over subsequent runs. */
  maxPerRun?: number
}

export interface ProcessResult {
  processed: number
  results: string[]
}

/**
 * Platform-agnostic bot loop: resume from the cursor, take the oldest capped
 * batch of new mentions, and for each one atomically claim it (dedupe), extract
 * a media URL, run detection, reply, and mark it replied. Finally advance the
 * cursor past the handled batch. Claim-first means a transient failure drops a
 * reply rather than risking a duplicate.
 */
export async function processMentions(opts: ProcessOptions): Promise<ProcessResult> {
  const { adapter, store, detect } = opts
  const max = opts.maxPerRun ?? 3

  const sinceId = await store.getCursor(adapter.id)
  const mentions = await adapter.fetchMentions(sinceId)

  const byId = new Map(mentions.map(m => [String(m.id), m]))
  const batchIds = pickBatch([...byId.keys()], max)

  const results: string[] = []
  for (const id of batchIds) {
    const mention = byId.get(id)!

    // Atomic claim: skip if already handled by an earlier pass or concurrent run.
    if (!(await store.claim(id))) continue

    const mediaUrl = extractMediaUrl(mention.text)
    if (!mediaUrl) continue

    const card = await detect(mediaUrl)
    if (!card) continue

    await adapter.reply(mention, formatReply(card))
    await store.markReplied(id)
    results.push(`Replied to ${adapter.id} mention ${id}`)
  }

  const newSinceId = nextSinceId(sinceId, batchIds)
  if (newSinceId && newSinceId !== sinceId) {
    await store.setCursor(adapter.id, newSinceId)
  }

  return { processed: results.length, results }
}
