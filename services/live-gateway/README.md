# Live Gateway

Long-lived service that powers Unfaked's **live fact-checking**. It pulls a live
stream's audio, runs streaming ASR, extracts check-worthy claims, and asks the
Unfaked app to verify each one. Deployed separately from Vercel (Vercel functions
can't hold WebSockets / long-running pulls), same pattern as `services/resolver`.

## Pipeline

```
client ──WS(token)──▶ gateway
                        │  yt-dlp (live URL) → ffmpeg → 16k mono PCM
                        │  → Deepgram Nova-3 (streaming ASR + diarization)
                        │  → batch finalised segments on utterance boundary
                        │  → GPT-4o-mini check-worthy claim extraction (+ guardrail)
                        │  → insert live_transcript_chunks / live_claims (Supabase)
                        └─ POST /api/live/verify-claim (Unfaked app)
                              → @fountem/rag evidence + Claude verdict
                              → update live_claims row
client ◀── Supabase Realtime (live_claims, live_transcript_chunks) ── updates
```

## Why verification is delegated to the app

The RAG/evidence/verdict logic lives in `@fountem/rag` + `@fountem/live`, which
are workspace packages. Rather than vendor that whole pipeline into this
standalone service, the gateway calls the app's internal `/api/live/verify-claim`
endpoint (shared `LIVE_INTERNAL_KEY`). One source of truth for verdicts.

## Endpoints

- `GET /health` — liveness probe.
- `WS /?token=<jwt>` — client opens to start/keep-alive a session. The token is
  minted by the Unfaked app after auth + quota; it carries the session id.

## Local dev

```bash
cp .env.example .env   # fill in keys
npm install
npm run dev
```

Requires `ffmpeg` and `yt-dlp` on PATH (the Docker image installs both).

## Legal / safety

- Per-session caps (minutes, total claims, per-minute backpressure) bound cost.
- Personal-character claims about named individuals are dropped (RPA s.106 /
  defamation). Election-period mode tightens this further.
- Live output is provisional and never auto-published. See
  `context/legal/defamation-liability-memo.md`.
