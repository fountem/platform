import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@fountem/db'
import { serialiseDetectionVerdict } from '@fountem/verdict'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const card = await getCard(slug)
  if (!card) return { title: 'Verdict not found | Unfaked' }
  return {
    title: `${card.verdict_label}: ${card.summary.slice(0, 60)}… | Unfaked`,
    description: card.summary,
    openGraph: {
      images: [{ url: `/api/og?slug=${slug}`, width: 1200, height: 630 }],
    },
  }
}

async function getCard(slug: string) {
  try {
    const db = createServiceClient()
    const { data: pack } = await db
      .from('correction_packs')
      .select('*, video_detections(*)')
      .eq('slug', slug)
      .single()

    if (!pack) return null
    const detection = (pack as any).video_detections
    if (!detection) return null
    return serialiseDetectionVerdict(detection, pack)
  } catch { return null }
}

export default async function CheckPage({ params }: Props) {
  const { slug } = await params
  const card = await getCard(slug)
  if (!card) notFound()

  const colourMap: Record<string, string> = {
    ai_generated: '#ef4444', likely_ai_generated: '#f97316',
    inconclusive: '#facc15', likely_real: '#86efac', real: '#22c55e',
  }
  const colour = colourMap[card.verdict] ?? '#64748b'

  return (
    <div className="max-w-2xl mx-auto px-4 pt-12 pb-32">
      <div className="rounded-2xl border bg-zinc-900 overflow-hidden" style={{ borderColor: `${colour}40` }}>
        {/* Header bar */}
        <div className="px-6 py-4" style={{ backgroundColor: `${colour}15` }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: colour }}>
              {card.verdict_label}
            </span>
            <span className="text-zinc-500 text-xs">
              {new Date(card.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-5xl font-bold" style={{ color: colour }}>{card.confidence_pct}%</span>
            <span className="text-zinc-400 text-sm ml-2">confidence</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-white leading-relaxed">{card.summary}</p>

          {card.probable_generator_label && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Probable generator:</span>
              <span className="text-zinc-200 font-medium">{card.probable_generator_label}</span>
            </div>
          )}

          {card.layer_breakdown && (
            <div className="space-y-2">
              <h3 className="text-zinc-500 text-xs uppercase tracking-wider">Forensic layers</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm px-3 py-2 rounded-lg bg-zinc-800">
                  <span className="text-zinc-400">Forensic score</span>
                  <span className="font-medium text-white">{card.layer_breakdown.layer1.score}%</span>
                </div>
                <div className="flex justify-between text-sm px-3 py-2 rounded-lg bg-zinc-800">
                  <span className="text-zinc-400">C2PA provenance</span>
                  <span className={card.layer_breakdown.layer2.provenance ? 'text-green-400' : 'text-red-400'}>
                    {card.layer_breakdown.layer2.provenance ? 'Valid' : 'None'}
                  </span>
                </div>
                {card.layer_breakdown.layer3.red_flags.length > 0 && (
                  <div className="px-3 py-2 rounded-lg bg-zinc-800">
                    <span className="text-zinc-400 text-sm block mb-1">Contextual red flags</span>
                    {card.layer_breakdown.layer3.red_flags.map((f, i) => (
                      <p key={i} className="text-orange-400 text-xs">{f}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {card.what_would_change_this && (
            <div className="border-t border-zinc-800 pt-4">
              <h3 className="text-zinc-500 text-xs uppercase tracking-wider mb-2">What would change this verdict</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{card.what_would_change_this}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-zinc-600 text-xs">Verified by Unfaked · powered by Fountem</span>
          <a href="/" className="text-red-400 hover:text-red-300 text-sm transition-colors">Check another video →</a>
        </div>
      </div>
    </div>
  )
}
