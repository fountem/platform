import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@fountem/db'
import { serialiseDetectionVerdict } from '@fountem/verdict'
import { Container, Eyebrow } from '@fountem/ui'
import { VerdictPanel } from '../../../../components/VerdictPanel'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const card = await getCard(slug)
  if (!card) return { title: 'Verdict not found | Unfaked' }
  return {
    title: `${card.verdict_label}: ${card.summary.slice(0, 60)}… | Unfaked`,
    description: card.summary,
    openGraph: { images: [{ url: `/api/og?slug=${slug}`, width: 1200, height: 630 }] },
  }
}

async function getCard(slug: string) {
  try {
    const db = createServiceClient()
    const { data: pack } = await db.from('correction_packs').select('*').eq('slug', slug).maybeSingle()
    if (!pack || !pack.detection_id) return null
    const { data: detection } = await db.from('video_detections').select('*').eq('id', pack.detection_id).maybeSingle()
    if (!detection) return null
    return serialiseDetectionVerdict(detection, pack)
  } catch {
    return null
  }
}

export default async function CheckPage({ params }: Props) {
  const { slug } = await params
  const card = await getCard(slug)
  if (!card) notFound()

  return (
    <Container size="narrow">
      <div className="py-14">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Eyebrow>Verdict</Eyebrow>
            <p className="mt-1 text-sm text-ink-muted">
              Analysed {new Date(card.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-forest-700 hover:text-forest-900">Check another →</Link>
        </div>
        <VerdictPanel card={card} />
      </div>
    </Container>
  )
}
