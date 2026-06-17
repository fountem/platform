import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow } from '@fountem/ui'

export const metadata: Metadata = {
  title: 'Acceptable Use — Unfaked',
  description: 'How Unfaked may and may not be used.',
}

export default function AcceptableUsePage() {
  return (
    <Container size="narrow">
      <article className="py-14">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl text-forest-900">Acceptable use policy</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Last updated: June 2026. This policy forms part of our{' '}
          <Link href="/terms" className="font-medium text-forest-700 underline">terms of service</Link>.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed text-ink-secondary">
          <Section title="Use Unfaked responsibly">
            Unfaked exists to strengthen information integrity. Verdicts are{' '}
            <strong className="text-ink">assessments, not definitive proof</strong>. Do not present a verdict as
            conclusive, and do not use it to make or amplify allegations about a person without your own verification
            and context.
          </Section>
          <Section title="You must not">
            <ul className="list-disc space-y-1 pl-5">
              <li>Use Unfaked to harass, defame, threaten or endanger any person.</li>
              <li>Misrepresent a verdict &mdash; for example, claiming a result proves someone &ldquo;lied&rdquo; or
                that genuine footage is &ldquo;100% fake&rdquo;.</li>
              <li>Submit content you have no right to submit, or attempt to deanonymise private individuals.</li>
              <li>Attempt to evade rate limits, scrape the service, or use it for bulk/commercial purposes without an
                API agreement.</li>
              <li>Probe, attack, or interfere with the service, its infrastructure, or other users.</li>
              <li>Use the service to break the law, including electoral, data-protection or defamation law.</li>
            </ul>
          </Section>
          <Section title="Election periods">
            Take extra care during elections. Do not use Unfaked to make false statements of fact about a candidate&rsquo;s
            personal character or conduct. We may apply additional human review to election-related cases.
          </Section>
          <Section title="Enforcement">
            We may remove content, rate-limit, suspend or terminate accounts that breach this policy, and we may report
            unlawful activity to the authorities. To report misuse, email{' '}
            <span className="text-ink">abuse@unfaked.ai</span>.
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
