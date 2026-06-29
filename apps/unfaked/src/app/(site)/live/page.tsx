import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Container, Eyebrow } from '@fountem/ui'
import { LiveConsole } from '../../../components/live/LiveConsole'
import { getUser } from '../../../lib/supabase/server'

export const metadata: Metadata = {
  title: 'Live fact-checking — Unfaked',
  description:
    'Paste a live debate or interview stream and watch check-worthy claims get verified against the evidence in real time. AI-assisted and provisional.',
}

const MOCK = process.env.NEXT_PUBLIC_MOCK_SERVICES === '1'

export default async function LivePage() {
  // Live is signed-in only (provisional, capped). Mock mode is open for demos.
  if (!MOCK) {
    const user = await getUser()
    if (!user) redirect('/login?next=/live')
  }

  return (
    <section>
      <Container size="narrow">
        <div className="py-12">
          <div className="mb-8 text-center">
            <Eyebrow className="justify-center">Live fact-checking</Eyebrow>
            <h1 className="mt-4 font-serif text-4xl leading-[1.08] text-forest-900 sm:text-5xl">
              Fact-check a debate as it happens
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-secondary">
              Paste a live stream and Unfaked surfaces check-worthy claims and verifies them against the evidence in real
              time — every verdict cites its sources.
            </p>
          </div>

          {/* Dark forensic console */}
          <div className="rounded-card border border-forest-100 bg-forest-950 p-5 shadow-card sm:p-6">
            <LiveConsole />
          </div>
        </div>
      </Container>
    </section>
  )
}
