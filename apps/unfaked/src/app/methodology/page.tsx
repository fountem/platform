import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How Unfaked Works — Methodology',
  description: 'How Unfaked detects AI-generated and deepfake videos: forensic analysis, provenance checking, contextual intelligence, and honest accuracy claims.',
}

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-32">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">How Unfaked works</h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Three forensic layers. Honest accuracy claims. A public archive that doesn't disappear.
        </p>
      </div>

      <section className="space-y-10">
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Layer 1 — Forensic analysis</h2>
          <p className="text-zinc-400 leading-relaxed">
            We run every video through two independent forensic detection APIs: Hive Moderation and Sensity AI.
            Both analyse pixel-level signals — temporal inconsistency (frames that don't flow physically), texture artifacts
            from GAN generation, and generator fingerprints that identify probable source tools (Google Veo, Kling, Runway, Sora, Luma, Pika).
            Hive carries 55% of the detection weight. Sensity corroborates.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Layer 2 — Provenance checking</h2>
          <p className="text-zinc-400 leading-relaxed">
            We check every video for a C2PA (Coalition for Content Provenance and Authenticity) manifest — a
            cryptographic record of a file's origin and edit history. A valid C2PA manifest from a trusted camera
            manufacturer is a strong signal of authenticity. Absent or stripped metadata is a signal worth flagging.
            We also check for Google SynthID watermarks in Veo-generated content where detectable.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Layer 3 — Contextual intelligence</h2>
          <p className="text-zinc-400 leading-relaxed">
            Forensics alone can be fooled. We supplement with contextual signals: channel age and upload frequency,
            audio cleanliness (AI-generated video often pairs suspiciously clean audio), clip transition regularity,
            and behavioural plausibility of the depicted subject. This layer is corroborating evidence, not a primary signal.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-3">What we won't claim</h2>
          <div className="space-y-3 text-zinc-400">
            <p>
              <strong className="text-zinc-200">We don't claim 100% accuracy.</strong> Real-world deepfake detection
              on 2026-era generators achieves 78–84% accuracy on independent benchmarks (DeepFake-Eval-2024). Any tool
              claiming higher on diverse real-world content is overstating its capabilities.
            </p>
            <p>
              <strong className="text-zinc-200">We don't replace human judgement.</strong> Every verdict includes a
              "What would change this verdict" statement. Our job is to give you better information, not to make the decision for you.
            </p>
            <p>
              <strong className="text-zinc-200">We don't process private videos.</strong> We only analyse publicly accessible URLs.
              We don't store video content — only the forensic signals and verdict.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-3">The public archive</h2>
          <p className="text-zinc-400 leading-relaxed">
            Every case we process (when marked public) goes into the{' '}
            <a href="/cases" className="text-red-400 hover:text-red-300 underline">UK Political Deepfake Archive</a>
            — a timestamped, searchable public record of AI-generated political media. This archive doesn't exist anywhere
            else. The Electoral Commission said the UK needed it. We're building it.
          </p>
        </div>
      </section>
    </div>
  )
}
