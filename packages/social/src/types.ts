// Platform-agnostic contracts for the social bots (X today; Instagram/Facebook
// next). Each platform provides an adapter; the shared orchestrator in
// `process.ts` drives the same detect -> reply -> dedupe flow for all of them.

/** A normalised inbound mention/comment from any platform. */
export interface SocialMention {
  /** Platform-unique id. For X this is the tweet id (a monotonic numeric string). */
  id: string
  /** Free text we scan for a media URL to check. */
  text: string
  /** Original platform payload, in case an adapter needs more on reply. */
  raw?: unknown
}

/** The subset of the detection API's verdict card the bots render in a reply. */
export interface DetectionCard {
  share_text?: string
  verdict_label?: string
  confidence_pct?: number
  correction_pack_url?: string
}

/** Runs a detection for a media URL; returns null on failure (skip, don't reply). */
export type Detector = (mediaUrl: string) => Promise<DetectionCard | null>

/** Config for the HTTP detector that calls the Unfaked detection API. */
export interface DetectConfig {
  /** Base URL of the Unfaked app (the bot calls `${apiUrl}/api/detect`). */
  apiUrl: string
  /** B2B API key so calls use the monthly quota, not the public per-IP limit. */
  apiKey?: string
}

/** A per-platform integration: how to read mentions and how to reply. */
export interface PlatformAdapter {
  /** Stable id, also used as the idempotency cursor key (e.g. 'unfaked' for X). */
  readonly id: string
  /** Return mentions newer than `sinceId` (adapter decides pull vs webhook replay). */
  fetchMentions(sinceId?: string): Promise<SocialMention[]>
  /** Post a public reply to `mention`. */
  reply(mention: SocialMention, text: string): Promise<void>
}

/** Idempotency persistence: a cursor per platform + atomic per-mention claims. */
export interface IdempotencyStore {
  getCursor(key: string): Promise<string | undefined>
  setCursor(key: string, sinceId: string): Promise<void>
  /** Atomically claim a mention id. Returns true only for the caller that won it. */
  claim(mentionId: string): Promise<boolean>
  markReplied(mentionId: string): Promise<void>
}
