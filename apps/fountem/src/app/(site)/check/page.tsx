import type { Metadata } from 'next'
import { Container, Eyebrow } from '@fountem/ui'
import { ClaimCheckForm } from '../../../components/ClaimCheckForm'
import { getUser } from '../../../lib/supabase/server'

export const metadata: Metadata = {
  title: 'Check a Political Claim — Fountem',
  description: 'Enter a UK political claim to get an evidence-backed verdict with primary source citations.',
}

export default async function CheckPage() {
  const user = await getUser()
  return (
    <Container size="narrow">
      <div className="py-14">
        <Eyebrow>Claim check</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl text-forest-900">Check a political claim</h1>
        <p className="mt-3 leading-relaxed text-ink-secondary">
          Enter any UK political claim — a statistic, a policy commitment, a historical assertion. Fountem retrieves the
          relevant primary-source evidence and produces a citable verdict.
        </p>
        <div className="mt-8">
          <ClaimCheckForm signedIn={Boolean(user)} />
        </div>
      </div>
    </Container>
  )
}
