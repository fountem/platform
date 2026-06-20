export const config = {
  port: Number(process.env.PORT ?? 8090),
  /** Same secret the Unfaked app uses to mint live session tokens. */
  signingKey: process.env.LIVE_SESSION_SIGNING_KEY ?? '',
  /** Supabase (service role) for writing transcript + claim rows. */
  supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  /** Deepgram streaming ASR. */
  deepgramKey: process.env.DEEPGRAM_API_KEY ?? '',
  /** OpenAI for check-worthy claim extraction. */
  openaiKey: process.env.OPENAI_API_KEY ?? '',
  /** Unfaked app base URL + shared key for the internal verify endpoint. */
  appBaseUrl: process.env.UNFAKED_APP_URL ?? '',
  internalKey: process.env.LIVE_INTERNAL_KEY ?? '',
  /** Per-session safety caps. */
  maxMinutes: Number(process.env.LIVE_MAX_SESSION_MINUTES ?? 90),
  maxClaims: Number(process.env.LIVE_MAX_SESSION_CLAIMS ?? 200),
  maxClaimsPerMinute: Number(process.env.LIVE_MAX_CLAIMS_PER_MINUTE ?? 12),
  /** Election-period guardrail (drop named-character claims more aggressively). */
  electionMode: process.env.LIVE_ELECTION_MODE === '1',
  mock: process.env.MOCK_SERVICES === '1',
}

export function assertConfigured(): void {
  const missing: string[] = []
  if (!config.signingKey) missing.push('LIVE_SESSION_SIGNING_KEY')
  if (!config.supabaseUrl) missing.push('SUPABASE_URL')
  if (!config.supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!config.deepgramKey) missing.push('DEEPGRAM_API_KEY')
  if (!config.openaiKey) missing.push('OPENAI_API_KEY')
  if (!config.appBaseUrl) missing.push('UNFAKED_APP_URL')
  if (!config.internalKey) missing.push('LIVE_INTERNAL_KEY')
  if (missing.length) {
    throw new Error(`live-gateway missing required env: ${missing.join(', ')}`)
  }
}
