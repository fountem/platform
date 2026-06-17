/**
 * Mock / offline mode.
 *
 * When MOCK_SERVICES is enabled the platform runs end-to-end with NO external
 * dependencies — no AWS resolver, no Hive/Sensity, no OpenAI/Anthropic, no Supabase.
 * Leaf service calls return deterministic, input-varied fixtures so the *real*
 * synthesiser, RAG verdict shaping and serialisers are still exercised; only the
 * paid/native inputs are faked. Intended for local development and demos.
 *
 * Enable with `MOCK_SERVICES=1` (server) and `NEXT_PUBLIC_MOCK_SERVICES=1` (client UI).
 */

export function isMockMode(): boolean {
  const v = process.env.MOCK_SERVICES ?? process.env.NEXT_PUBLIC_MOCK_SERVICES
  return v === '1' || v === 'true'
}

/** Deterministic FNV-1a hash of a string → float in [0, 1). Same input ⇒ same output. */
export function seededUnit(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

/** Pick a deterministic element from a list, seeded by `seed`. */
export function seededPick<T>(seed: string, items: readonly T[]): T {
  return items[Math.floor(seededUnit(seed) * items.length) % items.length]
}
