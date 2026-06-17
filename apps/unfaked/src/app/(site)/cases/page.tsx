import Link from 'next/link'
import { createServiceClient } from '@fountem/db'
import { GENERATOR_LABELS } from '@fountem/verdict'
import { Container, Eyebrow, StatusChip } from '@fountem/ui'

export const revalidate = 300

export default async function CasesPage() {
  const db = createServiceClient()
  const { data: cases } = await db
    .from('video_detections')
    .select('id, verdict, confidence_pct, probable_generator, case_title, created_at, evasion_detected')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

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
            return (
              <div key={c.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-parchment-200">
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
