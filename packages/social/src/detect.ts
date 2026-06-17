import type { DetectConfig, DetectionCard, Detector } from './types'

/**
 * Builds a {@link Detector} that calls the Unfaked detection API. Uses the B2B
 * API key (if set) so calls draw on the monthly quota rather than the public
 * per-IP limit. Returns null on a non-OK response so the caller skips the reply.
 */
export function httpDetector(cfg: DetectConfig): Detector {
  return async (mediaUrl: string): Promise<DetectionCard | null> => {
    const res = await fetch(`${cfg.apiUrl}/api/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { 'x-api-key': cfg.apiKey } : {}),
      },
      body: JSON.stringify({ video_url: mediaUrl }),
    })
    if (!res.ok) return null
    return (await res.json()) as DetectionCard
  }
}
