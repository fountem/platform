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
          Last updated: June 2026. Plain-English where possible. This policy will be reviewed by counsel before launch.
          Unfaked is operated by Fountem Ltd (England &amp; Wales), the data controller.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed text-ink-secondary">
          <Section title="What we analyse">
            You submit a public URL to a video. We fetch that media via our resolver service, extract technical signals
            (codec, provenance, forensic scores) and produce a verdict. We do <strong className="text-ink">not</strong>{' '}
            store the source video itself &mdash; only the derived signals, the verdict, and the submitted URL.
          </Section>
          <Section title="What we store">
            <ul className="list-disc space-y-1 pl-5">
              <li>The submitted URL and a content hash (for caching and the public archive).</li>
              <li>Forensic/provenance/contextual signals and the resulting verdict.</li>
              <li>Your account email and per-day usage counts, used to enforce free-tier limits and prevent abuse.</li>
              <li>Limited technical data (e.g. IP-derived rate-limit data) used only for security and anti-abuse.</li>
            </ul>
          </Section>
          <Section title="Legal basis (UK GDPR Article 6)">
            Our lawful basis is <strong className="text-ink">legitimate interests</strong> &mdash; countering election
            misinformation and protecting information integrity &mdash; balanced against your rights in a documented
            assessment. We also rely on <strong className="text-ink">contract</strong> for providing your account. Where
            a verdict concerns a public figure&rsquo;s public conduct, we process it in a journalistic/research context.
          </Section>
          <Section title="How long we keep it">
            We keep account data for the life of your account (and a short period after a deletion request), usage
            counters on a rolling basis, and cached results for a limited period. Verdicts published in the archive may
            be retained in the public interest, subject to the review and removal route below.
          </Section>
          <Section title="The public archive">
            Verdicts on public political media may be published in the{' '}
            <Link href="/cases" className="font-medium text-forest-700 underline">public archive</Link> in the public
            interest (journalism/research). If you believe a published case is wrong or harmful, contact us for review or
            removal &mdash; see our{' '}
            <Link href="/disclaimer" className="font-medium text-forest-700 underline">right of reply</Link> route.
          </Section>
          <Section title="Your rights">
            You have the right to access, rectification, erasure, restriction, objection, and portability of personal
            data we hold, and the right to complain to the Information Commissioner&rsquo;s Office (ICO). To exercise
            these rights, email <span className="text-ink">privacy@unfaked.ai</span>. We aim to respond within statutory
            timeframes.
          </Section>
          <Section title="Third parties and international transfers">
            To produce a verdict we send media to forensic providers (Hive, Sensity) and AI models (OpenAI). We send
            only what is needed for detection. We use Supabase (EU/London region) for storage and authentication, and
            Vercel for hosting. Some providers may process data outside the UK/EEA; where they do, we put appropriate
            safeguards (such as the UK International Data Transfer Agreement) in place.
          </Section>
          <Section title="Cookies">
            We use only strictly necessary cookies for sign-in and security. See our{' '}
            <Link href="/cookies" className="font-medium text-forest-700 underline">cookie policy</Link>.
          </Section>
          <Section title="Contact">
            Data matters: <span className="text-ink">privacy@unfaked.ai</span>. Corrections / right of reply:{' '}
            <span className="text-ink">corrections@unfaked.ai</span>. Legal:{' '}
            <span className="text-ink">legal@unfaked.ai</span>.
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
