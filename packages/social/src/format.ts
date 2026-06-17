import type { DetectionCard } from './types'

/** Extracts the first http(s) URL from free text, or null if none. */
export function extractMediaUrl(text: string): string | null {
  const match = (text ?? '').match(/https?:\/\/[^\s]+/)
  return match?.[0] ?? null
}

/** Renders a verdict card into a short public reply (kept platform-agnostic). */
export function formatReply(card: DetectionCard): string {
  return `${card.share_text}\n\nVerdict: ${card.verdict_label} (${card.confidence_pct}% confidence)\n${card.correction_pack_url}`
}
