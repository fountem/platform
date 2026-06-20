'use client'

import { useEffect, useRef } from 'react'
import type { LiveTranscriptChunk } from '@fountem/db'

export function LiveTranscript({ chunks }: { chunks: LiveTranscriptChunk[] }) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chunks.length])

  return (
    <div className="flex h-full flex-col">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">Live transcript</p>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {chunks.length === 0 && (
          <p className="text-sm text-zinc-600">Listening for speech…</p>
        )}
        {chunks.map((c) => (
          <div key={c.id}>
            {c.speaker_label && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{c.speaker_label}</span>
            )}
            <p className="text-sm leading-relaxed text-zinc-300">{c.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
