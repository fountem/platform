import type { Verdict, VideoDetection, CorrectionPack } from '@fountem/db'
import { VERDICT_META, GENERATOR_LABELS, type VerdictCard } from './schema'

export function serialiseClaimVerdict(
  verdict: Verdict,
  claimText: string,
  pack: CorrectionPack,
  appUrl = 'https://fountem.ai'
): VerdictCard {
  const meta = VERDICT_META[verdict.verdict] ?? VERDICT_META.inconclusive

  return {
    id: verdict.id,
    type: 'claim',
    product: 'fountem',
    verdict: verdict.verdict,
    verdict_label: meta.label,
    verdict_colour: meta.colour,
    confidence_pct: verdict.confidence_pct,
    summary: verdict.summary,
    what_would_change_this: verdict.what_would_change_this,
    claim_text: claimText,
    source_citations: verdict.source_citations as any,
    correction_pack_url: `https://unfaked.ai/c/${pack.slug}`,
    og_image_url: pack.og_image_url ?? undefined,
    share_text: `${meta.emoji} "${claimText.substring(0, 80)}..." — Fountem verdict: ${meta.label} (${verdict.confidence_pct}% confidence)\n\nhttps://unfaked.ai/c/${pack.slug}`,
    attribution: 'Unfaked · powered by Fountem',
    methodology_url: 'https://fountem.ai/methodology',
    created_at: verdict.created_at,
  }
}

export function serialiseDetectionVerdict(
  detection: VideoDetection,
  pack: CorrectionPack
): VerdictCard {
  const meta = VERDICT_META[detection.verdict] ?? VERDICT_META.inconclusive
  const genLabel = detection.probable_generator
    ? GENERATOR_LABELS[detection.probable_generator]
    : undefined

  return {
    id: detection.id,
    type: 'detection',
    product: 'unfaked',
    verdict: detection.verdict,
    verdict_label: meta.label,
    verdict_colour: meta.colour,
    confidence_pct: detection.confidence_pct,
    summary: detection.reasoning ?? '',
    what_would_change_this: detection.what_would_change_this ?? '',
    video_url: detection.video_url ?? undefined,
    probable_generator: detection.probable_generator ?? undefined,
    probable_generator_label: genLabel,
    evasion_detected: detection.evasion_detected ?? undefined,
    correction_pack_url: `https://unfaked.ai/c/${pack.slug}`,
    og_image_url: pack.og_image_url ?? undefined,
    share_text: `${meta.emoji} This video appears to be ${meta.label.toLowerCase()}${genLabel ? ` (${genLabel})` : ''}.\n\nVerified by @unfaked · https://unfaked.ai/c/${pack.slug}`,
    attribution: 'Unfaked · powered by Fountem',
    methodology_url: 'https://fountem.ai/methodology',
    created_at: detection.created_at,
  }
}
