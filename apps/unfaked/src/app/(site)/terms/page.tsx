import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow } from '@fountem/ui'

export const metadata: Metadata = {
  title: 'Terms of Service — Unfaked',
  description: 'The terms on which you may use Unfaked, the free deepfake detection tool by Fountem.',
}

export default function TermsPage() {
  return (
    <Container size="narrow">
      <article className="py-14">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl text-forest-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Last updated: June 2026. These terms will be reviewed by counsel before launch. They govern your use of
          Unfaked. Please also read our{' '}
          <Link href="/disclaimer" className="font-medium text-forest-700 underline">disclaimer</Link>,{' '}
          <Link href="/acceptable-use" className="font-medium text-forest-700 underline">acceptable use policy</Link> and{' '}
          <Link href="/privacy" className="font-medium text-forest-700 underline">privacy policy</Link>.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed text-ink-secondary">
          <Section title="1. Who we are">
            Unfaked is operated by <strong className="text-ink">Fountem Ltd</strong>, a company registered in England
            &amp; Wales (company number [number], registered office [address]). &ldquo;We&rdquo;, &ldquo;us&rdquo; and
            &ldquo;our&rdquo; mean Fountem Ltd. By using Unfaked you agree to these terms. If you do not agree, do not use
            the service.
          </Section>
          <Section title="2. What Unfaked does">
            You submit a public URL to a video or image. We analyse technical and contextual signals and return an{' '}
            <strong className="text-ink">assessment</strong> of whether the media is likely AI-generated or manipulated,
            with a confidence band and an explanation. Unfaked is a free tool provided in the public interest.
          </Section>
          <Section title="3. Assessments are not definitive proof">
            Every verdict is an <strong className="text-ink">evidence-based assessment, not definitive proof</strong>.
            Automated detection can be wrong, especially on compressed or low-resolution media. You must not treat a
            verdict as conclusive, and you must not rely on it as the sole basis for any decision, publication or
            allegation about any person. See our{' '}
            <Link href="/disclaimer" className="font-medium text-forest-700 underline">disclaimer</Link> and{' '}
            <Link href="/methodology" className="font-medium text-forest-700 underline">methodology</Link>.
          </Section>
          <Section title="4. Your account and fair use">
            Some features require an account. You are responsible for activity under your account and for keeping your
            login secure. We apply daily usage limits and anti-abuse controls to keep the free tier sustainable. You
            must follow our{' '}
            <Link href="/acceptable-use" className="font-medium text-forest-700 underline">acceptable use policy</Link>.
          </Section>
          <Section title="5. The public archive">
            We may publish assessments of public political media in our{' '}
            <Link href="/cases" className="font-medium text-forest-700 underline">public archive</Link> in the public
            interest (journalism and research). If you believe a published case is wrong or harmful, you can ask us to
            review or remove it &mdash; see our{' '}
            <Link href="/disclaimer" className="font-medium text-forest-700 underline">right of reply</Link> route and email{' '}
            <span className="text-ink">corrections@unfaked.ai</span>.
          </Section>
          <Section title="6. Intellectual property">
            The Unfaked name, brand, software and the structure of our verdict cards belong to Fountem Ltd. We do not
            store or republish the source media you submit. You keep your rights in anything you submit, and you grant us
            a licence to process it to produce and (where in the public interest) publish an assessment.
          </Section>
          <Section title="7. B2B / API use">
            Programmatic and commercial use is governed by a separate written agreement and API terms. Nothing here
            grants a right to commercial or bulk use of the service without one.
          </Section>
          <Section title="8. Liability">
            We provide Unfaked &ldquo;as is&rdquo; and, to the fullest extent permitted by law, exclude implied
            warranties including as to accuracy or fitness for a particular purpose. We are not liable for indirect or
            consequential loss, or loss arising from your reliance on a verdict. For the free service, our total
            liability to you is limited to <strong className="text-ink">£100</strong>; liability for paid or API use is
            set out in your separate API agreement. Nothing in these terms excludes or limits liability that cannot
            lawfully be excluded &mdash; including for death or personal injury caused by negligence, or for fraud. Your
            statutory rights as a consumer are unaffected.
          </Section>
          <Section title="9. Changes to these terms">
            We may update these terms. We will give you reasonable notice of material changes (by email to account
            holders or a prominent notice on the site). If you do not agree to a change, you may stop using the service
            and close your account before it takes effect.
          </Section>
          <Section title="10. Suspension and termination">
            You may stop using the service and close your account at any time. We may change, suspend or withdraw the
            service, and may suspend or terminate accounts that breach these terms or the acceptable use policy &mdash;
            where practicable, with notice and an opportunity to put things right, though we may act immediately for
            serious or unlawful breaches.
          </Section>
          <Section title="11. General">
            If any term is found unenforceable, the rest continues in force. These terms are the entire agreement between
            us about the service. No one other than you and us has any rights under them (we exclude the Contracts
            (Rights of Third Parties) Act 1999). You may not transfer your rights without our consent; we may transfer
            ours (for example on a reorganisation or sale) without reducing your rights. We are not liable for failures
            caused by events beyond our reasonable control. We will contact you using your account email.
          </Section>
          <Section title="12. Complaints">
            To raise a problem or challenge a verdict, email <span className="text-ink">corrections@unfaked.ai</span>. For
            data-protection matters you may also contact the Information Commissioner&rsquo;s Office (ICO). See our{' '}
            <Link href="/disclaimer" className="font-medium text-forest-700 underline">right of reply</Link> route.
          </Section>
          <Section title="13. Governing law">
            These terms are governed by the laws of England &amp; Wales, and the courts of England &amp; Wales have
            exclusive jurisdiction. Contact: <span className="text-ink">legal@unfaked.ai</span>.
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
