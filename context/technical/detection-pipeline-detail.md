# Detection Pipeline — Technical Detail (packages/detection/)

## Layer 1 — Forensic (layer1-forensic.ts)

```typescript
async function layer1Forensic(videoBuffer: Buffer): Promise<Layer1Result> {
  const [hiveResult, ffprobeResult] = await Promise.all([
    callHiveAPI(videoBuffer),         // AI generation score + deepfake score
    extractFFprobeMetadata(videoBuffer) // Container metadata, codec fingerprints
  ]);
  return {
    hive_ai_generated_score: hiveResult.ai_generated,
    hive_deepfake_score: hiveResult.deepfake,
    codec_anomalies: detectCodecAnomalies(ffprobeResult),
    metadata_stripped: isMetadataStripped(ffprobeResult),
    probable_generator: identifyGenerator(hiveResult, ffprobeResult)
  };
}
```

Generator fingerprinting signs:
- Veo: libveo encoder, native audio sync, hyperrealistic physics
- Kling: fluid long-form motion, slightly stylised palette
- Sora: unusually stable bitrate, painterly cinematic
- Runway: 4K + controlled camera + edge artefacts

## Layer 2 — Provenance (layer2-provenance.ts)
- c2pa-node: checks cryptographic manifest. Valid AI assertion = near-definitive.
- Sensity AI: forensic ensemble analysis (pending API key)
- SynthID: Google Veo invisible watermark — deferred (Vertex AI preview)

## Layer 3 — Contextual (layer3-contextual.ts)
GPT-4o contextual reasoning over: channel posting frequency, narration style, audio cleanliness, clip transition intervals (10-30s = AI model output limit tell), behavioural plausibility.

## Verdict Synthesis (synthesiser.ts)
Weighted score:
- Layer 1 (forensic): 50% weight
- Layer 2 (provenance): 20% weight
- Layer 3 (contextual): 30% weight

Thresholds: ≥85% → ai_generated, ≥65% → likely_ai_generated, ≥40% → inconclusive, ≥20% → likely_real, <20% → real

Evasion detection: flags re-encoding, grain overlay, speed manipulation, multi-generator mixing.

## Confidence Thresholds
**≥85%** required for definitive "AI Generated" verdict. Below that → "Likely AI Generated" or "Inconclusive".
This is intentional — a false positive (flagging genuine video as AI) is more damaging than a missed detection.

## Test Case: Wakefield Deepfake
Expected output:
- Verdict: AI-Generated (91% confidence)
- Probable generator: Unknown (face-swap tool, not generative video model)
- Evasion: Suspected (re-encoding via social media stripped metadata)
- Layer 1: Hive deepfake 0.89, Sensity AI-generated 0.87, compositing detected
- Layer 2: No C2PA credentials, metadata stripped
- Layer 3: Single viral post, no channel pattern, no AI disclaimer
