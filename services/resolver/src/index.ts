import express from 'express'
import { timingSafeEqual } from 'node:crypto'
import { resolve, ResolveError } from './resolve.js'

const PORT = Number(process.env.PORT ?? 8080)
const API_KEY = process.env.RESOLVER_API_KEY ?? ''

const app = express()
app.use(express.json({ limit: '64kb' }))

function authorised(header: string | undefined): boolean {
  if (!API_KEY) return false
  if (!header || !header.startsWith('Bearer ')) return false
  const provided = header.slice('Bearer '.length)
  const a = Buffer.from(provided)
  const b = Buffer.from(API_KEY)
  return a.length === b.length && timingSafeEqual(a, b)
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'resolver', ts: new Date().toISOString() })
})

app.post('/resolve', async (req, res) => {
  if (!authorised(req.headers.authorization)) {
    res.status(401).json({ error: 'unauthorised' })
    return
  }
  const url = (req.body as { url?: unknown })?.url
  if (typeof url !== 'string' || !url) {
    res.status(400).json({ error: 'url (string) is required' })
    return
  }

  try {
    const result = await resolve(url)
    res.json(result)
  } catch (err) {
    if (err instanceof ResolveError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    console.error('[resolver] unexpected error', err)
    res.status(500).json({ error: 'internal resolver error' })
  }
})

// Only start a listener when run directly (not when imported by tests).
// Matches both compiled prod (`node dist/index.js`) and dev (`tsx src/index.ts`).
const entry = process.argv[1] ?? ''
if (entry.endsWith('index.js') || entry.endsWith('index.ts')) {
  if (!API_KEY) {
    console.error('FATAL: RESOLVER_API_KEY is not set')
    process.exit(1)
  }
  app.listen(PORT, () => console.log(`[resolver] listening on :${PORT}`))
}

export { app }
