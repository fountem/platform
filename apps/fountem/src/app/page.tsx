import type { Metadata } from 'next'
import { PARTIES } from '../data/parties'

export const metadata: Metadata = { title: 'Fountem — UK Political Intelligence' }

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 pt-16 pb-32">
      <div className="max-w-2xl mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-900 bg-blue-950/50 text-blue-400 text-xs uppercase tracking-widest mb-6">
          Evidence-backed UK political intelligence
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white leading-[1.1]">
          Every claim. Every source.<br />Every verdict.
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed mb-8">
          Fountem verifies UK political claims against primary sources — ONS data, Hansard records, IFS analysis.
          Not summaries. The actual source, cited, dated, and linked.
        </p>
        <a
          href="/check"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          Check a political claim →
        </a>
      </div>

      {/* Party dossiers */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">Party dossiers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PARTIES.map(party => (
            <a
              key={party.slug}
              href={`/parties/${party.slug}`}
              className="p-5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: party.colour }} />
                <span className="text-white font-medium">{party.shortName}</span>
              </div>
              <p className="text-zinc-400 text-sm mb-3">{party.description}</p>
              <div className="text-zinc-500 text-xs">Led by {party.leader}</div>
              <div className="text-blue-400 text-sm mt-3 group-hover:text-blue-300 transition-colors">
                View dossier →
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
