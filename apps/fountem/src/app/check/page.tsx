'use client'

import { useState } from 'react'
import type { VerdictCard } from '@fountem/verdict'
import { VERDICT_META } from '@fountem/verdict'

export default function CheckPage() {
  const [claim, setClaim] = useState('')
  const [speaker, setSpeaker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerdictCard | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!claim.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, speaker: speaker || undefined }),
      })

      if (!response.ok) {
        const err = await response.json() as { error?: string }
        throw new Error(err.error ?? 'Verification failed')
      }

      const data = await response.json() as VerdictCard
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-16 pb-32">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Check a claim</h1>
        <p className="text-zinc-500">
          Enter any UK political claim. We verify it against ONS, IFS, Hansard, and other
          primary sources — not other fact-checkers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <textarea
          value={claim}
          onChange={e => setClaim(e.target.value)}
          placeholder="e.g. NHS waiting lists have fallen by 200,000 since January 2024"
          rows={3}
          className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 resize-none"
          disabled={loading}
        />
        <input
          type="text"
          value={speaker}
          onChange={e => setSpeaker(e.target.value)}
          placeholder="Speaker (optional) — e.g. Wes Streeting"
          className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !claim.trim()}
          className="w-full bg-zinc-900 text-white font-semibold py-3 rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying against primary sources…' : 'Verify claim'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && <ClaimVerdictDisplay card={result} />}
    </div>
  )
}

function ClaimVerdictDisplay({ card }: { card: VerdictCard }) {
  const meta = VERDICT_META[card.verdict] ?? VERDICT_META.inconclusive

  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-6 py-5" style={{ borderLeft: `4px solid ${meta.colour}` }}>
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full"
            style={{ backgroundColor: `${meta.colour}15`, color: meta.colour }}
          >
            {meta.label}
          </span>
          <span className="text-zinc-400 text-sm">{card.confidence_pct}% confidence</span>
        </div>

        {card.claim_text && (
          <blockquote className="text-zinc-600 text-sm italic border-l-2 border-zinc-300 pl-4 mb-4">
            "{card.claim_text}"
            {card.speaker && <footer className="text-zinc-400 mt-1 not-italic">— {card.speaker}</footer>}
          </blockquote>
        )}

        <p className="text-zinc-900 font-medium mb-4">{card.summary}</p>

        {card.source_citations && card.source_citations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Sources</p>
            <div className="space-y-2">
              {card.source_citations.map((citation, i) => (
                <div key={i} className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-xs text-zinc-600 mb-1 font-medium">
                    {citation.publisher} · <a href={citation.url} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{citation.title}</a>
                  </p>
                  <p className="text-sm text-zinc-700 italic">"{citation.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {card.what_would_change_this && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-xs text-amber-700 uppercase tracking-wider mb-1 font-medium">What would change this verdict</p>
            <p className="text-amber-900 text-sm">{card.what_would_change_this}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <span className="text-xs text-zinc-400">{card.attribution}</span>
          <a href={card.correction_pack_url} className="text-xs text-zinc-500 hover:text-zinc-900">
            Share this verdict →
          </a>
        </div>
      </div>
    </div>
  )
}
