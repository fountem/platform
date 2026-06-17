/**
 * Minimal, dependency-free error capture.
 *
 * Emits a structured JSON line (picked up by Netlify/CloudWatch log drains) and,
 * when SENTRY_DSN is configured, forwards to Sentry's store endpoint. Kept SDK-free
 * to avoid bundling weight in the serverless tier; swap for @sentry/nextjs if richer
 * tracing is needed later.
 */

export interface ErrorContext {
  route?: string
  [key: string]: unknown
}

export function captureException(error: unknown, context: ErrorContext = {}): void {
  const payload = {
    level: 'error',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
    at: new Date().toISOString(),
  }
  // Structured log — always.
  console.error(JSON.stringify(payload))

  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  void forwardToSentry(dsn, payload).catch(() => {
    /* best-effort: never let monitoring throw */
  })
}

async function forwardToSentry(dsn: string, payload: Record<string, unknown>): Promise<void> {
  // DSN form: https://<publicKey>@<host>/<projectId>
  const match = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/)
  if (!match) return
  const [, publicKey, host, projectId] = match
  const url = `https://${host}/api/${projectId}/store/`
  await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-sentry-auth': `Sentry sentry_version=7, sentry_key=${publicKey}`,
    },
    body: JSON.stringify({
      platform: 'node',
      level: payload.level,
      message: payload.message,
      extra: payload,
      timestamp: payload.at,
    }),
  })
}
