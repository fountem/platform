import { processMentions } from '../src/process'
import type { DetectionCard, IdempotencyStore, PlatformAdapter, SocialMention } from '../src/types'

const CARD: DetectionCard = {
  share_text: 'Checked.',
  verdict_label: 'AI generated',
  confidence_pct: 90,
  correction_pack_url: 'https://unfaked.ai/check/x',
}

/** In-memory idempotency store with atomic-claim semantics. */
function fakeStore(initialCursor?: string): IdempotencyStore & { cursor?: string; claimed: Set<string>; replied: Set<string> } {
  const claimed = new Set<string>()
  const replied = new Set<string>()
  return {
    cursor: initialCursor,
    claimed,
    replied,
    async getCursor() {
      return this.cursor
    },
    async setCursor(_key, sinceId) {
      this.cursor = sinceId
    },
    async claim(id) {
      if (claimed.has(id)) return false
      claimed.add(id)
      return true
    },
    async markReplied(id) {
      replied.add(id)
    },
  }
}

function fakeAdapter(mentions: SocialMention[]): PlatformAdapter & { replies: Array<{ id: string; text: string }>; lastSince?: string } {
  const replies: Array<{ id: string; text: string }> = []
  return {
    id: 'test',
    replies,
    lastSince: undefined,
    async fetchMentions(sinceId) {
      this.lastSince = sinceId
      return mentions
    },
    async reply(mention, text) {
      replies.push({ id: mention.id, text })
    },
  }
}

const detector = async () => CARD

describe('processMentions', () => {
  it('replies once per mention with a media URL and advances the cursor', async () => {
    const adapter = fakeAdapter([
      { id: '2', text: 'fake? https://x.com/v/2' },
      { id: '1', text: 'real? https://x.com/v/1' },
    ])
    const store = fakeStore()

    const res = await processMentions({ adapter, store, detect: detector })

    expect(res.processed).toBe(2)
    // Oldest first.
    expect(adapter.replies.map(r => r.id)).toEqual(['1', '2'])
    expect(store.cursor).toBe('2')
    expect([...store.replied].sort()).toEqual(['1', '2'])
  })

  it('skips mentions without a media URL but still claims them', async () => {
    const adapter = fakeAdapter([{ id: '5', text: 'no link here' }])
    const store = fakeStore()

    const res = await processMentions({ adapter, store, detect: detector })

    expect(res.processed).toBe(0)
    expect(adapter.replies).toHaveLength(0)
    expect(store.claimed.has('5')).toBe(true)
    // Cursor still advances so we don't refetch it forever.
    expect(store.cursor).toBe('5')
  })

  it('does not reply to an already-claimed mention (idempotent)', async () => {
    const adapter = fakeAdapter([{ id: '7', text: 'check https://x.com/v/7' }])
    const store = fakeStore()
    await store.claim('7') // pretend a previous run handled it

    const res = await processMentions({ adapter, store, detect: detector })

    expect(res.processed).toBe(0)
    expect(adapter.replies).toHaveLength(0)
  })

  it('caps work per run and passes the cursor to the adapter', async () => {
    const adapter = fakeAdapter([
      { id: '1', text: 'a https://x/1' },
      { id: '2', text: 'b https://x/2' },
      { id: '3', text: 'c https://x/3' },
    ])
    const store = fakeStore('0')

    const res = await processMentions({ adapter, store, detect: detector, maxPerRun: 2 })

    expect(adapter.lastSince).toBe('0')
    expect(res.processed).toBe(2)
    expect(adapter.replies.map(r => r.id)).toEqual(['1', '2'])
    // Cursor only advances past the handled batch; '3' is picked up next run.
    expect(store.cursor).toBe('2')
  })

  it('does not reply when detection fails', async () => {
    const adapter = fakeAdapter([{ id: '9', text: 'check https://x/9' }])
    const store = fakeStore()

    const res = await processMentions({ adapter, store, detect: async () => null })

    expect(res.processed).toBe(0)
    expect(adapter.replies).toHaveLength(0)
    // Claimed (won't be retried) and cursor advances.
    expect(store.claimed.has('9')).toBe(true)
    expect(store.cursor).toBe('9')
  })
})
