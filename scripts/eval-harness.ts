/**
 * Eval harness — runs known claims through the live RAG pipeline and grades them.
 * Run: npx ts-node scripts/eval-harness.ts
 * Output: eval-results/YYYY-MM-DD.json
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY
 */

import * as fs from 'fs'
import { createServiceClient } from '../packages/db/src/index'
import { hybridRetrieve } from '../packages/rag/src/retriever'
import { generateVerdict } from '../packages/rag/src/verdict-engine'
import { classifyResult, computeScore, type EvalOutcome } from '../packages/rag/src/eval'

interface EvalCase {
  id: string
  claim: string
  correct_verdict: string
  rationale: string
}

const EVAL_CASES: EvalCase[] = [
  { id: 'eval_001', claim: 'NHS waiting lists have fallen by 200,000 since January 2024', correct_verdict: 'mostly_false', rationale: 'IFS data shows a reduction of ~156,000, not 200,000' },
  { id: 'eval_002', claim: 'UK CPI inflation is now below the Bank of England 2% target', correct_verdict: 'mostly_true', rationale: 'CPI was 2.2% in August 2024 — close but not below' },
  { id: 'eval_003', claim: 'The government is building 300,000 homes a year', correct_verdict: 'false', rationale: 'ONS shows 123,000 starts in year to Sept 2024' },
  { id: 'eval_004', claim: 'Net migration has been reduced by over 200,000', correct_verdict: 'true', rationale: 'NAO data shows a fall from 685k to 446k' },
  { id: 'eval_005', claim: 'Real wages are now higher than before the 2008 financial crisis', correct_verdict: 'false', rationale: 'IFS shows real wages ~3% below the 2008 peak' },
  { id: 'eval_006', claim: 'Average private rents in England rose by more than 8% in the year to June 2024', correct_verdict: 'true', rationale: 'Resolution Foundation: 8.6% rise' },
  { id: 'eval_007', claim: 'Average band D council tax in England is now over £2,000 a year', correct_verdict: 'true', rationale: 'IFS: £2,171 in 2024-25' },
  { id: 'eval_008', claim: 'Rail passenger journeys have fully recovered to pre-pandemic levels', correct_verdict: 'mostly_false', rationale: 'ONS: ~96% of 2019 levels, not full recovery' },
  { id: 'eval_009', claim: 'Adult social care spending in England exceeds £20 billion a year', correct_verdict: 'true', rationale: 'NAO: £23.7bn in 2023-24' },
  { id: 'eval_010', claim: 'Transport is the largest emitting sector of the UK economy', correct_verdict: 'true', rationale: 'ONS: ~28% of territorial emissions' },
]

async function buildSourceMetadata(db: ReturnType<typeof createServiceClient>, sourceIds: string[]) {
  const { data } = await db
    .from('evidence_sources')
    .select('id, title, url, publisher, published_at')
    .in('id', sourceIds)
  const meta: Record<string, { title: string; url: string; publisher: string; published_at: string }> = {}
  ;(data ?? []).forEach((s) => {
    meta[s.id] = { title: s.title, url: s.url, publisher: s.publisher, published_at: s.published_at }
  })
  return meta
}

async function main() {
  const db = createServiceClient()
  const outcomes: EvalOutcome[] = []
  const results: unknown[] = []

  for (const c of EVAL_CASES) {
    try {
      const chunks = await hybridRetrieve({ query: c.claim, limit: 8, dbClient: db })
      const meta = await buildSourceMetadata(db, [...new Set(chunks.map((ch) => ch.source_id))])
      const verdict = await generateVerdict(c.claim, chunks, meta)
      const outcome = classifyResult(c.correct_verdict, verdict.verdict)
      outcomes.push(outcome)
      results.push({ id: c.id, claim: c.claim, expected: c.correct_verdict, actual: verdict.verdict, confidence: verdict.confidence_pct, outcome })
      console.log(`${outcome === 'exact' ? '✓' : outcome === 'adjacent' ? '~' : '✗'} ${c.id}: expected ${c.correct_verdict}, got ${verdict.verdict}`)
    } catch (err) {
      outcomes.push('wrong')
      results.push({ id: c.id, error: String(err) })
      console.error(`✗ ${c.id}:`, err)
    }
  }

  const summary = computeScore(outcomes)
  console.log(`\nResults: ${summary.exact} exact, ${summary.adjacent} adjacent, ${summary.wrong} wrong — Accuracy: ${summary.accuracy}%`)

  fs.mkdirSync('eval-results', { recursive: true })
  fs.writeFileSync(
    `eval-results/${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify({ summary, results, ran_at: new Date().toISOString() }, null, 2)
  )

  // Launch gate: weighted accuracy must be >= 80% (8/10 equivalent).
  if (summary.accuracy < 80) {
    console.error(`\nEval accuracy ${summary.accuracy}% is below the 80% launch gate.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
