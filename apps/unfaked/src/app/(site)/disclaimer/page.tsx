import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow } from '@fountem/ui'

export const metadata: Metadata = {
  title: 'Disclaimer & Right of Reply — Unfaked',
  description: 'The limits of Unfaked verdicts, and how to challenge one.',
}

export default function DisclaimerPage() {
  return (
    <Container size="narrow">
      <article className="py-14">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl text-forest-900">Disclaimer &amp; right of reply</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: June 2026.</p>

        <div className="mt-10 space-y-10 leading-relaxed text-ink-secondary">
          <Section title="Verdicts are assessments, not proof">
            Every Unfaked verdict is an <strong className="text-ink">evidence-based assessment, not definitive proof</strong>.
            Automated detection has real and known error rates, especially on compressed, re-encoded or low-resolution
            media. We publish a calibrated confidence band, a per-signal breakdown, and a{' '}
            <em>what would change this</em> statement so you can judge the strength of each verdict for yourself.
          </Section>
          <Section title="No reliance">
            Do not rely on a verdict as the sole basis for any decision, publication or allegation about any person. A
            verdict is one input alongside other evidence and human judgement. We are not liable for decisions taken in
            reliance on a verdict &mdash; see our{' '}
            <Link href="/terms" className="font-medium text-forest-700 underline">terms</Link>.
          </Section>
          <Section title="Not legal, professional or electoral advice">
            Unfaked does not provide legal or professional advice and is not affiliated with any political party,
            candidate or campaign. We are proudly non-partisan and we do not tell anyone how to vote.
          </Section>
          <Section title="Right of reply, corrections and removal">
            If you are affected by a verdict and believe it is wrong or harmful, you can challenge it. We aim to
            acknowledge within 2 working days and resolve within 10, and we will provisionally unpublish an archived
            case where there is a credible risk of serious harm while we re-review it. We correct rather than silently
            delete: amended verdicts are marked as updated. Contact{' '}
            <span className="text-ink">corrections@unfaked.ai</span> (or{' '}
            <span className="text-ink">legal@unfaked.ai</span> for legal matters, and{' '}
            <span className="text-ink">privacy@unfaked.ai</span> to exercise data-protection rights).
          </Section>
        </div>
      </article>
    </Container>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-serif text-2xl text-forest-900">{title}</h2>
      <div>{children}</div>
    </section>
  )
}
