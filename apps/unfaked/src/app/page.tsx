import type { Metadata } from 'next'
import { DetectForm } from '../components/DetectForm'

export const metadata: Metadata = {
  title: 'Unfaked — Detect AI-Generated Political Videos',
  description: '1 in 3 UK voters saw political deepfakes before the 2026 elections. Paste a video URL to get an evidence-backed verdict in seconds.',
}

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-16 pb-32">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-900 bg-red-950/50 text-red-400 text-xs uppercase tracking-widest mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          UK Political Deepfake Detection
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
          Is this video real?
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
          1 in 3 UK voters encountered AI-generated political content before the 2026 elections.
          Paste any video URL for a forensic verdict in under 15 seconds.
        </p>
      </div>

      {/* Detection Form */}
      <DetectForm />

      {/* Trust signals */}
      <div className="mt-16 grid grid-cols-3 gap-6 text-center">
        {[
          { value: '3-layer', label: 'forensic analysis' },
          { value: 'Primary', label: 'source evidence chain' },
          { value: 'Public', label: 'deepfake archive' },
        ].map(({ value, label }) => (
          <div key={label}>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-zinc-500 text-sm">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent cases preview */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-zinc-300 font-semibold">Recent cases</h2>
          <a href="/cases" className="text-red-400 hover:text-red-300 text-sm transition-colors">View archive →</a>
        </div>
        <RecentCases />
      </div>
    </div>
  )
}

async function RecentCases() {
  // Server component — fetch directly from Supabase in production
  // Returns placeholder when DB not configured
  try {
    const { createServiceClient } = await import('@fountem/db')
    const db = createServiceClient()
    const { data } = await db
      .from('video_detections')
      .select('id, verdict, confidence_pct, probable_generator, case_title, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(3)

    if (!data || data.length === 0) return <EmptyCases />
    return (
      <div className="space-y-3">
        {data.map((c: any) => (
          <CaseRow key={c.id} case={c} />
        ))}
      </div>
    )
  } catch {
    return <EmptyCases />
  }
}

function CaseRow({ case: c }: { case: any }) {
  const colours: Record<string, string> = {
    ai_generated: 'text-red-400',
    likely_ai_generated: 'text-orange-400',
    inconclusive: 'text-yellow-400',
    likely_real: 'text-green-400',
    real: 'text-green-400',
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
      <span className={`text-xs font-bold uppercase tracking-wider shrink-0 ${colours[c.verdict] ?? 'text-zinc-400'}`}>
        {c.verdict?.replace(/_/g, ' ')}
      </span>
      <span className="text-zinc-300 text-sm truncate">{c.case_title ?? 'Unnamed'}</span>
      <span className="text-zinc-600 text-xs ml-auto shrink-0">{c.confidence_pct}%</span>
    </div>
  )
}

function EmptyCases() {
  return (
    <p className="text-zinc-600 text-sm text-center py-8 border border-dashed border-zinc-800 rounded-lg">
      No cases yet — be the first to submit a video above.
    </p>
  )
}
