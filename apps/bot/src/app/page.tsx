export default function BotHealth() {
  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', background: '#0a0a0a', color: '#fafafa', minHeight: '100vh' }}>
      <h1>@unfaked bot</h1>
      <p>Status: running</p>
      <p>Cron: every 5 minutes</p>
      <p>Endpoint: /api/cron</p>
    </div>
  )
}
