import Link from 'next/link'
import { createServiceClient } from '@fountem/db'
import { GENERATOR_LABELS } from '@fountem/verdict'
import { Container, Eyebrow, StatusChip } from '@fountem/ui'

export const revalidate = 300

type CaseRow = {
  id: string
  verdict: string
  confidence_pct: number | null
  probable_generator: string | null
  case_title: string | null
  created_at: string
  evasion_detected: string | null
  slug: string | null
}

async function loadCases(): Promise<CaseRow[]> {
  // Guarded so `next build` (which prerenders this ISR page) doesn't fail when
  // Supabase env is absent at build time; revalidation refills it at runtime.
  try {
    const db = createServiceClient()
    const { data } = await db
      .from('video_detections')
      .select(
        'id, verdict, confidence_pct, probable_generator, case_title, created_at, evasion_detected, correction_packs(slug)',
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50)
    return (data ?? []).map((c) => {
      const packs = (c as unknown as { correction_packs?: { slug: string }[] | { slug: string } | null }).correction_packs
      const pack = Array.isArray(packs) ? packs[0] : packs
      return { ...(c as unknown as CaseRow), slug: pack?.slug ?? null }
    })
  } catch {
    return []
  }
}

export default async function CasesPage() {
  const cases = await loadCases()

  return (
    <Container>
      <div className="py-14">
        <div className="max-w-2xl">
          <Eyebrow>Public record</Eyebrow>
          <h1 className="mt-3 font-serif text-4xl text-forest-900">UK Political Deepfake Archive</h1>
          <p className="mt-3 leading-relaxed text-ink-secondary">
            Every AI-generated political video detected by Unfaked — timestamped, publicly accessible, and available to
            journalists, researchers and regulators.
          </p>
        </div>

        <div className="mt-10 divide-y divide-forest-100 overflow-hidden rounded-card border border-forest-100 bg-white shadow-card">
          {cases?.map((c) => {
            const genLabel = c.probable_generator ? GENERATOR_LABELS[c.probable_generator] : null
            const rowClass = 'flex items-center gap-4 p-4 transition-colors hover:bg-parchment-200'
            const inner = (
              <>
                <StatusChip verdict={c.verdict} surface="light" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{c.case_title ?? 'Unnamed case'}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {genLabel ?? 'Unknown generator'} · {c.confidence_pct}% confidence
                    {c.evasion_detected === 'yes' && ' · evasion detected'}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-ink-muted">
                  {new Date(c.created_at).toLocaleDateString('en-GB')}
                </span>
              </>
            )
            return c.slug ? (
              <Link key={c.id} href={`/check/${c.slug}`} className={rowClass}>
                {inner}
              </Link>
            ) : (
              <div key={c.id} className={rowClass}>
                {inner}
              </div>
            )
          })}
          {(!cases || cases.length === 0) && (
            <p className="py-20 text-center text-sm text-ink-muted">No cases yet. Be the first to submit a video.</p>
          )}
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          Looking for the method behind these verdicts? Read{' '}
          <Link href="/methodology" className="font-medium text-forest-700 underline">how Unfaked works</Link>.
        </p>
      </div>
    </Container>
  )
}
