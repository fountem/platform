import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Eyebrow } from '@fountem/ui'

export const metadata: Metadata = {
  title: 'Cookies — Unfaked',
  description: 'The cookies and local storage Unfaked uses, and why.',
}

export default function CookiesPage() {
  return (
    <Container size="narrow">
      <article className="py-14">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-3 font-serif text-4xl text-forest-900">Cookie policy</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Last updated: June 2026. This explains the cookies and similar technologies Unfaked uses. See also our{' '}
          <Link href="/privacy" className="font-medium text-forest-700 underline">privacy policy</Link>.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed text-ink-secondary">
          <Section title="What we use">
            We keep cookies to a minimum. We use <strong className="text-ink">strictly necessary</strong> cookies and
            local storage to sign you in and keep your session secure (via our authentication provider, Supabase). These
            are required for the service to work and do not need consent under UK PECR.
          </Section>
          <Section title="Non-essential cookies">
            We do not currently set advertising cookies. If we add optional analytics in future, we will ask for your{' '}
            <strong className="text-ink">consent</strong> through a banner before setting any non-essential cookie, and
            update this page with the details.
          </Section>
          <Section title="Managing cookies">
            You can block or delete cookies in your browser settings, but blocking strictly necessary cookies will stop
            you from signing in. Questions: <span className="text-ink">privacy@unfaked.ai</span>.
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
