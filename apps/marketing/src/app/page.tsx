export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-bold text-xl text-white tracking-tight">Fountem</span>
        <div className="flex items-center gap-6">
          <a href="https://unfaked.ai" className="text-zinc-400 hover:text-white text-sm transition-colors">Unfaked</a>
          <a href="https://fountem.ai" className="text-zinc-400 hover:text-white text-sm transition-colors">Platform</a>
          <a href="mailto:hello@fountem.ai" className="px-4 py-1.5 rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm transition-colors">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/50 border border-red-900 text-red-400 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          1 in 3 UK voters saw AI deepfakes before the 2026 elections
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05] mb-6">
          The truth has<br />
          <span className="text-red-500">never needed more</span><br />
          defending.
        </h1>
        <p className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          Fountem is the UK's only evidence-backed political intelligence platform.
          Unfaked is its public deepfake detection tool. Together, they give voters
          something they've never had: verifiable truth.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="https://unfaked.ai" className="px-8 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-lg transition-colors">
            Detect a deepfake →
          </a>
          <a href="https://fountem.ai" className="px-8 py-4 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold text-lg transition-colors">
            Check a claim
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: '16.5M', label: 'UK adults saw political deepfakes', source: 'Demos, June 2026' },
            { value: '1 in 3', label: 'voters encountered AI political content', source: 'Opinium, May 2026' },
            { value: '39%', label: 'were unsure if content was real', source: 'Demos, June 2026' },
            { value: '£0', label: 'cost to voters', source: 'Always free' },
          ].map(({ value, label, source }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-white mb-1">{value}</div>
              <div className="text-zinc-400 text-sm mb-1">{label}</div>
              <div className="text-zinc-600 text-xs">{source}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Two tools. One mission.</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Unfaked */}
          <div className="rounded-2xl border border-red-900/50 bg-gradient-to-b from-red-950/20 to-transparent p-8">
            <div className="text-red-500 font-bold text-2xl mb-2">Unfaked</div>
            <div className="text-zinc-400 text-sm uppercase tracking-wider mb-6">AI video detection · unfaked.ai</div>
            <ul className="space-y-3 text-zinc-300 text-sm mb-8">
              {[
                'Paste any video URL — get a verdict in 15 seconds',
                '3-layer forensic pipeline (Hive + C2PA + contextual)',
                'Identifies the probable AI generator',
                'Detects evasion attempts',
                'Public UK political deepfake archive',
                'X bot: @unfaked for instant fact-checks',
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">→</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="https://unfaked.ai" className="block text-center py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors">
              Try Unfaked →
            </a>
          </div>

          {/* Fountem */}
          <div className="rounded-2xl border border-blue-900/50 bg-gradient-to-b from-blue-950/20 to-transparent p-8">
            <div className="text-blue-400 font-bold text-2xl mb-2">Fountem</div>
            <div className="text-zinc-400 text-sm uppercase tracking-wider mb-6">Political intelligence · fountem.ai</div>
            <ul className="space-y-3 text-zinc-300 text-sm mb-8">
              {[
                'Verify any UK political claim in seconds',
                'Every verdict cites its primary source',
                'ONS, IFS, Hansard, Full Fact evidence base',
                'Party dossiers: 5 parties × 5 issues',
                'Shareable Correction Packs',
                'B2B API for newsrooms and researchers',
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">→</span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="https://fountem.ai" className="block text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
              Try Fountem →
            </a>
          </div>
        </div>
      </section>

      {/* The differentiators */}
      <section className="border-t border-zinc-800 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Why Fountem is different</h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Every competitor is either an enterprise black box or a generic consumer tool.
            Neither was built for UK voters, UK politics, or UK elections.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'The Evidence Chain',
                desc: 'Every verdict links to the primary source that existed before we touched it — the ONS bulletin, the Hansard timestamp, the IFS report. Not a summary. The source.',
                icon: '🔗',
              },
              {
                title: 'The Public Archive',
                desc: 'A timestamped, searchable, public library of every AI-generated political video we\'ve detected. The Electoral Commission said the UK needed this. Nobody else built it.',
                icon: '📚',
              },
              {
                title: 'Honest Confidence',
                desc: 'Every verdict includes a falsifiability statement — what new evidence would change it. We don\'t claim certainty we don\'t have. That\'s what makes us trustworthy.',
                icon: '⚖️',
              },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4">Democracy needs better tools.</h2>
          <p className="text-zinc-400 text-lg mb-8">We're building them. Join us.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="https://unfaked.ai" className="px-8 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors">
              Try Unfaked — free forever
            </a>
            <a href="mailto:hello@fountem.ai" className="px-8 py-4 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold transition-colors">
              Partner with us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <span>© 2026 Fountem Ltd · Built in the UK</span>
          <div className="flex gap-6">
            <a href="https://unfaked.ai/methodology" className="hover:text-zinc-300">Methodology</a>
            <a href="mailto:press@fountem.ai" className="hover:text-zinc-300">Press</a>
            <a href="mailto:hello@fountem.ai" className="hover:text-zinc-300">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
