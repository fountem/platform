import type { Metadata } from 'next'
import { ClaimCheckForm } from '../../components/ClaimCheckForm'

export const metadata: Metadata = {
  title: 'Check a Political Claim — Fountem',
  description: 'Enter a UK political claim to get an evidence-backed verdict with primary source citations.',
}

export default function CheckPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-32">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Check a political claim</h1>
        <p className="text-zinc-400 leading-relaxed">
          Enter any UK political claim — a statistic, a policy commitment, a historical assertion.
          Fountem retrieves the relevant primary source evidence and produces a citable verdict.
        </p>
      </div>
      <ClaimCheckForm />
    </div>
  )
}
