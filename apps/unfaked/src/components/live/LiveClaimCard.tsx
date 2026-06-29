'use client'

import type { LiveClaim, LiveClaimStatus } from '@fountem/db'

const STATUS_META: Record<LiveClaimStatus, { label: string; chip: string; dot: string }> = {
  pending: { label: 'Pending', chip: 'bg-zinc-500/15 text-zinc-300', dot: 'bg-zinc-400' },
  checking: { label: 'Checking…', chip: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-400 animate-pulse' },
  supported: { label: 'Supported', chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
  disputed: { label: 'Disputed', chip: 'bg-red-500/15 text-red-300', dot: 'bg-red-400' },
  needs_context: { label: 'Needs context', chip: 'bg-orange-500/15 text-orange-300', dot: 'bg-orange-400' },
  unverifiable: { label: 'Unverifiable', chip: 'bg-zinc-500/15 text-zinc-300', dot: 'bg-zinc-400' },
  error: { label: 'Check failed', chip: 'bg-zinc-600/15 text-zinc-400', dot: 'bg-zinc-500' },
}

export function LiveClaimCard({ claim }: { claim: LiveClaim }) {
  const meta = STATUS_META[claim.status] ?? STATUS_META.pending
  const resolved = ['supported', 'disputed', 'needs_context', 'unverifiable'].includes(claim.status)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-zinc-200">{claim.claim_text}</p>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {claim.speaker_label && (
        <p className="mt-1 text-[11px] uppercase tracking-wider text-zinc-600">{claim.speaker_label}</p>
      )}

      {resolved && claim.verdict_summary && (
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">{claim.verdict_summary}</p>
      )}

      {resolved && claim.confidence_pct != null && (
        <p className="mt-1 font-mono text-[10px] text-zinc-600">confidence {claim.confidence_pct}%</p>
      )}

      {claim.source_citations.length > 0 && (
        <ul className="mt-2 space-y-1">
          {claim.source_citations.slice(0, 3).map((c, i) => (
            <li key={`${c.chunk_id}-${i}`} className="flex items-center gap-2 text-[11px]">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                  (c.source_tier ?? 'primary') === 'primary' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-sky-500/15 text-sky-300'
                }`}
              >
                {(c.source_tier ?? 'primary') === 'primary' ? 'Primary' : 'Web'}
              </span>
              <a
                href={c.source_url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-zinc-400 hover:underline"
              >
                {c.source_title || c.publisher}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
