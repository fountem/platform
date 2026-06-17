import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@fountem/db'
import { serialiseClaimVerdict } from '@fountem/verdict'
import type { VerdictCard } from '@fountem/verdict'
import { Container, Eyebrow } from '@fountem/ui'
import { ClaimVerdictCard } from '../../../../components/ClaimVerdictCard'

interface Props { params: Promise<{ slug: string }> }

export default async function PackPage({ params }: Props) {
  const { slug } = await params

  let card: VerdictCard | null = null
  let claimText = ''
  try {
    const db = createServiceClient()
    const { data: pack } = await db
      .from('correction_packs')
      .select('*, verdicts(*, claims(claim_text))')
      .eq('slug', slug)
      .single()

    if (!pack) notFound()
    const verdict = (pack as unknown as { verdicts?: { claims?: { claim_text?: string } } }).verdicts
    if (!verdict) notFound()

    claimText = verdict.claims?.claim_text ?? ''
    card = serialiseClaimVerdict(verdict as never, claimText, pack as never)
  } catch {
    notFound()
  }

  if (!card) notFound()

  return (
    <Container size="narrow">
      <div className="py-14">
        <div className="mb-6 flex items-center justify-between">
          <Eyebrow>Correction pack</Eyebrow>
          <Link href="/check" className="text-sm font-medium text-forest-700 hover:text-forest-900">Check a claim →</Link>
        </div>
        <ClaimVerdictCard card={card} claimText={claimText} />
      </div>
    </Container>
  )
}
