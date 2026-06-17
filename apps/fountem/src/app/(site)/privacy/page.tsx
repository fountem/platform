import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow } from '@fountem/ui'

export const metadata: Metadata = {
  title: 'Privacy & Data — Fountem',
  description: 'What Fountem collects, why, and your rights under UK GDPR.',
}

export default function PrivacyPage() {
  return (
    <Container size="narrow">
      <article className="py-14">
        <Eyebrow>Privacy</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl text-forest-900">Privacy &amp; data</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Last updated: June 2026. Plain-English where possible. This policy will be reviewed by counsel before launch.
          Fountem is operated by Fountem Ltd (England &amp; Wales), the data controller.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed text-ink-secondary">
          <Section title="What we process">
            You submit a political claim as text. We decompose it into sub-claims, retrieve matching evidence from our
            corpus of primary sources, and ask a language model to produce a sourced verdict. We store the claim text,
            the verdict, and the citations.
          </Section>
          <Section title="What we store">
            <ul className="list-disc space-y-1 pl-5">
              <li>The claim text you submit and the verdict produced.</li>
              <li>The evidence chunks and citations used to reach the verdict.</li>
              <li>Your account email and per-day usage counts, used to enforce free-tier limits and prevent abuse.</li>
              <li>Limited technical data (e.g. IP-derived rate-limit data) used only for security and anti-abuse.</li>
            </ul>
            <p className="mt-2">Do not submit personal or sensitive information inside a claim &mdash; submitted text
              may be retained to improve evaluation.</p>
          </Section>
          <Section title="Legal basis (UK GDPR Article 6)">
            Our lawful basis is <strong className="text-ink">legitimate interests</strong> &mdash; improving the quality
            of public debate &mdash; balanced against your rights in a documented assessment. We also rely on{' '}
            <strong className="text-ink">contract</strong> for providing your account. We assess claims about public
            figures&rsquo; public statements and party positions in a journalistic/research context, and we do not build
            profiles of private individuals&rsquo; political opinions.
          </Section>
          <Section title="How long we keep it">
            We keep account data for the life of your account (and a short period after a deletion request), and usage
            counters on a rolling basis. Verdicts published in the public interest may be retained, subject to the review
            and removal route below.
          </Section>
          <Section title="Evidence sources">
            Our corpus is built from publicly available primary sources (official statistics, Hansard, manifestos,
            reputable reporting), used and attributed under their respective licences or under fair dealing. Every
            verdict cites the sources it relied on so you can check our work.
          </Section>
          <Section title="Your rights">
            You have the right to access, rectification, erasure, restriction, objection, and portability of personal
            data we hold, and the right to complain to the Information Commissioner&rsquo;s Office (ICO). To exercise
            these rights or to challenge a verdict, email <span className="text-ink">privacy@fountem.ai</span>.
          </Section>
          <Section title="Third parties and international transfers">
            We use Anthropic and OpenAI to generate embeddings and verdicts (we send only the claim and retrieved
            evidence), Supabase (EU/London region) for storage and authentication, and Vercel for hosting. Some
            providers may process data outside the UK/EEA; where they do, we put appropriate safeguards (such as the UK
            International Data Transfer Agreement) in place.
          </Section>
          <Section title="Cookies">
            We use only strictly necessary cookies for sign-in and security. See our{' '}
            <Link href="/cookies" className="font-medium text-forest-700 underline">cookie policy</Link>.
          </Section>
          <Section title="Contact">
            Data matters: <span className="text-ink">privacy@fountem.ai</span>. Corrections / right of reply:{' '}
            <span className="text-ink">corrections@fountem.ai</span>. Legal:{' '}
            <span className="text-ink">legal@fountem.ai</span>.
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
