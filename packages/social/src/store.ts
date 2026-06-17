import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@fountem/db'
import type { IdempotencyStore } from './types'

/**
 * Supabase-backed idempotency store (migration 012): `bot_cursor` holds the
 * per-platform since_id, `processed_mentions` gives an atomic per-id claim via
 * insert-ignoring-duplicates. Requires the service-role client (RLS is on with
 * no policies, so only the service role can read/write these tables).
 */
export function createSupabaseStore(db: SupabaseClient<Database>): IdempotencyStore {
  return {
    async getCursor(key) {
      const { data } = await db.from('bot_cursor').select('since_id').eq('bot', key).maybeSingle()
      return data?.since_id ?? undefined
    },

    async setCursor(key, sinceId) {
      await db
        .from('bot_cursor')
        .upsert({ bot: key, since_id: sinceId, updated_at: new Date().toISOString() }, { onConflict: 'bot' })
    },

    async claim(mentionId) {
      const { data } = await db
        .from('processed_mentions')
        .upsert({ tweet_id: mentionId }, { onConflict: 'tweet_id', ignoreDuplicates: true })
        .select('tweet_id')
      return !!data && data.length > 0
    },

    async markReplied(mentionId) {
      await db.from('processed_mentions').update({ replied: true }).eq('tweet_id', mentionId)
    },
  }
}
