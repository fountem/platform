import { ButtonLink, Container, Eyebrow, ShieldMark, Stat } from '@fountem/ui'

export default function MarketingHome() {
  return (
    <div>
      {/* Nav */}
      <header className="border-b border-forest-100">
        <Container size="wide">
          <div className="flex h-16 items-center justify-between">
            <span className="flex items-center gap-2.5">
              <ShieldMark className="h-6 w-6 text-forest-800" />
              <span className="font-serif text-xl text-forest-900">Fountem</span>
            </span>
            <div className="flex items-center gap-6">
              <a href="https://unfaked.ai" className="text-sm text-ink-secondary transition-colors hover:text-forest-800">Unfaked</a>
              <a href="https://fountem.ai" className="text-sm text-ink-secondary transition-colors hover:text-forest-800">Platform</a>
              <ButtonLink href="mailto:hello@fountem.ai" variant="secondary" className="px-4 py-2">Contact</ButtonLink>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero */}
      <section>
        <Container size="wide">
          <div className="mx-auto max-w-3xl py-20 text-center sm:py-28">
            <Eyebrow className="justify-center">1 in 3 UK voters saw political deepfakes before the 2026 elections</Eyebrow>
            <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-forest-900 sm:text-6xl lg:text-7xl">
              The truth has never needed more defending.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-ink-secondary">
              Fountem is the UK&rsquo;s evidence-backed political intelligence platform. Unfaked is its public verification
              tool &mdash; deepfakes, written claims, and live broadcasts. Together, they give voters something they&rsquo;ve
              never had: verifiable truth, in real time.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink href="https://unfaked.ai" variant="primary" className="px-7 py-4 text-base">Detect a deepfake →</ButtonLink>
              <ButtonLink href="https://fountem.ai" variant="secondary" className="px-7 py-4 text-base">Check a claim</ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="border-y border-forest-100 bg-parchment-200">
        <Container size="wide">
          <div className="grid grid-cols-2 gap-8 py-12 text-center sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <Stat value={s.value} label={s.label} />
                <div className="mt-1 text-xs text-ink-muted">{s.source}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Products */}
      <section>
        <Container size="wide">
          <div className="py-20">
            <h2 className="text-center font-serif text-3xl text-forest-900">Two tools. One mission.</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <ProductCard
                name="Unfaked"
                tagline="Video, text & live fact-checking · unfaked.ai"
                href="https://unfaked.ai"
                cta="Try Unfaked →"
                features={[
                  'Paste any video URL — get a deepfake verdict in seconds',
                  'Check any written claim against trusted UK sources',
                  'Live fact-check debates and interviews as they air',
                  'Provenance-first ensemble (C2PA + Hive + Sensity)',
                  'Public UK political deepfake archive',
                  'X bot: @unfaked for instant checks',
                ]}
              />
              <ProductCard
                name="Fountem"
                tagline="Political intelligence · fountem.ai"
                href="https://fountem.ai"
                cta="Try Fountem →"
                features={[
                  'Verify any UK political claim in seconds',
                  'Every verdict cites its primary source',
                  'ONS, IFS, Hansard, Full Fact evidence base',
                  'Party dossiers: positions × track record',
                  'Shareable correction packs',
                  'B2B API for newsrooms and researchers',
                ]}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Differentiators */}
      <section className="border-t border-forest-100 bg-parchment-200">
        <Container size="wide">
          <div className="py-20">
            <h2 className="text-center font-serif text-3xl text-forest-900">Why Fountem is different</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-ink-secondary">
              Every competitor is either an enterprise black box or a generic consumer tool. Neither was built for UK voters, UK
              politics, or UK elections.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {DIFFERENTIATORS.map((d) => (
                <div key={d.title} className="rounded-card border border-forest-100 bg-white p-6 shadow-card">
                  <d.icon className="h-6 w-6 text-forest-700" />
                  <h3 className="mt-4 font-serif text-lg text-forest-900">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section>
        <Container size="wide">
          <div className="mx-auto max-w-3xl py-24 text-center">
            <h2 className="font-serif text-4xl text-forest-900">Democracy needs better tools.</h2>
            <p className="mt-4 text-lg text-ink-secondary">We&rsquo;re building them. Join us.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink href="https://unfaked.ai" variant="primary" className="px-7 py-4 text-base">Try Unfaked — free</ButtonLink>
              <ButtonLink href="mailto:hello@fountem.ai" variant="secondary" className="px-7 py-4 text-base">Partner with us</ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-forest-900 text-forest-100">
        <Container size="wide">
          <div className="flex flex-col items-center justify-between gap-4 py-10 text-sm text-forest-100/70 sm:flex-row">
            <span>© {new Date().getFullYear()} Fountem Ltd · Built in the UK</span>
            <div className="flex gap-6">
              <a href="https://unfaked.ai/methodology" className="hover:text-parchment">Methodology</a>
              <a href="mailto:press@fountem.ai" className="hover:text-parchment">Press</a>
              <a href="mailto:hello@fountem.ai" className="hover:text-parchment">Contact</a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}

const STATS = [
  { value: '16.5M', label: 'UK adults saw political deepfakes', source: 'Demos, June 2026' },
  { value: '1 in 3', label: 'voters encountered AI political content', source: 'Opinium, May 2026' },
  { value: '39%', label: 'were unsure if content was real', source: 'Demos, June 2026' },
  { value: 'Free', label: 'for voters to use', source: 'Always' },
]

function ProductCard({
  name,
  tagline,
  href,
  cta,
  features,
}: {
  name: string
  tagline: string
  href: string
  cta: string
  features: string[]
}) {
  return (
    <div className="flex flex-col rounded-card border border-forest-100 bg-white p-8 shadow-card">
      <div className="font-serif text-2xl text-forest-900">{name}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-ink-muted">{tagline}</div>
      <ul className="mt-6 flex-1 space-y-3 text-sm text-ink-secondary">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 text-forest-600">→</span>
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <ButtonLink href={href} variant="primary" className="w-full">{cta}</ButtonLink>
      </div>
    </div>
  )
}

const DIFFERENTIATORS = [
  {
    title: 'The evidence chain',
    desc: 'Every verdict links to the primary source that existed before we touched it — the ONS bulletin, the Hansard timestamp, the IFS report. Not a summary. The source.',
    icon: LinkIcon,
  },
  {
    title: 'The public archive',
    desc: 'A timestamped, searchable, public library of every AI-generated political video we\u2019ve detected. The Electoral Commission said the UK needed this. Nobody else built it.',
    icon: ArchiveIcon,
  },
  {
    title: 'Honest confidence',
    desc: 'Every verdict includes a falsifiability statement — what new evidence would change it. We don\u2019t claim certainty we don\u2019t have. That\u2019s what makes us trustworthy.',
    icon: ScaleIcon,
  },
]

function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ArchiveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M5 21V7l7-4 7 4v14M5 21h14M9 21v-6h6v6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3v18M5 7h14M5 7l-3 6h6l-3-6Zm14 0-3 6h6l-3-6ZM8 21h8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
