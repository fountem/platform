import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PARTIES, ISSUES } from '../../../data/parties'
import { createServiceClient } from '@fountem/db'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return PARTIES.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const party = PARTIES.find(p => p.slug === slug)
  if (!party) return { title: 'Party not found | Fountem' }
  return { title: `${party.name} — Political Dossier | Fountem` }
}

export default async function PartyPage({ params }: Props) {
  const { slug } = await params
  const party = PARTIES.find(p => p.slug === slug)
  if (!party) notFound()

  // Fetch positions and verdicts from DB
  let positions: any[] = []
  let trackRecord: any = null
  try {
    const db = createServiceClient()
    const { data: pts } = await db
      .from('party_issue_positions')
      .select('*, issues(issue_name)')
      .eq('party_id', slug)

    const { data: tr } = await db
      .from('track_record_scores')
      .select('*')
      .eq('party_id', slug)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    positions = pts ?? []
    trackRecord = tr
  } catch { /* DB not yet configured — show placeholder */ }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-4 h-16 rounded-full shrink-0" style={{ backgroundColor: party.colour }} />
        <div>
          <h1 className="text-3xl font-bold text-white">{party.name}</h1>
          <p className="text-zinc-400 mt-1">{party.description}</p>
          <p className="text-zinc-500 text-sm mt-1">Leader: {party.leader}</p>
        </div>
      </div>

      {/* Track record score */}
      {trackRecord && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 mb-8">
          <h2 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Overall track record score</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white">{trackRecord.track_record_score_0_100}</span>
            <span className="text-zinc-500">/ 100</span>
          </div>
          {trackRecord.track_record_notes && <p className="text-zinc-400 text-sm mt-3">{trackRecord.track_record_notes}</p>}
        </div>
      )}

      {/* Issue positions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">Policy positions by issue</h2>
        {positions.length > 0 ? (
          <div className="space-y-4">
            {positions.map((pos: any) => (
              <div key={pos.issue_id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{pos.issues?.issue_name ?? pos.issue_id}</h3>
                  {pos.alignment_score_0_100 !== null && (
                    <span className="text-sm text-zinc-400">{pos.alignment_score_0_100}/100 alignment</span>
                  )}
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed mb-2">{pos.position_summary}</p>
                {pos.stated_commitment && (
                  <p className="text-zinc-500 text-xs italic border-l-2 border-zinc-700 pl-3">
                    "{pos.stated_commitment}"
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    pos.evidence_quality === 'strong' ? 'border-green-800 text-green-400' :
                    pos.evidence_quality === 'moderate' ? 'border-yellow-800 text-yellow-400' :
                    'border-zinc-700 text-zinc-500'
                  }`}>
                    {pos.evidence_quality ?? 'unknown'} evidence
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    pos.confidence === 'high' ? 'border-blue-800 text-blue-400' :
                    pos.confidence === 'medium' ? 'border-zinc-700 text-zinc-400' :
                    'border-zinc-800 text-zinc-600'
                  }`}>
                    {pos.confidence ?? 'unknown'} confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {ISSUES.map(issue => (
              <div key={issue.slug} className="rounded-xl border border-dashed border-zinc-800 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-zinc-400 font-medium">{issue.label}</h3>
                  <span className="text-zinc-600 text-xs">Position analysis pending</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check a claim CTA */}
      <div className="mt-12 p-6 rounded-xl border border-blue-900 bg-blue-950/30">
        <h3 className="text-blue-400 font-semibold mb-2">Check a {party.shortName} claim</h3>
        <p className="text-zinc-400 text-sm mb-4">Heard something from {party.name} and not sure if it's accurate?</p>
        <a href="/check" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          Verify a claim →
        </a>
      </div>
    </div>
  )
}
