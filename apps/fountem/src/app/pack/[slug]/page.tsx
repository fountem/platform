import { notFound } from 'next/navigation'
import { createServiceClient } from '@fountem/db'
import { serialiseClaimVerdict } from '@fountem/verdict'

interface Props { params: Promise<{ slug: string }> }

export default async function PackPage({ params }: Props) {
  const { slug } = await params

  let card: any = null
  let claimText = ''
  try {
    const db = createServiceClient()
    const { data: pack } = await db
      .from('correction_packs')
      .select('*, verdicts(*, claims(claim_text))')
      .eq('slug', slug)
      .single()

    if (!pack) notFound()

    const verdict = (pack as any).verdicts
    if (!verdict) notFound()

    claimText = verdict.claims?.claim_text ?? ''
    card = serialiseClaimVerdict(verdict, claimText, pack)
  } catch { notFound() }

  const colour = card.verdict_colour ?? '#64748b'

  return (
    <div className="max-w-2xl mx-auto px-4 pt-12 pb-32">
      <div className="rounded-2xl border bg-zinc-900 overflow-hidden" style={{ borderColor: `${colour}40` }}>
        <div className="px-6 py-4" style={{ backgroundColor: `${colour}15` }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: colour }}>{card.verdict_label}</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-bold" style={{ color: colour }}>{card.confidence_pct}%</span>
            <span className="text-zinc-400 text-sm">confidence</span>
          </div>
        </div>
        <div className="px-6 py-5 space-y-5">
          {claimText && (
            <div className="p-3 rounded-lg bg-zinc-800 border-l-2 border-zinc-600">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Claim assessed</p>
              <p className="text-zinc-200 text-sm italic">"{claimText}"</p>
            </div>
          )}
          <p className="text-white leading-relaxed">{card.summary}</p>
          <p className="text-zinc-400 text-sm leading-relaxed">{card.reasoning}</p>
          {card.source_citations?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-zinc-500 text-xs uppercase tracking-wider">Sources</h3>
              {card.source_citations.map((cit: any, i: number) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-zinc-800 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-blue-400 text-xs">{cit.publisher} · {cit.published_at}</p>
                    <p className="text-zinc-300 text-sm">{cit.source_title}</p>
                  </div>
                  <a href={cit.source_url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 text-xs shrink-0">
                    →
                  </a>
                </div>
              ))}
            </div>
          )}
          {card.what_would_change_this && (
            <div className="border-t border-zinc-800 pt-4">
              <h3 className="text-zinc-600 text-xs uppercase tracking-wider mb-1">What would change this</h3>
              <p className="text-zinc-400 text-sm">{card.what_would_change_this}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-zinc-600 text-xs">Verified by Fountem · Every verdict cites its source</span>
          <a href="/check" className="text-blue-400 hover:text-blue-300 text-sm">Check a claim →</a>
        </div>
      </div>
    </div>
  )
}
