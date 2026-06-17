/**
 * Pure scoring helpers for the verdict eval harness. Kept dependency-free so the
 * grading logic is unit-tested independently of any LLM/DB calls.
 */

export type EvalOutcome = 'exact' | 'adjacent' | 'wrong'

/** Verdicts considered "one step away" — counted as half credit. */
export const ADJACENT_VERDICTS: Record<string, string[]> = {
  true: ['mostly_true'],
  mostly_true: ['true', 'half_true'],
  half_true: ['mostly_true', 'mostly_false'],
  mostly_false: ['half_true', 'false', 'misleading'],
  false: ['mostly_false', 'misleading'],
  misleading: ['mostly_false', 'false'],
  inconclusive: ['unverifiable'],
  unverifiable: ['inconclusive'],
}

export function classifyResult(expected: string, actual: string): EvalOutcome {
  if (expected === actual) return 'exact'
  if (ADJACENT_VERDICTS[expected]?.includes(actual)) return 'adjacent'
  return 'wrong'
}

export interface EvalScore {
  exact: number
  adjacent: number
  wrong: number
  total: number
  /** Weighted accuracy: exact = 1.0, adjacent = 0.5, wrong = 0. Range 0–100. */
  accuracy: number
}

export function computeScore(outcomes: EvalOutcome[]): EvalScore {
  const exact = outcomes.filter((o) => o === 'exact').length
  const adjacent = outcomes.filter((o) => o === 'adjacent').length
  const wrong = outcomes.filter((o) => o === 'wrong').length
  const total = outcomes.length
  const accuracy = total === 0 ? 0 : Math.round(((exact * 2 + adjacent) / (total * 2)) * 100)
  return { exact, adjacent, wrong, total, accuracy }
}
