import type { Metadata } from 'next'
import { Container, Eyebrow } from '@fountem/ui'
import { TextClaimForm } from '../../../components/TextClaimForm'
import { getUser } from '../../../lib/supabase/server'

export const metadata: Metadata = {
  title: 'Verify a claim — Unfaked',
  description:
    'Paste any factual claim and Unfaked checks it against trusted primary sources and live web evidence, with a calibrated verdict that cites its sources.',
}

export default async function VerifyPage() {
  const user = await getUser()

  return (
    <section>
      <Container>
        <div className="mx-auto max-w-2xl pb-10 pt-16 text-center sm:pt-20">
          <Eyebrow className="justify-center">Claim verification</Eyebrow>
          <h1 className="mt-5 font-serif text-4xl leading-[1.08] text-forest-900 sm:text-5xl">Is this statement true?</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary">
            Paste a claim from a debate, article, or post. We check it against trusted primary sources and live web
            evidence, and show every source behind the verdict.
          </p>
        </div>
        <div className="mx-auto max-w-2xl pb-20">
          <TextClaimForm signedIn={Boolean(user)} />
        </div>
      </Container>
    </section>
  )
}
