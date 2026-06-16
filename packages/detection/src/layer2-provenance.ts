import type { Layer2Signals } from '@fountem/db'

interface C2PAManifest {
  valid: boolean
  provenanceChain: string[]
  generator?: string
}

// c2pa-node is a native module — we dynamic import to avoid issues in test env
async function checkC2PAManifest(videoBuffer: Buffer): Promise<C2PAManifest> {
  try {
    const { ManifestStore } = await import('c2pa-node')
    const store = await ManifestStore.fromBuffer(videoBuffer, 'video/mp4')
    const activeManifest = store.activeManifest
    if (!activeManifest) return { valid: false, provenanceChain: [] }
    const ingredients = activeManifest.ingredients ?? []
    return {
      valid: true,
      provenanceChain: ingredients.map((i: any) => i.title ?? 'unknown'),
      generator: activeManifest.claimGenerator?.name,
    }
  } catch {
    return { valid: false, provenanceChain: [] }
  }
}

function detectMetadataStripped(videoBuffer: Buffer): boolean {
  // Check for common metadata containers in video header
  // MP4 moov atom without creation_time or missing ftyp box = likely stripped
  const header = videoBuffer.slice(0, 256)
  const headerStr = header.toString('hex')
  const hasFtyp = headerStr.includes('66747970')  // 'ftyp' in hex
  return !hasFtyp
}

function detectContainerFormat(videoBuffer: Buffer): string {
  const magic4 = videoBuffer.slice(4, 8).toString('ascii')
  if (magic4 === 'ftyp') return 'mp4'
  const magic2 = videoBuffer.slice(0, 2).toString('hex')
  if (magic2 === '1a45') return 'webm'
  if (videoBuffer.slice(0, 4).toString('hex') === '52494646') return 'avi'
  return 'unknown'
}

export async function runLayer2(videoBuffer: Buffer): Promise<Layer2Signals> {
  const [c2pa] = await Promise.all([
    checkC2PAManifest(videoBuffer),
  ])

  return {
    c2pa_manifest_present: c2pa.valid,
    c2pa_valid: c2pa.valid,
    c2pa_provenance_chain: c2pa.provenanceChain,
    synthid_detected: null,  // SynthID via Vertex AI — post-launch
    metadata_stripped: detectMetadataStripped(videoBuffer),
    container_format: detectContainerFormat(videoBuffer),
  }
}
