import type { VerdictCard } from '@fountem/verdict'
import { ConfidenceGauge, SignalBar, StatusChip, ButtonLink } from '@fountem/ui'
import { ShareButton } from './ShareButton'

/**
 * The forensic result view (dark surface) — shared by the live detect form and
 * the /check/[slug] permalink. Shows the verdict, calibrated confidence band,
 * and the full signal/layer breakdown so users can see our working.
 */
export function VerdictPanel({ card }: { card: VerdictCard }) {
  const contributions = card.signal_breakdown?.contributions ?? []

  return (
    <div className="overflow-hidden rounded-card border border-white/10 bg-forest-950 text-zinc-200">
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <StatusChip verdict={card.verdict} label={card.verdict_label} surface="dark" />
          <p className="max-w-md text-sm leading-relaxed text-zinc-300">{card.summary}</p>
          {card.probable_generator_label && (
            <p className="text-xs text-zinc-500">
              Probable generator: <span className="text-zinc-300">{card.probable_generator_label}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-center">
          <ConfidenceGauge
            value={card.confidence_pct}
            low={card.confidence_low}
            high={card.confidence_high}
            surface="dark"
          />
          {card.confidence_low != null && card.confidence_high != null && (
            <span className="-mt-1 font-mono text-[11px] text-zinc-500">
              band {card.confidence_low}–{card.confidence_high}%
            </span>
          )}
        </div>
      </div>

      {/* Status flags */}
      {(card.vendor_disagreement || card.review_status === 'pending_review' || card.review_status === 'human_reviewed') && (
        <div className="flex flex-wrap gap-2 px-6 pt-5">
          {card.vendor_disagreement && <StatusChip verdict="misleading" label="Detectors disagree" surface="dark" />}
          {card.review_status === 'pending_review' && <StatusChip verdict="unverified" label="Queued for human review" surface="dark" />}
          {card.review_status === 'human_reviewed' && <StatusChip verdict="true" label="Confirmed by reviewer" surface="dark" />}
        </div>
      )}

      <div className="space-y-6 p-6">
        {/* Signal contributions */}
        {contributions.length > 0 && (
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">Signal contributions</p>
            {contributions.map((c) => (
              <SignalBar
                key={c.label}
                label={`${c.label} · weight ${Math.round(c.weight * 100)}%`}
                value={Math.round(c.score * 100)}
                hint={c.detail}
                surface="dark"
              />
            ))}
            {card.signal_breakdown?.provenance_short_circuit && (
              <p className="text-[11px] text-zinc-500">Provenance was decisive — the forensic ensemble was overridden.</p>
            )}
          </div>
        )}

        {/* Layer breakdown */}
        {card.layer_breakdown && (
          <div className="grid gap-2 sm:grid-cols-3">
            <LayerCard label="Forensic" value={card.layer_breakdown.layer1.score != null ? `${card.layer_breakdown.layer1.score}%` : '—'} />
            <LayerCard
              label="Provenance (C2PA)"
              value={card.layer_breakdown.layer2.provenance ? 'Valid' : 'None'}
              tone={card.layer_breakdown.layer2.provenance ? 'good' : 'muted'}
            />
            <LayerCard
              label="Contextual flags"
              value={card.layer_breakdown.layer3.red_flags.length > 0 ? String(card.layer_breakdown.layer3.red_flags.length) : '0'}
              tone={card.layer_breakdown.layer3.red_flags.length > 0 ? 'warn' : 'muted'}
            />
          </div>
        )}

        {/* Evasion */}
        {card.evasion_detected && card.evasion_detected !== 'no' && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-300">
              Evasion {card.evasion_detected === 'yes' ? 'detected' : 'suspected'}
            </p>
            {card.evasion_description && <p className="mt-0.5 text-xs text-amber-200/80">{card.evasion_description}</p>}
          </div>
        )}

        {/* Evidence citations (text claim checks) */}
        {card.source_citations.length > 0 && (
          <div className="space-y-2 border-t border-white/10 pt-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">Evidence</p>
            <ul className="space-y-2">
              {card.source_citations.map((c, i) => (
                <li key={`${c.chunk_id}-${i}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={c.source_url || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm font-medium text-zinc-200 hover:underline"
                    >
                      {c.source_title || c.publisher}
                    </a>
                    <SourceTierBadge tier={c.source_tier ?? 'primary'} />
                  </div>
                  {c.excerpt && <p className="mt-1 text-xs leading-relaxed text-zinc-400">“{c.excerpt}”</p>}
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                    {c.publisher}
                    {c.published_at ? ` · ${c.published_at}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Falsifiability */}
        {card.what_would_change_this && (
          <div className="border-t border-white/10 pt-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">What would change this verdict</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{card.what_would_change_this}</p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="border-t border-white/10 pt-4 text-[11px] leading-relaxed text-zinc-500">{card.disclaimer}</p>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <ShareButton text={card.share_text} />
          {card.correction_pack_url && (
            <ButtonLink
              href={card.correction_pack_slug ? `/check/${card.correction_pack_slug}` : card.correction_pack_url}
              variant="primary"
              surface="dark"
              className="flex-1"
            >
              Full analysis
            </ButtonLink>
          )}
          <ButtonLink href="/methodology" variant="ghost" surface="dark" className="flex-1">
            How we reach this
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}

function SourceTierBadge({ tier }: { tier: 'primary' | 'web' }) {
  const isPrimary = tier === 'primary'
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
        isPrimary ? 'bg-emerald-500/15 text-emerald-300' : 'bg-sky-500/15 text-sky-300'
      }`}
      title={isPrimary ? 'Trusted primary source' : 'Open-web source (weighted below primary)'}
    >
      {isPrimary ? 'Primary' : 'Web'}
    </span>
  )
}

function LayerCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' | 'muted' }) {
  const colour =
    tone === 'good' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : tone === 'muted' ? 'text-zinc-400' : 'text-zinc-100'
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${colour}`}>{value}</div>
    </div>
  )
}
