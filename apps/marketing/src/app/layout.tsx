import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fountem — AI Deepfake Detection for UK Democracy',
  description: '1 in 3 UK voters saw political deepfakes before the 2026 elections. Unfaked detects them. Fountem explains them.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
