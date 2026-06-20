'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DetectForm } from './DetectForm'
import { TextClaimForm } from './TextClaimForm'

type Mode = 'video' | 'text' | 'live'

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'video', label: 'Video', hint: 'Is this video real?' },
  { id: 'text', label: 'Text claim', hint: 'Is this statement true?' },
  { id: 'live', label: 'Live', hint: 'Fact-check a live debate' },
]

export function ModeSwitcher({ signedIn, initialMode = 'video' }: { signedIn: boolean; initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Verification mode"
        className="mx-auto flex w-full max-w-md items-center gap-1 rounded-full border border-forest-200 bg-white p-1 shadow-card"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              mode === m.id ? 'bg-forest-800 text-parchment' : 'text-ink-secondary hover:bg-parchment-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'video' && <DetectForm signedIn={signedIn} />}
      {mode === 'text' && <TextClaimForm signedIn={signedIn} />}
      {mode === 'live' && <LivePromo signedIn={signedIn} />}
    </div>
  )
}

function LivePromo({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="space-y-4 rounded-2xl border border-forest-200 bg-white p-6 text-center shadow-card">
      <p className="text-sm leading-relaxed text-ink-secondary">
        Watching a live debate or interview? Paste the live stream URL and Unfaked will surface check-worthy claims and
        verify them against the evidence <span className="font-medium text-forest-900">as they&rsquo;re said</span>.
      </p>
      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-amber-800">
        Live · AI-assisted · provisional
      </span>
      <div>
        <Link
          href={signedIn ? '/live' : `/login?next=${encodeURIComponent('/live')}`}
          className="inline-flex items-center justify-center rounded-full bg-forest-800 px-5 py-2.5 text-sm font-medium text-parchment transition-colors hover:bg-forest-900"
        >
          Start a live session →
        </Link>
      </div>
    </div>
  )
}
