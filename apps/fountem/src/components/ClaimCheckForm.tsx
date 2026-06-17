'use client'

import { useState } from 'react'
import type { VerdictCard } from '@fountem/verdict'
import { Button, Card } from '@fountem/ui'
import { ClaimVerdictCard } from './ClaimVerdictCard'

type State = 'idle' | 'loading' | 'result' | 'error'

const EXAMPLE_CLAIMS = [
  'Labour has built more social housing than any government since Thatcher.',
  'NHS waiting lists have fallen for three consecutive quarters.',
  'UK immigration is at a record high under the current government.',
  'The UK economy has grown faster than Germany since Brexit.',
]

export function ClaimCheckForm({ signedIn }: { signedIn: boolean }) {
  const [claim, setClaim] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<VerdictCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!claim.trim()) return
    setState('loading')
    setError(null)
    setResult(null)
    setNeedsLogin(false)

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: claim.trim() }),
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
      setError(err instanceof Error ? err.message : 'Verification failed')
      setState('error')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="rounded-2xl border border-forest-200 bg-white p-2 shadow-card">
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Enter a UK political claim to verify…"
            rows={3}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none"
            disabled={state === 'loading'}
          />
        </div>
        <Button type="submit" disabled={state === 'loading' || !claim.trim()} className="w-full">
          {state === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-parchment/40 border-t-parchment" />
              Searching the evidence corpus…
            </span>
          ) : (
            'Verify claim'
          )}
        </Button>
        {!signedIn && (
          <p className="px-1 text-xs text-ink-muted">
            Free plan: 10 checks/day. You&rsquo;ll be asked to sign in — it&rsquo;s how we keep the service free of abuse.
          </p>
        )}
      </form>

      {state === 'idle' && (
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-ink-muted">Try an example</p>
          <div className="space-y-2">
            {EXAMPLE_CLAIMS.map((c) => (
              <button
                key={c}
                onClick={() => setClaim(c)}
                className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-left text-sm text-ink-secondary transition-colors hover:border-forest-300 hover:bg-parchment-200"
              >
                &ldquo;{c}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {state === 'error' && needsLogin && (
        <Card className="flex flex-col items-start gap-3 border-forest-200 bg-forest-50">
          <div>
            <p className="font-medium text-forest-900">Sign in to check a claim</p>
            <p className="mt-1 text-sm text-ink-secondary">Checks are free, but require an account so we can prevent abuse.</p>
          </div>
          <a href={`/login?next=${encodeURIComponent('/check')}`} className="text-sm font-medium text-forest-800 underline">
            Log in or sign up →
          </a>
        </Card>
      )}

      {state === 'error' && !needsLogin && error && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {state === 'result' && result && <ClaimVerdictCard card={result} />}
    </div>
  )
}
