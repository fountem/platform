import Link from 'next/link'
import { ButtonLink, Container, ShieldMark } from '@fountem/ui'
import { getUser } from '../../lib/supabase/server'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-forest-100 bg-parchment/85 backdrop-blur">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <ShieldMark className="h-6 w-6 text-forest-800" />
              <span className="font-serif text-xl text-forest-900">Unfaked</span>
              <span className="hidden text-[11px] uppercase tracking-[0.18em] text-ink-muted sm:block">by Fountem</span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link href="/verify" className="hidden text-sm text-ink-secondary transition-colors hover:text-forest-800 sm:block">Check a claim</Link>
              <Link href="/live" className="hidden text-sm text-ink-secondary transition-colors hover:text-forest-800 sm:block">Live</Link>
              <Link href="/cases" className="hidden text-sm text-ink-secondary transition-colors hover:text-forest-800 sm:block">Archive</Link>
              <Link href="/methodology" className="hidden text-sm text-ink-secondary transition-colors hover:text-forest-800 sm:block">How it works</Link>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden max-w-[14ch] truncate text-sm text-ink-secondary md:block">{user.email}</span>
                  <form action="/auth/signout" method="post">
                    <button type="submit" className="text-sm text-ink-secondary transition-colors hover:text-forest-800">Sign out</button>
                  </form>
                </div>
              ) : (
                <ButtonLink href="/login" variant="primary" className="px-4 py-2">Log in</ButtonLink>
              )}
            </nav>
          </div>
        </Container>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 bg-forest-900 text-forest-100">
        <Container>
          <div className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 text-parchment">
                <ShieldMark className="h-5 w-5 text-emerald-300" />
                <span className="font-serif text-lg">Unfaked</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-forest-100/80">
                An independent UK initiative working to strengthen information integrity in public life. Transparency by design.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-forest-100/50">Product</div>
                <Link href="/" className="block text-forest-100/80 hover:text-parchment">Detect a video</Link>
                <Link href="/verify" className="block text-forest-100/80 hover:text-parchment">Check a claim</Link>
                <Link href="/live" className="block text-forest-100/80 hover:text-parchment">Live fact-check</Link>
                <Link href="/cases" className="block text-forest-100/80 hover:text-parchment">Archive</Link>
                <Link href="/methodology" className="block text-forest-100/80 hover:text-parchment">Methodology</Link>
                <a href="https://fountem.ai" className="block text-forest-100/80 hover:text-parchment">Fountem</a>
                <a href="mailto:press@unfaked.ai" className="block text-forest-100/80 hover:text-parchment">Press</a>
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-forest-100/50">Legal</div>
                <Link href="/privacy" className="block text-forest-100/80 hover:text-parchment">Privacy</Link>
                <Link href="/terms" className="block text-forest-100/80 hover:text-parchment">Terms</Link>
                <Link href="/acceptable-use" className="block text-forest-100/80 hover:text-parchment">Acceptable use</Link>
                <Link href="/cookies" className="block text-forest-100/80 hover:text-parchment">Cookies</Link>
                <Link href="/disclaimer" className="block text-forest-100/80 hover:text-parchment">Disclaimer</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-forest-100/10 py-6 text-xs text-forest-100/60">
            © {new Date().getFullYear()} Fountem Ltd · Proudly non-partisan · Built in the UK for the public good
          </div>
        </Container>
      </footer>
    </div>
  )
}
