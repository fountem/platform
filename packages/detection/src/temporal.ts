/**
 * Temporal + cross-modal analysis.
 *
 * Frame models miss lip-sync and voice-clone fakes; temporal coherence catches
 * splice/speed/grain-overlay evasion. We derive these from the resolver's ffprobe
 * keyframe data and its cross-modal (lip-sync) model output (see Appendix A2).
 */

export interface TemporalSignals {
  clip_transition_intervals: number[] | null
  /** Coefficient of variation of keyframe intervals — high = irregular splicing. */
  interval_irregularity: number | null
  /** True when intervals are suspiciously uniform (automated batch generation). */
  uniform_intervals: boolean
}

export function analyseTemporal(keyframeIntervals: number[] | null): TemporalSignals {
  if (!keyframeIntervals || keyframeIntervals.length < 3) {
    return { clip_transition_intervals: keyframeIntervals, interval_irregularity: null, uniform_intervals: false }
  }
  const mean = keyframeIntervals.reduce((a, b) => a + b, 0) / keyframeIntervals.length
  if (mean === 0) {
    return { clip_transition_intervals: keyframeIntervals, interval_irregularity: 0, uniform_intervals: true }
  }
  const variance =
    keyframeIntervals.reduce((sum, x) => sum + (x - mean) ** 2, 0) / keyframeIntervals.length
  const cv = Math.sqrt(variance) / mean
  return {
    clip_transition_intervals: keyframeIntervals,
    interval_irregularity: Number(cv.toFixed(3)),
    // Near-zero variation across many keyframes is itself an anomaly signal.
    uniform_intervals: cv < 0.02,
  }
}
