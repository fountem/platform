// Netlify Scheduled Function: triggers the bot's polling route every 5 minutes.
// Netlify reads the `config.schedule` export to register the cron.
// Set BOT_SELF_URL (this site's URL) and CRON_SECRET in the Netlify env.

export const config = { schedule: '*/5 * * * *' }

export default async function poll(): Promise<Response> {
  const base = process.env.BOT_SELF_URL
  const secret = process.env.CRON_SECRET
  if (!base || !secret) {
    return new Response('Missing BOT_SELF_URL or CRON_SECRET', { status: 500 })
  }
  const res = await fetch(`${base.replace(/\/$/, '')}/api/cron`, {
    headers: { authorization: `Bearer ${secret}` },
  })
  return new Response(`cron -> ${res.status}`, { status: res.ok ? 200 : 502 })
}
