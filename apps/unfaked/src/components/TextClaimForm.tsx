'use client'

import { useState } from 'react'
import type { VerdictCard } from '@fountem/verdict'
import { Button, Card } from '@fountem/ui'
import { VerdictPanel } from './VerdictPanel'

type State = 'idle' | 'loading' | 'result' | 'error'

const STEPS = [
  'Retrieving trusted primary sources',
  'Augmenting with live web evidence',
  'Grounded verdict with citations (Claude)',
  'Calibrating confidence',
]

const EXAMPLES = [
  'UK unemployment is at its lowest level in 50 years.',
  'The NHS waiting list has fallen every month this year.',
  'Net migration to the UK doubled in the last decade.',
]

export function TextClaimForm({ signedIn }: { signedIn: boolean }) {
  const [claim, setClaim] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<VerdictCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)

  async function submit(text: string) {
    if (text.trim().length < 10) {
      setError('Please enter a claim of at least 10 characters.')
      setState('error')
      return
    }
    setState('loading')
    setError(null)
    setResult(null)
    setNeedsLogin(false)
    try {
      const response = await fetch('/api/verify-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: text.trim() }),
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
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit(claim)
        }}
        className="space-y-3"
      >
        <div className="rounded-2xl border border-forest-200 bg-white p-2 shadow-card">
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Paste a claim to fact-check — e.g. a statement from a debate, article, or post…"
            rows={3}
            maxLength={500}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none"
            disabled={state === 'loading'}
          />
          <div className="flex items-center justify-between gap-2 px-1 pb-1">
            <span className="font-mono text-[11px] text-ink-muted">{claim.length}/500</span>
            <Button type="submit" disabled={state === 'loading' || claim.trim().length < 10}>
              {state === 'loading' ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-parchment/40 border-t-parchment" />
                  Checking
                </span>
              ) : (
                'Check claim'
              )}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setClaim(ex)
                void submit(ex)
              }}
              disabled={state === 'loading'}
              className="rounded-full border border-forest-200 bg-white px-3 py-1 text-xs text-ink-secondary transition-colors hover:bg-parchment-200"
            >
              {ex}
            </button>
          ))}
        </div>
        {!signedIn && (
          <p className="px-1 text-xs text-ink-muted">
            Free plan: 5 checks/day. You&rsquo;ll be asked to sign in — it&rsquo;s how we keep the service free of abuse.
          </p>
        )}
      </form>

      {state === 'loading' && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-ink-secondary">Checking against the evidence…</p>
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
            <p className="font-medium text-forest-900">Sign in to check a claim</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Checks are free, but require an account so we can stop bots from burning through the service.
            </p>
          </div>
          <a href={`/login?next=${encodeURIComponent('/verify')}`} className="text-sm font-medium text-forest-800 underline">
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
