import type { Layer2Signals } from '@fountem/db'
import type { ResolvedMedia } from './resolver'

/**
 * Layer 2 — Provenance.
 *
 * Provenance is our *primary* trust signal (see Appendix A1 of the implementation
 * plan): it answers "what does this file say about its own origin?" rather than the
 * harder, adversarial "does this look fake?".
 *
 * The heavy C2PA manifest extraction and watermark detection run in the AWS resolver
 * service (native libs). Here we normalise the resolver's output into Layer2Signals
 * and apply lightweight, dependency-free container sniffing as a fallback when only
 * a raw buffer is available (e.g. a direct MP4 upload that bypassed the resolver).
 */

function detectContainerFormat(videoBuffer: Buffer): string {
  if (videoBuffer.length < 12) return 'unknown'
  const magic4 = videoBuffer.subarray(4, 8).toString('ascii')
  if (magic4 === 'ftyp') return 'mp4'
  const magic2 = videoBuffer.subarray(0, 2).toString('hex')
  if (magic2 === '1a45') return 'webm'
  if (videoBuffer.subarray(0, 4).toString('hex') === '52494646') return 'avi'
  return 'unknown'
}

function detectMetadataStripped(videoBuffer: Buffer): boolean {
  // Missing ftyp box on an MP4-like container suggests re-muxing/stripping.
  const header = videoBuffer.subarray(0, 256).toString('hex')
  return !header.includes('66747970') // 'ftyp'
}

/** Derive Layer 2 signals from the resolver's structured provenance output. */
export function runLayer2FromResolved(media: ResolvedMedia): Layer2Signals {
  const { c2pa, watermark, ffprobe } = media
  return {
    c2pa_manifest_present: c2pa.manifest_present,
    c2pa_valid: c2pa.valid,
    c2pa_provenance_chain: c2pa.provenance_chain ?? [],
    c2pa_signature_issuer: c2pa.signature_issuer ?? null,
    synthid_detected: watermark.synthid_detected,
    watermark_other: watermark.other_watermark ?? null,
    metadata_stripped: ffprobe.creation_time === null,
    container_format: ffprobe.container_format,
    reverse_image_first_seen: null,
  }
}

/** Fallback Layer 2 when only a raw buffer is available (no resolver metadata). */
export function runLayer2FromBuffer(videoBuffer: Buffer): Layer2Signals {
  return {
    c2pa_manifest_present: false,
    c2pa_valid: false,
    c2pa_provenance_chain: [],
    c2pa_signature_issuer: null,
    synthid_detected: null,
    watermark_other: null,
    metadata_stripped: detectMetadataStripped(videoBuffer),
    container_format: detectContainerFormat(videoBuffer),
    reverse_image_first_seen: null,
  }
}
