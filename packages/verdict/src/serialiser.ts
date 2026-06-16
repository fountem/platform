import type { VideoDetection, CorrectionPack, Verdict } from '@fountem/db'
import { VERDICT_META, GENERATOR_LABELS, confidenceLabel } from './schema'

export interface VerdictCard {
  id: string
  type: 'detection' | 'claim_check'
  verdict: string
  verdict_label: string
  verdict_colour: string
  confidence_pct: number
  confidence_label: string
  summary: string
  reasoning: string
  what_would_change_this: string | null
  probable_generator: string | null
  probable_generator_label: string | null
  evasion_detected: string | null
  evasion_description: string | null
  layer_breakdown: LayerBreakdown | null
  source_citations: any[]
  correction_pack_url: string | null
  correction_pack_slug: string | null
  share_text: string
  created_at: string
}

export interface LayerBreakdown {
  layer1: { label: string; score: number | null; signals: string[] }
  layer2: { label: string; provenance: boolean; synthid: boolean | null; metadata_stripped: boolean }
  layer3: { label: string; red_flags: string[]; behavioural_score: number | null }
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://unfaked.ai'

export function serialiseDetectionVerdict(
  detection: VideoDetection,
  pack: CorrectionPack | null
): VerdictCard {
  const meta = VERDICT_META[detection.verdict] ?? VERDICT_META.inconclusive
  const genLabel = detection.probable_generator ? GENERATOR_LABELS[detection.probable_generator] ?? detection.probable_generator : null

  const l1 = detection.layer1_signals
  const l2 = detection.layer2_signals
  const l3 = detection.layer3_signals

  const layerBreakdown: LayerBreakdown | null = (l1 || l2 || l3) ? {
    layer1: {
      label: 'Forensic Analysis',
      score: l1 ? Math.round(Math.max(l1.hive_ai_generated_score, l1.hive_deepfake_score) * 100) : null,
      signals: [
        l1?.temporal_inconsistency ? 'Temporal inconsistency detected' : '',
        l1?.physics_anomaly ? 'Physics anomaly detected' : '',
        l1?.texture_artifacts ? 'Texture artifacts present' : '',
        l1?.generator_fingerprint ? `Generator fingerprint: ${GENERATOR_LABELS[l1.generator_fingerprint] ?? l1.generator_fingerprint}` : '',
      ].filter(Boolean),
    },
    layer2: {
      label: 'Provenance Check',
      provenance: l2?.c2pa_manifest_present ?? false,
      synthid: l2?.synthid_detected ?? null,
      metadata_stripped: l2?.metadata_stripped ?? false,
    },
    layer3: {
      label: 'Contextual Intelligence',
      red_flags: l3?.contextual_red_flags ?? [],
      behavioural_score: l3?.behavioural_plausibility_score ?? null,
    },
  } : null

  const shareText = [
    `${meta.sharePrefix}: ${detection.case_title ?? 'Unnamed video'}`,
    genLabel ? `Probable generator: ${genLabel}` : null,
    `Confidence: ${detection.confidence_pct}%`,
    pack ? `Full analysis: ${BASE_URL}/check/${pack.slug}` : null,
  ].filter(Boolean).join('\n')

  return {
    id: detection.id,
    type: 'detection',
    verdict: detection.verdict,
    verdict_label: meta.label,
    verdict_colour: meta.colour,
    confidence_pct: detection.confidence_pct,
    confidence_label: confidenceLabel(detection.confidence_pct),
    summary: detection.reasoning ?? '',
    reasoning: detection.reasoning ?? '',
    what_would_change_this: detection.what_would_change_this,
    probable_generator: detection.probable_generator,
    probable_generator_label: genLabel,
    evasion_detected: detection.evasion_detected,
    evasion_description: detection.evasion_description,
    layer_breakdown: layerBreakdown,
    source_citations: [],
    correction_pack_url: pack ? `${BASE_URL}/check/${pack.slug}` : null,
    correction_pack_slug: pack?.slug ?? null,
    share_text: shareText,
    created_at: detection.created_at,
  }
}

export function serialiseClaimVerdict(
  verdict: Verdict,
  claimText: string,
  pack: CorrectionPack | null
): VerdictCard {
  const meta = VERDICT_META[verdict.verdict] ?? VERDICT_META.inconclusive
  const FOUNTEM_URL = process.env.NEXT_PUBLIC_FOUNTEM_URL ?? 'https://fountem.ai'

  const shareText = [
    `${meta.sharePrefix}: "${claimText.slice(0, 100)}${claimText.length > 100 ? '…' : ''}"`,
    `Confidence: ${verdict.confidence_pct}%`,
    pack ? `Full evidence trail: ${FOUNTEM_URL}/pack/${pack.slug}` : null,
    'Verified by Fountem · powered by primary source evidence',
  ].filter(Boolean).join('\n')

  return {
    id: verdict.id,
    type: 'claim_check',
    verdict: verdict.verdict,
    verdict_label: meta.label,
    verdict_colour: meta.colour,
    confidence_pct: verdict.confidence_pct,
    confidence_label: confidenceLabel(verdict.confidence_pct),
    summary: verdict.summary,
    reasoning: verdict.reasoning,
    what_would_change_this: verdict.what_would_change_this,
    probable_generator: null,
    probable_generator_label: null,
    evasion_detected: null,
    evasion_description: null,
    layer_breakdown: null,
    source_citations: verdict.source_citations ?? [],
    correction_pack_url: pack ? `${FOUNTEM_URL}/pack/${pack.slug}` : null,
    correction_pack_slug: pack?.slug ?? null,
    share_text: shareText,
    created_at: verdict.created_at,
  }
}
