/**
 * Eval harness — 50 claims with known verdicts.
 * Run: npx ts-node scripts/eval-harness.ts
 * Output: eval-results/YYYY-MM-DD.json
 */

import { hybridRetrieve, generateVerdict } from '../packages/rag/src/index'
import * as fs from 'fs'

interface EvalCase {
  id: string
  claim: string
  speaker?: string
  correct_verdict: string
  rationale: string
  source: string
}

// Starter eval set — expand to 50 before launch
const EVAL_CASES: EvalCase[] = [
  {
    id: 'eval_001',
    claim: 'NHS waiting lists have fallen by 200,000 since January 2024',
    speaker: 'Government minister',
    correct_verdict: 'mostly_false',
    rationale: 'IFS data shows reduction of ~156,000, not 200,000',
    source: 'IFS NHS Waiting Lists Analysis 2024',
  },
  {
    id: 'eval_002',
    claim: 'UK CPI inflation is now below the Bank of England 2% target',
    correct_verdict: 'mostly_true',
    rationale: 'CPI was 2.2% in August 2024 — close but not below',
    source: 'ONS CPI release August 2024',
  },
  {
    id: 'eval_003',
    claim: 'The government is building 300,000 homes a year',
    correct_verdict: 'false',
    rationale: 'ONS shows 123,000 starts in year to Sept 2024 — less than half the target',
    source: 'ONS House Building 2024',
  },
  {
    id: 'eval_004',
    claim: 'Net migration has been reduced by over 200,000',
    correct_verdict: 'true',
    rationale: 'NAO data shows reduction from 685K to 446K — a fall of 239,000',
    source: 'NAO Immigration Enforcement 2024',
  },
  {
    id: 'eval_005',
    claim: 'Real wages are now higher than before the financial crisis',
    correct_verdict: 'false',
    rationale: 'IFS shows real wages ~3% below 2008 peak when inflation-adjusted',
    source: 'IFS UK Inflation and Wage Growth 2024',
  },
]

type Score = { exact: number; adjacent: number; wrong: number; total: number; accuracy: number }

const ADJACENT: Record<string, string[]> = {
  true: ['mostly_true'],
  mostly_true: ['true', 'half_true'],
  half_true: ['mostly_true', 'mostly_false'],
  mostly_false: ['half_true', 'false', 'misleading'],
  false: ['mostly_false', 'misleading'],
  misleading: ['mostly_false', 'false'],
  inconclusive: ['unverifiable'],
  unverifiable: ['inconclusive'],
}

async function runEval(): Promise<Score> {
  let exact = 0, adjacent = 0, wrong = 0

  const results = []

  for (const evalCase of EVAL_CASES) {
    try {
      const chunks = await hybridRetrieve(evalCase.claim, 8)
      const verdict = await generateVerdict(evalCase.claim, chunks)

      const isExact = verdict.verdict === evalCase.correct_verdict
      const isAdjacent = ADJACENT[evalCase.correct_verdict]?.includes(verdict.verdict)

      if (isExact) exact++
      else if (isAdjacent) adjacent++
      else wrong++

      results.push({
        id: evalCase.id,
        claim: evalCase.claim,
        expected: evalCase.correct_verdict,
        actual: verdict.verdict,
        confidence: verdict.confidence_pct,
        result: isExact ? 'exact' : isAdjacent ? 'adjacent' : 'wrong',
      })

      console.log(`${isExact ? '✓' : isAdjacent ? '~' : '✗'} ${evalCase.id}: expected ${evalCase.correct_verdict}, got ${verdict.verdict}`)
    } catch (err) {
      console.error(`Error on ${evalCase.id}:`, err)
      wrong++
    }
  }

  const total = EVAL_CASES.length
  const accuracy = Math.round(((exact * 2 + adjacent * 1) / (total * 2)) * 100)

  const summary = { exact, adjacent, wrong, total, accuracy }
  console.log(`\nResults: ${exact} exact, ${adjacent} adjacent, ${wrong} wrong — Accuracy: ${accuracy}%`)

  const outputDir = 'eval-results'
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(
    `${outputDir}/${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify({ summary, results, ran_at: new Date().toISOString() }, null, 2)
  )

  return summary
}

runEval().catch(console.error)
