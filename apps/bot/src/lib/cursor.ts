// Pure helpers for the bot's idempotency cursor. Kept free of network/DB so the
// ordering logic can be unit-tested. Tweet IDs are monotonic numeric strings, so
// "newest" is the numerically largest id (compared as BigInt to avoid overflow).

/** Returns the highest tweet id among `tweetIds` and the current cursor. */
export function nextSinceId(current: string | undefined | null, tweetIds: string[]): string | undefined {
  let max = current ?? undefined
  for (const id of tweetIds) {
    if (!/^\d+$/.test(id)) continue
    if (max === undefined || BigInt(id) > BigInt(max)) max = id
  }
  return max
}

/**
 * Selects up to `max` mention ids to process this run, OLDEST first.
 *
 * Processing oldest-first (and advancing the cursor only to the last id in the
 * returned batch) means that when more than `max` new mentions arrive, the
 * newer ones are simply picked up on the next run instead of being skipped.
 * Caps the per-invocation work so the cron stays under the function timeout.
 */
export function pickBatch(tweetIds: string[], max: number): string[] {
  const valid = tweetIds.filter(id => /^\d+$/.test(id))
  valid.sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0))
  return max > 0 ? valid.slice(0, max) : valid
}
