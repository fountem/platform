import type { Metadata } from 'next'
import { Container, Eyebrow, StatusChip } from '@fountem/ui'

export const metadata: Metadata = {
  title: 'How Fountem Works — Methodology',
  description:
    'How Fountem verifies political claims: atomic claim decomposition, retrieval over primary sources, sourced LLM verdicts, and honest limitations.',
}

export default function MethodologyPage() {
  return (
    <Container size="narrow">
      <article className="py-14">
        <Eyebrow>Methodology</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-forest-900">How Fountem works</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-secondary">
          We don&rsquo;t ask a chatbot for its opinion. We break a claim into checkable parts, retrieve primary-source evidence,
          and only then produce a verdict — one that always cites where it came from.
        </p>
        <p className="mt-2 text-sm text-ink-muted">This page describes only what the system actually does today.</p>

        <div className="mt-12 space-y-12">
          <Section title="1. Atomic claim decomposition">
            Political statements often bundle several assertions (&ldquo;X built more homes <em>and</em> cut taxes&rdquo;). We split a
            claim into independent, individually checkable sub-claims. Each is verified separately, then aggregated — so a single
            false component can&rsquo;t hide inside a broadly true sentence.
          </Section>

          <Section title="2. Retrieval over primary sources">
            For each sub-claim we run hybrid retrieval — semantic vector search plus keyword (BM25) search — over a curated corpus
            of primary sources: official statistics (ONS, government data), Hansard, manifestos and reputable reporting. We
            retrieve the most relevant passages rather than relying on a model&rsquo;s memory.
          </Section>

          <Section title="3. Grounded, sourced verdicts">
            <p className="mb-4">A language model is given <em>only</em> the retrieved evidence and asked to reach a verdict that cites it. Verdicts use a calibrated scale:</p>
            <div className="flex flex-wrap gap-2">
              <StatusChip verdict="true" label="True / Mostly true" />
              <StatusChip verdict="half_true" label="Half true" />
              <StatusChip verdict="misleading" label="Misleading / Mostly false" />
              <StatusChip verdict="false" label="False" />
              <StatusChip verdict="unverifiable" label="Unverifiable" />
            </div>
          </Section>

          <Section title="4. We'd rather say &ldquo;unverifiable&rdquo; than guess">
            If retrieval returns no adequate evidence, we return <strong className="text-ink">unverifiable</strong> instead of
            inventing an answer. Every verdict also ships a &ldquo;what would change this&rdquo; statement so you know exactly what new
            evidence would move it.
          </Section>

          <Section title="What we won't claim">
            <div className="space-y-3">
              <p><strong className="text-ink">We&rsquo;re only as good as our corpus.</strong> A verdict reflects the evidence we have indexed; gaps produce &ldquo;unverifiable&rdquo;, not confident error.</p>
              <p><strong className="text-ink">We don&rsquo;t replace human judgement.</strong> Verdicts are a sourced starting point for scrutiny, not the final word.</p>
              <p><strong className="text-ink">We show our working.</strong> Every claim links the exact sources and excerpts used so you can check us.</p>
            </div>
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
