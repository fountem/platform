import { layer1Forensic } from './layer1-forensic'
import { layer2Provenance } from './layer2-provenance'
import { layer3Contextual } from './layer3-contextual'
import { synthesiseVerdict, type DetectionVerdictOutput } from './synthesiser'

export async function runDetectionPipeline(
  videoBuffer: Buffer,
  videoUrl: string
): Promise<DetectionVerdictOutput> {
  const hiveApiKey = process.env.HIVE_API_KEY!
  const sensityApiKey = process.env.SENSITY_API_KEY ?? ''

  // Layers 1 and 2 run in parallel
  const [l1, l2] = await Promise.all([
    layer1Forensic(videoBuffer, hiveApiKey),
    layer2Provenance(videoBuffer, sensityApiKey),
  ])

  // Layer 3 needs layer 1 and 2 results
  const l3 = await layer3Contextual(videoUrl, l1, l2)

  return synthesiseVerdict(l1, l2, l3)
}
