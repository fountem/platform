import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow } from '@fountem/ui'

export const metadata: Metadata = {
  title: 'How Unfaked Works — Methodology',
  description:
    'How Unfaked detects AI-generated and deepfake videos: provenance-first checks, a multi-signal forensic ensemble, calibrated confidence bands, and honest accuracy claims.',
}

export default function MethodologyPage() {
  return (
    <Container size="narrow">
      <article className="py-14">
        <Eyebrow>Methodology</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-forest-900">How Unfaked works</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-secondary">
          Provenance first. A multi-signal forensic ensemble second. Calibrated confidence, honest about uncertainty, with a
          human in the loop for the close calls — and a public archive that doesn&rsquo;t disappear.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          This page describes only what the system actually does today. If a capability isn&rsquo;t live, it isn&rsquo;t listed here.
        </p>

        <div className="mt-12 space-y-12">
          <Section title="Provenance first">
            Before any &ldquo;does this look fake?&rdquo; analysis, we ask &ldquo;what does the file say about its own origin?&rdquo; We check for a
            C2PA (Content Credentials) manifest — a cryptographic record of a file&rsquo;s origin and edit history — and for AI
            watermarks such as Google SynthID. A valid, intact C2PA manifest from a trusted source is treated as decisive and
            short-circuits the rest of the pipeline; an AI watermark does the same in the other direction. This is more robust
            than pixel forensics because it doesn&rsquo;t rely on detecting ever-improving generators.
          </Section>

          <Section title="The forensic ensemble (when provenance is absent)">
            <p className="mb-3">
              Most social media strips provenance, so we fall back to a weighted ensemble of four independent signal groups.
              Each signal is quantised to reduce meaningless noise, and we only count signals we actually have:
            </p>
            <ul className="space-y-2 pl-5 text-sm">
              <li className="list-disc"><strong className="text-ink">Forensic (50%):</strong> two independent vendors — Hive and Sensity — analyse pixel-level signals. We surface their <em>disagreement</em> rather than hiding it.</li>
              <li className="list-disc"><strong className="text-ink">Provenance (25%):</strong> presence/absence of content credentials and metadata.</li>
              <li className="list-disc"><strong className="text-ink">Contextual (15%):</strong> GPT-4o reasons over real platform metadata — account age, upload history, posting context.</li>
              <li className="list-disc"><strong className="text-ink">Temporal / cross-modal (10%):</strong> keyframe-interval regularity and audio↔lip-sync correlation, which catch voice-clone and splice edits frame models miss.</li>
            </ul>
            <p className="mt-3">
              When the input is low-resolution or heavily compressed — where forensic detectors are least reliable — we apply
              <strong className="text-ink"> degradation-aware weighting</strong>, automatically down-weighting forensics and leaning on provenance and context.
            </p>
          </Section>

          <Section title="Calibrated confidence, not false certainty">
            Every verdict ships a <strong className="text-ink">confidence band</strong>, not a single number. The band widens when the two
            forensic vendors disagree, when the media is degraded, or when only one vendor is available. Independent benchmarks
            (e.g. DeepFake-Eval-2024) put real-world detector accuracy on compressed social media at roughly 54–84% — so a bare
            &ldquo;98% accurate&rdquo; claim is a red flag. We&rsquo;d rather be honest and useful than confident and wrong.
          </Section>

          <Section title="Human in the loop">
            High-stakes or genuinely uncertain cases — vendor disagreement, an inconclusive verdict, or a confidence band that
            straddles the real/AI boundary — are automatically queued for human review. Reviewed cases are clearly labelled.
          </Section>

          <Section title="What we won't claim">
            <div className="space-y-3">
              <p><strong className="text-ink">We don&rsquo;t claim 100% accuracy.</strong> Any tool claiming near-perfect accuracy on diverse real-world content is overstating its capabilities.</p>
              <p><strong className="text-ink">We don&rsquo;t replace human judgement.</strong> Every verdict includes a &ldquo;what would change this verdict&rdquo; statement and an explicit not-definitive-proof disclaimer.</p>
              <p><strong className="text-ink">We don&rsquo;t process private videos or store source video.</strong> We analyse publicly accessible URLs and keep only the forensic signals and verdict, not the video itself.</p>
            </div>
          </Section>

          <Section title="The public archive">
            Every public case goes into the{' '}
            <Link href="/cases" className="font-medium text-forest-700 underline">UK Political Deepfake Archive</Link>
            {' '}— a timestamped, searchable record of AI-generated political media for journalists, researchers and regulators.
          </Section>
        </div>
      </article>
    </Container>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-serif text-2xl text-forest-900">{title}</h2>
      <div className="leading-relaxed text-ink-secondary">{children}</div>
    </section>
  )
}
