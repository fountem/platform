'use client'

import { useState } from 'react'
import { buttonClasses } from '@fountem/ui'

export function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button type="button" onClick={copy} className={buttonClasses('secondary', 'dark', 'flex-1')}>
      {copied ? 'Copied' : 'Copy share text'}
    </button>
  )
}
