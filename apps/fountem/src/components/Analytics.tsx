'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import posthog from 'posthog-js'

let initialised = false

function ensureInit(): boolean {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || typeof window === 'undefined') return false
  if (!initialised) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      person_profiles: 'identified_only',
    })
    initialised = true
  }
  return true
}

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!ensureInit()) return
    let url = window.location.origin + pathname
    const qs = searchParams?.toString()
    if (qs) url += `?${qs}`
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}

/**
 * Privacy-friendly product analytics. No-ops entirely unless
 * NEXT_PUBLIC_POSTHOG_KEY is set, so it is safe to ship before keys land.
 * Note: gate behind the cookie-consent banner before public launch (UK GDPR/PECR).
 */
export function Analytics() {
  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  )
}
