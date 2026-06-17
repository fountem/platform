'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, Input, ShieldMark } from '@fountem/ui'
import { createSupabaseBrowserClient } from '../../lib/supabase/client'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

type State = 'idle' | 'sending' | 'sent' | 'error'

function LoginInner() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/'
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<string | null>(params.get('error') ? 'Sign-in failed. Please try again.' : null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) return
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    document.head.appendChild(script)
    const interval = setInterval(() => {
      const w = (window as unknown as { turnstile?: { render: (el: HTMLElement, o: object) => void } }).turnstile
      if (w && turnstileRef.current && !turnstileRef.current.hasChildNodes()) {
        w.render(turnstileRef.current, { sitekey: TURNSTILE_SITE_KEY, callback: (t: string) => setCaptchaToken(t) })
        clearInterval(interval)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` : undefined

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('sending')
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo, captchaToken: captchaToken ?? undefined },
    })
    if (error) {
      setError(error.message)
      setState('error')
    } else {
      setState('sent')
    }
  }

  async function signInGoogle() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-parchment px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl text-forest-900">Welcome to Fountem</h1>
          <p className="mt-2 text-ink-secondary">Log in or sign up to start checking claims.</p>

          {state === 'sent' ? (
            <div className="mt-8 rounded-card border border-forest-200 bg-forest-50 p-6">
              <p className="font-medium text-forest-900">Check your inbox</p>
              <p className="mt-1 text-sm text-ink-secondary">
                We sent a login link to <span className="font-medium text-ink">{email}</span>. Click it to finish signing in.
              </p>
            </div>
          ) : (
            <form onSubmit={sendLink} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-secondary">Email</label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>

              <button
                type="button"
                onClick={signInGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-forest-200 bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-parchment-200"
              >
                <GoogleIcon /> Continue with Google
              </button>

              <div className="flex items-center gap-3 text-xs text-ink-muted">
                <span className="h-px flex-1 bg-forest-200" /> or <span className="h-px flex-1 bg-forest-200" />
              </div>

              {TURNSTILE_SITE_KEY && <div ref={turnstileRef} className="flex justify-center" />}

              <Button type="submit" className="w-full" disabled={state === 'sending'}>
                {state === 'sending' ? 'Sending…' : 'Send me a login link'}
              </Button>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-ink-muted">
                <ShieldMark className="h-4 w-4 text-forest-500" /> Free plan: 10 checks per day
              </p>
            </form>
          )}
        </div>
      </div>

      <div className="relative hidden items-center bg-forest-900 px-12 lg:flex">
        <div>
          <div className="flex items-center gap-3 text-parchment">
            <ShieldMark className="h-12 w-12 text-emerald-300" />
            <span className="font-serif text-5xl">Fountem</span>
          </div>
          <div className="mt-4 h-px w-16 bg-emerald-400" />
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-forest-100">
            Every claim. Every source. Every verdict — checked against the primary record.
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
