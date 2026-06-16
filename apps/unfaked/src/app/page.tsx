'use client'

import { useState } from 'react'
import type { VerdictCard } from '@fountem/verdict'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerdictCard | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: url }),
      })

      if (!response.ok) {
        const err = await response.json() as { error?: string }
        throw new Error(err.error ?? 'Detection failed')
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
    <div className="max-w-2xl mx-auto px-6 pt-20 pb-32">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Is this video real?
        </h1>
        <p className="text-zinc-400 text-lg">
          Paste a video URL to detect AI-generated political content.
          Results in under 15 seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://twitter.com/... or https://youtube.com/..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analysing...' : 'Check'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-zinc-400 text-sm">Running 3-layer forensic analysis…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && <VerdictCardDisplay card={result} />}

      <div className="mt-16 pt-8 border-t border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
          Recent Cases
        </h2>
        <RecentCases />
      </div>
    </div>
  )
}

function VerdictCardDisplay({ card }: { card: VerdictCard }) {
  const colour = card.verdict_colour

  return (
    <div className="rounded-xl border border-zinc-700 overflow-hidden">
      <div className="px-6 py-5" style={{ borderLeft: `4px solid ${colour}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full"
            style={{ backgroundColor: `${colour}20`, color: colour }}
          >
            {card.verdict_label}
          </span>
          <span className="text-zinc-500 text-sm">{card.confidence_pct}% confidence</span>
          {card.probable_generator_label && (
            <span className="text-zinc-500 text-sm">· {card.probable_generator_label}</span>
          )}
        </div>

        <p className="text-white font-medium mb-4">{card.summary}</p>

        {card.what_would_change_this && (
          <div className="bg-zinc-900 rounded-lg p-4 mb-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">What would change this verdict</p>
            <p className="text-zinc-300 text-sm">{card.what_would_change_this}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-600">{card.attribution}</span>
          <div className="flex gap-3">
            <a
              href={card.correction_pack_url}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Share →
            </a>
            <a
              href={card.methodology_url}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Methodology →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function RecentCases() {
  return (
    <a href="/cases" className="text-sm text-zinc-400 hover:text-white transition-colors">
      View the public archive →
    </a>
  )
}
