import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PARTIES, ISSUES } from '../../../../data/parties'
import { createServiceClient } from '@fountem/db'
import type { PartyIssuePosition, TrackRecordScore, Issue } from '@fountem/db'
import { ButtonLink, Card, Container, Eyebrow } from '@fountem/ui'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return PARTIES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const party = PARTIES.find((p) => p.slug === slug)
  if (!party) return { title: 'Party not found | Fountem' }
  return {
    title: `${party.name} — Policy & Track Record | Fountem`,
    description: `Evidence-based policy positions and track record for ${party.name}.`,
  }
}

interface MergedIssue {
  slug: string
  label: string
  position: PartyIssuePosition | null
  track: TrackRecordScore | null
}

async function loadPartyData(slug: string): Promise<{ merged: MergedIssue[]; overall: number | null }> {
  try {
    const db = createServiceClient()
    const { data: party } = await db.from('parties').select('id').eq('slug', slug).maybeSingle()
    if (!party) return { merged: ISSUES.map((i) => ({ ...i, position: null, track: null })), overall: null }

    const [{ data: issues }, { data: positions }, { data: tracks }] = await Promise.all([
      db.from('issues').select('*'),
      db.from('party_issue_positions').select('*').eq('party_id', party.id),
      db.from('track_record_scores').select('*').eq('party_id', party.id),
    ])

    const issueBySlug = new Map((issues ?? []).map((i: Issue) => [i.slug, i]))
    const posByIssue = new Map((positions ?? []).map((p: PartyIssuePosition) => [p.issue_id, p]))
    const trackByIssue = new Map((tracks ?? []).map((t: TrackRecordScore) => [t.issue_id, t]))

    const merged: MergedIssue[] = ISSUES.map((i) => {
      const issue = issueBySlug.get(i.slug)
      return {
        ...i,
        position: issue ? posByIssue.get(issue.id) ?? null : null,
        track: issue ? trackByIssue.get(issue.id) ?? null : null,
      }
    })

    const scores = merged.map((m) => m.track?.score).filter((s): s is number => typeof s === 'number')
    const overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
    return { merged, overall }
  } catch {
    return { merged: ISSUES.map((i) => ({ ...i, position: null, track: null })), overall: null }
  }
}

export default async function PartyPage({ params }: Props) {
  const { slug } = await params
  const party = PARTIES.find((p) => p.slug === slug)
  if (!party) notFound()

  const { merged, overall } = await loadPartyData(slug)

  return (
    <Container>
      <div className="py-14">
        <div className="mb-10 flex items-center gap-4">
          <div className="h-16 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: party.colour }} />
          <div>
            <h1 className="font-serif text-4xl text-forest-900">{party.name}</h1>
            <p className="mt-1 text-ink-secondary">{party.description}</p>
            <p className="mt-1 text-sm text-ink-muted">Leader: {party.leader}</p>
          </div>
        </div>

        {overall !== null && (
          <Card className="mb-8">
            <Eyebrow>Overall track-record score (evidence-weighted)</Eyebrow>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-5xl text-forest-900">{overall}</span>
              <span className="text-ink-muted">/ 100</span>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Averaged across {merged.filter((m) => m.track).length} assessed issues. Each score links to the primary-source
              evidence used. This is an assessment of delivery against stated commitments, not an endorsement.
            </p>
          </Card>
        )}

        <h2 className="mb-6 font-serif text-2xl text-forest-900">Policy positions &amp; track record by issue</h2>
        <div className="space-y-4">
          {merged.map((m) => (
            <Card key={m.slug}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-serif text-lg text-forest-900">{m.label}</h3>
                {m.track?.score != null ? (
                  <span className="text-sm text-ink-secondary">{m.track.score}/100 track record</span>
                ) : (
                  <span className="text-xs text-ink-muted">Analysis pending</span>
                )}
              </div>
              {m.position ? (
                <>
                  <p className="mb-2 text-sm leading-relaxed text-ink-secondary">{m.position.position_summary}</p>
                  {m.position.stated_commitment && (
                    <p className="border-l-2 border-forest-300 pl-3 text-xs italic text-ink-muted">
                      &ldquo;{m.position.stated_commitment}&rdquo;
                    </p>
                  )}
                  {m.position.source_url && (
                    <a href={m.position.source_url} className="mt-2 inline-block text-xs font-medium text-forest-700 underline" target="_blank" rel="noreferrer">
                      Source →
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-ink-muted">No position recorded yet for this issue.</p>
              )}
              {m.track?.score_reasoning && (
                <p className="mt-3 border-t border-forest-100 pt-3 text-xs text-ink-muted">{m.track.score_reasoning}</p>
              )}
            </Card>
          ))}
        </div>

        <Card className="mt-12 border-forest-200 bg-forest-50">
          <h3 className="font-serif text-lg text-forest-900">Check a {party.shortName} claim</h3>
          <p className="mb-4 mt-1 text-sm text-ink-secondary">Heard something from {party.name} and not sure if it&rsquo;s accurate?</p>
          <ButtonLink href="/check" variant="primary">Verify a claim →</ButtonLink>
        </Card>
      </div>
    </Container>
  )
}
