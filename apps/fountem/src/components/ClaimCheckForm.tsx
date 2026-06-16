'use client'

import { useState } from 'react'
import type { VerdictCard } from '@fountem/verdict'

type State = 'idle' | 'loading' | 'result' | 'error'

const EXAMPLE_CLAIMS = [
  'Labour has built more social housing than any government since Thatcher.',
  'NHS waiting lists have fallen for three consecutive quarters.',
  'UK immigration is at a record high under the current government.',
  'The UK economy has grown faster than Germany since Brexit.',
]

export function ClaimCheckForm() {
  const [claim, setClaim] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<VerdictCard | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!claim.trim()) return

    setState('loading')
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: claim.trim() }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error ?? `Error ${response.status}`)
      }

      const card = await response.json() as VerdictCard
      setResult(card)
      setState('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setState('error')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={claim}
          onChange={e => setClaim(e.target.value)}
          placeholder="Enter a UK political claim to verify..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm resize-none transition-colors"
          disabled={state === 'loading'}
        />
        <button
          type="submit"
          disabled={state === 'loading' || !claim.trim()}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium transition-colors"
        >
          {state === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching evidence database…
            </span>
          ) : 'Verify claim'}
        </button>
      </form>

      {/* Example claims */}
      {state === 'idle' && (
        <div>
          <p className="text-zinc-600 text-xs uppercase tracking-wider mb-3">Try an example</p>
          <div className="space-y-2">
            {EXAMPLE_CLAIMS.map(c => (
              <button
                key={c}
                onClick={() => setClaim(c)}
                className="w-full text-left px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 text-sm transition-colors"
              >
                "{c}"
              </button>
            ))}
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {state === 'result' && result && <ClaimVerdictCard card={result} />}
    </div>
  )
}

function ClaimVerdictCard({ card }: { card: VerdictCard }) {
  const [copied, setCopied] = useState(false)

  const colourMap: Record<string, { text: string; border: string; bg: string }> = {
    true:         { text: 'text-green-400',  border: 'border-green-900',  bg: 'bg-green-950/30' },
    mostly_true:  { text: 'text-green-400',  border: 'border-green-900',  bg: 'bg-green-950/30' },
    half_true:    { text: 'text-yellow-400', border: 'border-yellow-900', bg: 'bg-yellow-950/30' },
    mostly_false: { text: 'text-orange-400', border: 'border-orange-900', bg: 'bg-orange-950/30' },
    false:        { text: 'text-red-400',    border: 'border-red-900',    bg: 'bg-red-950/30' },
    misleading:   { text: 'text-orange-400', border: 'border-orange-900', bg: 'bg-orange-950/30' },
    unverifiable: { text: 'text-zinc-400',   border: 'border-zinc-700',   bg: 'bg-zinc-900' },
    inconclusive: { text: 'text-zinc-400',   border: 'border-zinc-700',   bg: 'bg-zinc-900' },
  }
  const colours = colourMap[card.verdict] ?? colourMap.inconclusive

  async function copy() {
    await navigator.clipboard.writeText(card.share_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`rounded-xl border ${colours.border} ${colours.bg} p-6 space-y-5`}>
      <div>
        <span className={`text-xs font-bold uppercase tracking-widest ${colours.text}`}>{card.verdict_label}</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className={`text-4xl font-bold ${colours.text}`}>{card.confidence_pct}%</span>
          <span className="text-zinc-500 text-sm">confidence</span>
        </div>
      </div>

      <p className="text-white leading-relaxed">{card.summary}</p>
      <p className="text-zinc-400 text-sm leading-relaxed">{card.reasoning}</p>

      {/* Evidence chain */}
      {card.source_citations && card.source_citations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-zinc-500 text-xs uppercase tracking-wider">Evidence sources</h3>
          {card.source_citations.map((cit: any, i: number) => (
            <div key={i} className="px-4 py-3 rounded-lg bg-zinc-800/60 border-l-2 border-blue-600">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-blue-400 text-xs font-medium">{cit.publisher}</span>
                <span className="text-zinc-600 text-xs shrink-0">{cit.published_at}</span>
              </div>
              <p className="text-zinc-300 text-sm font-medium mb-1">{cit.source_title}</p>
              {cit.excerpt && <p className="text-zinc-500 text-xs italic">"{cit.excerpt}"</p>}
              <a href={cit.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:text-blue-300 mt-1 block">
                View source →
              </a>
            </div>
          ))}
        </div>
      )}

      {card.what_would_change_this && (
        <div className="border-t border-zinc-800 pt-4">
          <h3 className="text-zinc-600 text-xs uppercase tracking-wider mb-1">What would change this verdict</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">{card.what_would_change_this}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
        <button onClick={copy} className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
          {copied ? '✓ Copied' : 'Copy share text'}
        </button>
        {card.correction_pack_url && (
          <a href={card.correction_pack_url} className="flex-1 py-2 rounded-lg bg-blue-900/50 hover:bg-blue-900 text-blue-300 text-sm font-medium text-center transition-colors">
            Correction pack →
          </a>
        )}
      </div>
    </div>
  )
}
