import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unfaked — AI Video Detection',
  description: 'Detect AI-generated political videos. Powered by Fountem.',
  openGraph: {
    type: 'website',
    url: 'https://unfaked.ai',
    siteName: 'Unfaked',
  },
  twitter: { card: 'summary_large_image', site: '@unfaked' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased">
        <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">un</span>
              <span className="text-red-500">faked</span>
            </span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="/cases" className="hover:text-white transition-colors">Archive</a>
            <a href="https://fountem.ai" className="hover:text-white transition-colors">Fountem</a>
            <a href="https://fountem.ai/methodology" className="hover:text-white transition-colors">Methodology</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t border-zinc-800 px-6 py-6 mt-20 text-zinc-500 text-xs flex items-center justify-between">
          <span>Unfaked · powered by Fountem</span>
          <div className="flex gap-4">
            <a href="https://fountem.ai/methodology" className="hover:text-zinc-300">Methodology</a>
            <a href="https://fountem.ai/api" className="hover:text-zinc-300">API</a>
            <a href="https://twitter.com/unfaked" className="hover:text-zinc-300">@unfaked</a>
          </div>
        </footer>
      </body>
    </html>
  )
}
