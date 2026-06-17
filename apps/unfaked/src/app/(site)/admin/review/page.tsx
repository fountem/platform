'use client'

import { useState } from 'react'
import { Button, Card, Container, Eyebrow, Input, StatusChip } from '@fountem/ui'

interface QueueItem {
  id: string
  video_url: string | null
  verdict: string
  confidence_pct: number
  confidence_low: number | null
  confidence_high: number | null
  vendor_disagreement: boolean | null
  reasoning: string | null
  created_at: string
}

const VERDICTS = ['ai_generated', 'likely_ai_generated', 'inconclusive', 'likely_real', 'real']

export default function AdminReviewPage() {
  const [token, setToken] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    const res = await fetch('/api/admin/review', { headers: { 'x-admin-token': token } })
    if (!res.ok) {
      setError(`Failed (${res.status})`)
      return
    }
    const data = (await res.json()) as { queue: QueueItem[] }
    setQueue(data.queue)
    setLoaded(true)
  }

  async function submit(id: string, verdict: string, notes: string) {
    const res = await fetch('/api/admin/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id, verdict, notes, reviewer: 'admin' }),
    })
    if (res.ok) setQueue((q) => q.filter((item) => item.id !== id))
    else setError(`Submit failed (${res.status})`)
  }

  return (
    <Container size="narrow">
      <div className="py-14">
        <Eyebrow>Internal</Eyebrow>
        <h1 className="mt-3 font-serif text-3xl text-forest-900">Human review queue</h1>
        <p className="mt-2 text-sm text-ink-secondary">Detections flagged as uncertain or high-stakes. Confirm or override the verdict.</p>

        <div className="mt-6 flex gap-2">
          <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token" />
          <Button onClick={load} className="shrink-0">Load queue</Button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loaded && queue.length === 0 && <p className="mt-4 text-sm text-ink-muted">Queue is empty.</p>}

        <div className="mt-6 space-y-4">
          {queue.map((item) => (
            <ReviewRow key={item.id} item={item} onSubmit={submit} />
          ))}
        </div>
      </div>
    </Container>
  )
}

function ReviewRow({ item, onSubmit }: { item: QueueItem; onSubmit: (id: string, verdict: string, notes: string) => void }) {
  const [verdict, setVerdict] = useState(item.verdict)
  const [notes, setNotes] = useState('')

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <a href={item.video_url ?? '#'} target="_blank" rel="noreferrer" className="max-w-md truncate text-sm text-forest-700 underline">
          {item.video_url ?? '(no url)'}
        </a>
        <span className="shrink-0 text-xs text-ink-muted">{new Date(item.created_at).toLocaleString('en-GB')}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-secondary">
        <StatusChip verdict={item.verdict} surface="light" />
        <span>{item.confidence_pct}%{item.confidence_low != null && ` (band ${item.confidence_low}–${item.confidence_high}%)`}</span>
        {item.vendor_disagreement && <span className="text-amber-700">· vendors disagree</span>}
      </div>
      {item.reasoning && <p className="text-xs leading-relaxed text-ink-muted">{item.reasoning}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          className="rounded-xl border border-forest-200 bg-white px-3 py-2 text-sm text-ink"
        >
          {VERDICTS.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reviewer notes"
          className="flex-1 rounded-xl border border-forest-200 bg-white px-3 py-2 text-sm text-ink"
        />
        <Button onClick={() => onSubmit(item.id, verdict, notes)} className="shrink-0">Confirm</Button>
      </div>
    </Card>
  )
}
