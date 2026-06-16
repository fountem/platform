import { createServiceClient } from '@fountem/db'
import { GENERATOR_LABELS, VERDICT_META } from '@fountem/verdict'

export const revalidate = 300 // Revalidate every 5 minutes

export default async function CasesPage() {
  const db = createServiceClient()

  const { data: cases } = await db
    .from('video_detections')
    .select('id, verdict, confidence_pct, probable_generator, case_title, created_at, evasion_detected')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-32">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">UK Political Deepfake Archive</h1>
        <p className="text-zinc-400">
          Every AI-generated political video detected by Unfaked — timestamped, publicly accessible,
          and available to journalists, researchers, and regulators.
        </p>
      </div>

      <div className="space-y-3">
        {cases?.map(c => {
          const meta = VERDICT_META[c.verdict] ?? VERDICT_META.inconclusive
          const genLabel = c.probable_generator ? GENERATOR_LABELS[c.probable_generator] : null

          return (
            <div key={c.id} className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
              <span
                className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0"
                style={{ backgroundColor: `${meta.colour}20`, color: meta.colour }}
              >
                {meta.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {c.case_title ?? 'Unnamed case'}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {genLabel ?? 'Unknown generator'} · {c.confidence_pct}% confidence
                  {c.evasion_detected === 'yes' && ' · ⚠️ Evasion detected'}
                </p>
              </div>
              <span className="text-zinc-600 text-xs shrink-0">
                {new Date(c.created_at).toLocaleDateString('en-GB')}
              </span>
            </div>
          )
        })}
      </div>

      {(!cases || cases.length === 0) && (
        <p className="text-zinc-500 text-center py-20">No cases yet. Be the first to submit a video.</p>
      )}
    </div>
  )
}
