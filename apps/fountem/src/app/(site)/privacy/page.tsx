import type { Metadata } from 'next'
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
          Last updated: June 2026. A plain-English summary, not legal advice; a full policy will be reviewed by counsel before launch.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed text-ink-secondary">
          <Section title="What we process">
            You submit a political claim as text. We decompose it into sub-claims, retrieve matching evidence from our corpus of
            primary sources, and ask a language model to produce a sourced verdict. We store the claim text, the verdict, and citations.
          </Section>
          <Section title="What we store">
            <ul className="list-disc space-y-1 pl-5">
              <li>The claim text you submit and the verdict produced.</li>
              <li>The evidence chunks and citations used to reach the verdict.</li>
              <li>Your account email and per-day usage counts, used to enforce free-tier limits and prevent abuse.</li>
            </ul>
            <p className="mt-2">Do not submit personal or sensitive information inside a claim — submitted text may be retained to improve evaluation.</p>
          </Section>
          <Section title="Evidence sources">
            Our corpus is built from publicly available primary sources (official statistics, Hansard, manifestos, reputable
            reporting). Every verdict cites the sources it relied on so you can check our work.
          </Section>
          <Section title="Legal basis & your rights (UK GDPR)">
            Our lawful basis is legitimate interest in improving the quality of public debate. You have the right to access,
            rectification, and erasure. Contact <span className="text-ink">privacy@fountem.ai</span> to exercise these rights or to challenge a verdict.
          </Section>
          <Section title="Third parties">
            We use Anthropic and OpenAI to generate embeddings and verdicts (we send only the claim and retrieved evidence),
            Supabase (EU/London region) for storage and authentication, and Netlify for hosting.
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
