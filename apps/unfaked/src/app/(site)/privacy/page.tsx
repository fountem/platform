import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow } from '@fountem/ui'

export const metadata: Metadata = {
  title: 'Privacy & Data — Unfaked',
  description: 'What Unfaked collects, why, and your rights under UK GDPR.',
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
          <Section title="What we analyse">
            You submit a public URL to a video. We fetch that media via our resolver service, extract technical signals (codec,
            provenance, forensic scores) and produce a verdict. We do <strong className="text-ink">not</strong> store the source
            video itself — only the derived signals, the verdict, and the submitted URL.
          </Section>
          <Section title="What we store">
            <ul className="list-disc space-y-1 pl-5">
              <li>The submitted URL and a content hash (for caching and the public archive).</li>
              <li>Forensic/provenance/contextual signals and the resulting verdict.</li>
              <li>Your account email and per-day usage counts, used to enforce free-tier limits and prevent abuse.</li>
            </ul>
          </Section>
          <Section title="The public archive">
            Verdicts on public political media may be published in the{' '}
            <Link href="/cases" className="font-medium text-forest-700 underline">public archive</Link> in the public interest
            (journalism/research). If you believe a published case is wrong or harmful, contact us for review or removal.
          </Section>
          <Section title="Legal basis & your rights (UK GDPR)">
            Our lawful basis is legitimate interest in countering election misinformation. You have the right to access,
            rectification, and erasure of personal data we hold. To exercise these rights or raise a concern, contact{' '}
            <span className="text-ink">privacy@unfaked.ai</span>.
          </Section>
          <Section title="Third parties">
            To produce a verdict we send media to forensic providers (Hive, Sensity) and AI models (OpenAI). We send only what
            is needed for detection. We use Supabase (EU/London region) for storage and authentication, and Netlify for hosting.
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
