'use client'

import { useState } from 'react'
import type { VerdictCard } from '@fountem/verdict'
import { Button, Card } from '@fountem/ui'
import { VerdictPanel } from './VerdictPanel'

type State = 'idle' | 'loading' | 'result' | 'error'

const STEPS = [
  'Resolving media + provenance (C2PA)',
  'Forensic ensemble (Hive + Sensity)',
  'Temporal & cross-modal analysis',
  'Calibrating confidence band',
]

export function DetectForm({ signedIn }: { signedIn: boolean }) {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<VerdictCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setState('loading')
    setError(null)
    setResult(null)
    setNeedsLogin(false)

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: url.trim() }),
      })

      if (response.status === 401) {
        setNeedsLogin(true)
        setState('error')
        return
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Error ${response.status}`)
      }

      const card = (await response.json()) as VerdictCard
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
        <div className="flex flex-col gap-2 rounded-2xl border border-forest-200 bg-white p-2 shadow-card sm:flex-row sm:items-center">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a video URL — YouTube, X, TikTok, direct MP4…"
            className="w-full flex-1 bg-transparent px-4 py-3 text-sm text-ink placeholder-ink-muted focus:outline-none"
            disabled={state === 'loading'}
          />
          <Button type="submit" disabled={state === 'loading' || !url.trim()} className="shrink-0">
            {state === 'loading' ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-parchment/40 border-t-parchment" />
                Analysing
              </span>
            ) : (
              'Detect'
            )}
          </Button>
        </div>
        {!signedIn && (
          <p className="mt-2 px-1 text-xs text-ink-muted">
            Free plan: 5 checks/day. You&rsquo;ll be asked to sign in — it&rsquo;s how we keep the service free of abuse.
          </p>
        )}
      </form>

      {state === 'loading' && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-ink-secondary">Running forensic analysis…</p>
          <div className="space-y-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 animate-spin rounded-full border-2 border-forest-200 border-t-forest-700"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
                <span className="text-xs text-ink-muted">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {state === 'error' && needsLogin && (
        <Card className="flex flex-col items-start gap-3 border-forest-200 bg-forest-50">
          <div>
            <p className="font-medium text-forest-900">Sign in to run a check</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Checks are free, but require an account so we can stop bots from burning through the service.
            </p>
          </div>
          <a href={`/login?next=${encodeURIComponent('/')}`} className="text-sm font-medium text-forest-800 underline">
            Log in or sign up →
          </a>
        </Card>
      )}

      {state === 'error' && !needsLogin && error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setState('idle')} className="mt-2 text-xs text-red-700 underline">
            Try again
          </button>
        </Card>
      )}

      {state === 'result' && result && <VerdictPanel card={result} />}
    </div>
  )
}
