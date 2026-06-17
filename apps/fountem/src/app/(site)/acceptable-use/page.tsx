import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow } from '@fountem/ui'

export const metadata: Metadata = {
  title: 'Acceptable Use — Fountem',
  description: 'How Fountem may and may not be used.',
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
          <Section title="Use Fountem responsibly">
            Fountem exists to improve the quality of public debate. Verdicts are{' '}
            <strong className="text-ink">evidence-backed assessments, not the final word</strong>. Check the cited
            sources, and do not present a verdict as conclusive proof or as advice on how to vote.
          </Section>
          <Section title="You must not">
            <ul className="list-disc space-y-1 pl-5">
              <li>Submit personal or sensitive information about identifiable private individuals inside a claim.</li>
              <li>Use Fountem to harass, defame or mislead, or to misrepresent a verdict or its sources.</li>
              <li>Quote a verdict out of context, strip its citations, or imply false certainty.</li>
              <li>Attempt to evade rate limits, scrape the service, or use it for bulk/commercial purposes without an
                API agreement.</li>
              <li>Probe, attack, or interfere with the service or other users.</li>
              <li>Use the service to break the law, including electoral, data-protection or defamation law.</li>
            </ul>
          </Section>
          <Section title="Election periods">
            Take extra care during elections. Do not use Fountem to make or amplify false statements of fact about a
            candidate&rsquo;s personal character or conduct. We may apply additional human review to election-related
            verdicts.
          </Section>
          <Section title="Enforcement">
            We may remove content, rate-limit, suspend or terminate accounts that breach this policy. To report misuse,
            email <span className="text-ink">abuse@fountem.ai</span>.
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
