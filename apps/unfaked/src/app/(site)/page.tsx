import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow, StatusChip, ShieldMark } from '@fountem/ui'
import { DetectForm } from '../../components/DetectForm'
import { getUser } from '../../lib/supabase/server'

export const metadata: Metadata = {
  title: 'Unfaked — Detect AI-Generated Political Videos',
  description:
    '1 in 3 UK voters saw political deepfakes before the 2026 elections. Paste a video URL for an evidence-backed verdict that shows its working.',
}

export default async function HomePage() {
  const user = await getUser()

  return (
    <>
      <section className="relative overflow-hidden">
        <Container>
          <div className="mx-auto max-w-2xl pb-12 pt-16 text-center sm:pt-24">
            <Eyebrow className="justify-center">Made in the UK · for the public good</Eyebrow>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-forest-900 sm:text-6xl">Is this video real?</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary">
              1 in 3 UK voters encountered AI-generated political content before the 2026 elections. Paste any video URL for a
              forensic verdict — with the evidence behind it.
            </p>
          </div>

          <div className="mx-auto max-w-2xl pb-8">
            <DetectForm signedIn={Boolean(user)} />
          </div>

          <div className="mx-auto grid max-w-3xl gap-8 border-t border-forest-100 py-12 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="text-center">
                <f.icon className="mx-auto h-6 w-6 text-forest-700" />
                <h3 className="mt-3 font-serif text-lg text-forest-900">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{f.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-forest-100 bg-parchment-200">
        <Container>
          <div className="py-14">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <Eyebrow>Public record</Eyebrow>
                <h2 className="mt-2 font-serif text-2xl text-forest-900">Recent cases</h2>
              </div>
              <Link href="/cases" className="text-sm font-medium text-forest-700 hover:text-forest-900">View archive →</Link>
            </div>
            <RecentCases />
          </div>
        </Container>
      </section>
    </>
  )
}

const FEATURES = [
  { icon: ProvenanceIcon, title: 'Provenance first', body: 'We trace where a video came from before judging how it looks — content credentials and AI watermarks.' },
  { icon: EnsembleIcon, title: 'Forensic ensemble', body: 'Two independent detectors plus temporal and cross-modal analysis — and we surface their disagreement.' },
  { icon: ArchiveIcon, title: 'For the public record', body: 'Every public verdict is timestamped in an open archive for journalists, researchers and regulators.' },
]

async function RecentCases() {
  try {
    const { createServiceClient } = await import('@fountem/db')
    const db = createServiceClient()
    const { data } = await db
      .from('video_detections')
      .select('id, verdict, confidence_pct, case_title, created_at, correction_packs(slug)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(4)

    if (!data || data.length === 0) return <EmptyCases />
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((c) => {
          const packs = (c as unknown as { correction_packs?: { slug: string }[] | { slug: string } | null })
            .correction_packs
          const slug = (Array.isArray(packs) ? packs[0] : packs)?.slug ?? null
          const cardClass =
            'flex items-center gap-3 rounded-card border border-forest-100 bg-white p-4 shadow-card transition-colors hover:bg-parchment-200'
          const inner = (
            <>
              <StatusChip verdict={c.verdict} surface="light" />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{c.case_title ?? 'Unnamed case'}</span>
              <span className="shrink-0 font-mono text-xs text-ink-muted">{c.confidence_pct}%</span>
            </>
          )
          return slug ? (
            <Link key={c.id} href={`/check/${slug}`} className={cardClass}>
              {inner}
            </Link>
          ) : (
            <div key={c.id} className={cardClass}>
              {inner}
            </div>
          )
        })}
      </div>
    )
  } catch {
    return <EmptyCases />
  }
}

function EmptyCases() {
  return (
    <p className="rounded-card border border-dashed border-forest-200 bg-white/50 py-10 text-center text-sm text-ink-muted">
      No cases yet — be the first to submit a video above.
    </p>
  )
}

function ProvenanceIcon(props: React.SVGProps<SVGSVGElement>) {
  return <ShieldMark {...props} />
}
function EnsembleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="m3 12 9 4.5L21 12M3 16.5 12 21l9-4.5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}
function ArchiveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M5 21V7l7-4 7 4v14M5 21h14M5 21H3m16 0h2M9 21v-6h6v6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
