import type { VerdictCard } from '@fountem/verdict'
import { ButtonLink, Card, ConfidenceGauge, StatusChip } from '@fountem/ui'
import { ShareButton } from './ShareButton'

interface Citation {
  publisher?: string
  published_at?: string
  source_title?: string
  source_url?: string
  excerpt?: string
}

/** Editorial claim-verdict card — shared by the live check form and /pack/[slug]. */
export function ClaimVerdictCard({ card, claimText }: { card: VerdictCard; claimText?: string }) {
  const citations = (card.source_citations ?? []) as Citation[]

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-center justify-between gap-4">
        <StatusChip verdict={card.verdict} label={card.verdict_label} surface="light" />
        <div className="flex items-center">
          <ConfidenceGauge value={card.confidence_pct} size={120} surface="light" />
        </div>
      </div>

      {claimText && (
        <blockquote className="border-l-2 border-forest-300 bg-parchment-200 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-ink-muted">Claim assessed</p>
          <p className="mt-1 font-serif text-base italic text-forest-900">&ldquo;{claimText}&rdquo;</p>
        </blockquote>
      )}

      <p className="text-lg leading-relaxed text-ink">{card.summary}</p>
      {card.reasoning && <p className="text-sm leading-relaxed text-ink-secondary">{card.reasoning}</p>}

      {citations.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-ink-muted">Evidence sources</p>
          {citations.map((cit, i) => (
            <div key={i} className="rounded-xl border-l-2 border-forest-500 bg-parchment-200 px-4 py-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-forest-700">{cit.publisher}</span>
                <span className="shrink-0 font-mono text-xs text-ink-muted">{cit.published_at}</span>
              </div>
              <p className="text-sm font-medium text-ink">{cit.source_title}</p>
              {cit.excerpt && <p className="mt-1 text-xs italic text-ink-secondary">&ldquo;{cit.excerpt}&rdquo;</p>}
              {cit.source_url && (
                <a href={cit.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-medium text-forest-700 underline">
                  View source →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {citations.length === 0 && (
        <p className="text-sm text-ink-muted">
          No matching primary-source evidence was found, so this claim is returned as unverifiable rather than guessed.
        </p>
      )}

      {card.what_would_change_this && (
        <div className="border-t border-forest-100 pt-4">
          <p className="text-xs uppercase tracking-widest text-ink-muted">What would change this verdict</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{card.what_would_change_this}</p>
        </div>
      )}

      {card.disclaimer && <p className="border-t border-forest-100 pt-4 text-[11px] leading-relaxed text-ink-muted">{card.disclaimer}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <ShareButton text={card.share_text} />
        {card.correction_pack_url && (
          <ButtonLink href={card.correction_pack_url} variant="primary" className="flex-1">
            Correction pack
          </ButtonLink>
        )}
      </div>
    </Card>
  )
}
