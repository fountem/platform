import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fountem — Political Intelligence Platform',
  description: 'Evidence-backed political fact-checking for UK democracy.',
  openGraph: { type: 'website', url: 'https://fountem.ai', siteName: 'Fountem' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-white text-zinc-900 min-h-screen antialiased">
        <header className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">Fountem</a>
          <nav className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="/check" className="hover:text-zinc-900 transition-colors">Check a claim</a>
            <a href="/parties" className="hover:text-zinc-900 transition-colors">Parties</a>
            <a href="https://unfaked.ai" className="hover:text-zinc-900 transition-colors">Unfaked →</a>
            <a href="/methodology" className="hover:text-zinc-900 transition-colors">Methodology</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t border-zinc-200 px-6 py-6 mt-20 text-zinc-400 text-xs flex items-center justify-between">
          <span>Fountem · evidence-backed political intelligence</span>
          <div className="flex gap-4">
            <a href="/methodology">Methodology</a>
            <a href="/api-docs">API</a>
            <a href="https://unfaked.ai">Unfaked</a>
          </div>
        </footer>
      </body>
    </html>
  )
}
