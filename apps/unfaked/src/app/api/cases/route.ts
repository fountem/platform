import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const perPage = 20
  const generator = searchParams.get('generator')
  const from = searchParams.get('from')

  const db = createServiceClient()

  let query = db
    .from('video_detections')
    .select(
      'id, verdict, confidence_pct, probable_generator, case_title, created_at, evasion_detected, correction_packs(slug)',
      { count: 'exact' },
    )
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (generator) query = query.eq('probable_generator', generator)
  if (from) query = query.gte('created_at', from)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const cases = (data ?? []).map((c) => {
    const { correction_packs, ...rest } = c as unknown as Record<string, unknown> & {
      correction_packs?: { slug: string }[] | { slug: string } | null
    }
    const slug = (Array.isArray(correction_packs) ? correction_packs[0] : correction_packs)?.slug ?? null
    return { ...rest, correction_pack_slug: slug }
  })

  return NextResponse.json({ cases, total: count, page, per_page: perPage })
}
