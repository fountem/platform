import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow } from '@fountem/ui'
import { PARTIES } from '../../../data/parties'

export const metadata: Metadata = {
  title: 'Party Dossiers — Fountem',
  description: 'Evidence-based policy positions and track records for the UK political parties.',
}

export default function PartiesPage() {
  return (
    <Container>
      <div className="py-14">
        <Eyebrow>Dossiers</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl text-forest-900">Party dossiers</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-secondary">
          Policy positions and evidence-weighted track records, by party. Each score links to the primary-source evidence used —
          an assessment of delivery against stated commitments, not an endorsement.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARTIES.map((party) => (
            <Link
              key={party.slug}
              href={`/parties/${party.slug}`}
              className="group rounded-card border border-forest-100 bg-white p-5 shadow-card transition-colors hover:border-forest-300"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: party.colour }} />
                <span className="font-serif text-lg text-forest-900">{party.name}</span>
              </div>
              <p className="text-sm text-ink-secondary">{party.description}</p>
              <div className="mt-3 text-xs text-ink-muted">Led by {party.leader}</div>
              <div className="mt-3 text-sm font-medium text-forest-700 group-hover:text-forest-900">View dossier →</div>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  )
}
