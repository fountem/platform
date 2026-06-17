// Pure helpers for the idempotency cursor. Tweet/comment ids are monotonic
// numeric strings, so "newest" is the numerically largest id (compared as
// BigInt to avoid both overflow and lexicographic mistakes like "9" > "10").

/** Returns the highest id among `ids` and the current cursor. */
export function nextSinceId(current: string | undefined | null, ids: string[]): string | undefined {
  let max = current ?? undefined
  for (const id of ids) {
    if (!/^\d+$/.test(id)) continue
    if (max === undefined || BigInt(id) > BigInt(max)) max = id
  }
  return max
}

/**
 * Selects up to `max` ids to process this run, OLDEST first.
 *
 * Processing oldest-first (and advancing the cursor only to the last id in the
 * returned batch) means that when more than `max` new mentions arrive, the newer
 * ones are picked up next run instead of being skipped. Caps per-invocation work
 * so a cron stays under the function timeout.
 */
export function pickBatch(ids: string[], max: number): string[] {
  const valid = ids.filter(id => /^\d+$/.test(id))
  valid.sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0))
  return max > 0 ? valid.slice(0, max) : valid
}
