import type { Metadata } from 'next'
import Link from 'next/link'
import { ButtonLink, Container, Eyebrow } from '@fountem/ui'
import { PARTIES } from '../../data/parties'

export const metadata: Metadata = { title: 'Fountem — UK Political Intelligence' }

export default function HomePage() {
  return (
    <>
      <section>
        <Container>
          <div className="max-w-3xl py-16 sm:py-24">
            <Eyebrow>Evidence-backed UK political intelligence</Eyebrow>
            <h1 className="mt-5 font-serif text-5xl leading-[1.05] text-forest-900 sm:text-6xl">
              Every claim. Every source. Every verdict.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary">
              Fountem verifies UK political claims against primary sources — ONS data, Hansard records, IFS analysis. Not
              summaries. The actual source, cited, dated, and linked.
            </p>
            <div className="mt-8">
              <ButtonLink href="/check" variant="primary">Check a political claim →</ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-forest-100 bg-parchment-200">
        <Container>
          <div className="py-14">
            <Eyebrow>Dossiers</Eyebrow>
            <h2 className="mt-2 font-serif text-2xl text-forest-900">Party dossiers</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PARTIES.map((party) => (
                <Link
                  key={party.slug}
                  href={`/parties/${party.slug}`}
                  className="group rounded-card border border-forest-100 bg-white p-5 shadow-card transition-colors hover:border-forest-300"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: party.colour }} />
                    <span className="font-serif text-lg text-forest-900">{party.shortName}</span>
                  </div>
                  <p className="text-sm text-ink-secondary">{party.description}</p>
                  <div className="mt-3 text-xs text-ink-muted">Led by {party.leader}</div>
                  <div className="mt-3 text-sm font-medium text-forest-700 group-hover:text-forest-900">View dossier →</div>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
