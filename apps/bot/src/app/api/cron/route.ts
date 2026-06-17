import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import { processMentions, createSupabaseStore, httpDetector } from '@fountem/social'
import { createXAdapter } from '../../../lib/x-adapter'

// Mentions handled per run; caps runtime so the cron stays under the function
// timeout. Backlog drains over subsequent runs.
const MAX_MENTIONS_PER_RUN = Number(process.env.BOT_MAX_MENTIONS_PER_RUN ?? '3')

export async function GET(req: NextRequest) {
  // Verify this is a legitimate scheduled call (GitHub Actions cron / Vercel Cron -> /api/cron).
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const store = createSupabaseStore(createServiceClient())
    const adapter = createXAdapter()
    const detect = httpDetector({
      apiUrl: process.env.UNFAKED_API_URL ?? '',
      apiKey: process.env.UNFAKED_API_KEY,
    })

    const { processed, results } = await processMentions({
      adapter,
      store,
      detect,
      maxPerRun: MAX_MENTIONS_PER_RUN,
    })

    return NextResponse.json({ processed, results })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
