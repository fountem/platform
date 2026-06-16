'use client'

import { useState } from 'react'
import type { VerdictCard } from '@fountem/verdict'

type State = 'idle' | 'loading' | 'result' | 'error'

export function DetectForm() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<VerdictCard | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setState('loading')
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: url.trim() }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error ?? `Error ${response.status}`)
      }

      const card = await response.json() as VerdictCard
      setResult(card)
      setState('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a video URL — YouTube, Twitter/X, TikTok, direct MP4..."
          className="w-full px-5 py-4 pr-32 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 text-sm transition-colors"
          disabled={state === 'loading'}
        />
        <button
          type="submit"
          disabled={state === 'loading' || !url.trim()}
          className="absolute right-2 top-2 bottom-2 px-5 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
        >
          {state === 'loading' ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analysing
            </span>
          ) : 'Detect'}
        </button>
      </form>

      {state === 'loading' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
          <p className="text-zinc-400 text-sm font-medium">Running forensic analysis…</p>
          <div className="space-y-2">
            {['Layer 1: Hive forensic scan', 'Layer 2: C2PA provenance check', 'Layer 3: Contextual intelligence'].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-3 h-3 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" style={{ animationDelay: `${i * 0.2}s` }} />
                <span className="text-zinc-500 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {state === 'error' && error && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setState('idle')} className="text-red-400 hover:text-red-300 text-xs mt-2 underline">
            Try again
          </button>
        </div>
      )}

      {state === 'result' && result && <VerdictCardDisplay card={result} />}
    </div>
  )
}

function VerdictCardDisplay({ card }: { card: VerdictCard }) {
  const [copied, setCopied] = useState(false)

  const colourMap: Record<string, { text: string; border: string; bg: string }> = {
    ai_generated:        { text: 'text-red-400',    border: 'border-red-900',    bg: 'bg-red-950/30' },
    likely_ai_generated: { text: 'text-orange-400', border: 'border-orange-900', bg: 'bg-orange-950/30' },
    inconclusive:        { text: 'text-yellow-400', border: 'border-yellow-900', bg: 'bg-yellow-950/30' },
    likely_real:         { text: 'text-green-400',  border: 'border-green-900',  bg: 'bg-green-950/30' },
    real:                { text: 'text-green-400',  border: 'border-green-900',  bg: 'bg-green-950/30' },
  }
  const colours = colourMap[card.verdict] ?? colourMap.inconclusive

  async function copyShareText() {
    await navigator.clipboard.writeText(card.share_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`rounded-xl border ${colours.border} ${colours.bg} p-6 space-y-5`}>
      {/* Verdict header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`text-xs font-bold uppercase tracking-widest ${colours.text}`}>
            {card.verdict_label}
          </span>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-4xl font-bold ${colours.text}`}>{card.confidence_pct}%</span>
            <span className={`text-sm ${colours.text} opacity-70`}>confidence</span>
          </div>
        </div>
        {card.probable_generator_label && (
          <div className="text-right">
            <div className="text-zinc-500 text-xs uppercase tracking-wider">Generator</div>
            <div className="text-zinc-200 text-sm font-medium mt-0.5">{card.probable_generator_label}</div>
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-zinc-300 text-sm leading-relaxed">{card.summary}</p>

      {/* Layer breakdown */}
      {card.layer_breakdown && (
        <div className="space-y-2">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Analysis layers</p>
          <div className="grid grid-cols-1 gap-2">
            {/* Layer 1 */}
            <LayerRow
              label={card.layer_breakdown.layer1.label}
              score={card.layer_breakdown.layer1.score}
              signals={card.layer_breakdown.layer1.signals}
            />
            {/* Layer 2 */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/50">
              <span className="text-zinc-400 text-xs">{card.layer_breakdown.layer2.label}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className={card.layer_breakdown.layer2.provenance ? 'text-green-400' : 'text-red-400'}>
                  {card.layer_breakdown.layer2.provenance ? '✓ C2PA valid' : '✗ No C2PA'}
                </span>
                {card.layer_breakdown.layer2.metadata_stripped && (
                  <span className="text-orange-400">⚠ Metadata stripped</span>
                )}
              </div>
            </div>
            {/* Layer 3 */}
            <div className="flex items-start justify-between px-3 py-2 rounded-lg bg-zinc-800/50">
              <span className="text-zinc-400 text-xs">{card.layer_breakdown.layer3.label}</span>
              <div className="text-right">
                {card.layer_breakdown.layer3.red_flags.slice(0, 2).map((flag, i) => (
                  <p key={i} className="text-orange-400 text-xs">{flag}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evasion alert */}
      {card.evasion_detected && card.evasion_detected !== 'no' && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-950/40 border border-yellow-900/50">
          <span className="text-yellow-400 text-sm">⚠️</span>
          <div>
            <p className="text-yellow-400 text-xs font-medium uppercase tracking-wider">Evasion attempt {card.evasion_detected === 'yes' ? 'detected' : 'suspected'}</p>
            {card.evasion_description && <p className="text-yellow-300/70 text-xs mt-0.5">{card.evasion_description}</p>}
          </div>
        </div>
      )}

      {/* Falsifiability */}
      {card.what_would_change_this && (
        <div className="border-t border-zinc-800 pt-4">
          <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">What would change this verdict</p>
          <p className="text-zinc-400 text-xs leading-relaxed">{card.what_would_change_this}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
        <button
          onClick={copyShareText}
          className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy share text'}
        </button>
        {card.correction_pack_url && (
          <a
            href={card.correction_pack_url}
            className="flex-1 py-2 rounded-lg bg-red-900/50 hover:bg-red-900 text-red-300 text-sm font-medium text-center transition-colors"
          >
            Full analysis →
          </a>
        )}
      </div>
    </div>
  )
}

function LayerRow({ label, score, signals }: { label: string; score: number | null; signals: string[] }) {
  return (
    <div className="flex items-start justify-between px-3 py-2 rounded-lg bg-zinc-800/50">
      <div>
        <span className="text-zinc-400 text-xs">{label}</span>
        {signals.filter(Boolean).slice(0, 1).map((s, i) => (
          <p key={i} className="text-zinc-500 text-xs mt-0.5">{s}</p>
        ))}
      </div>
      {score !== null && (
        <span className={`text-xs font-bold ${score > 70 ? 'text-red-400' : score > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
          {score}%
        </span>
      )}
    </div>
  )
}
