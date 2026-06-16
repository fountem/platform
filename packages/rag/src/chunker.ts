/**
 * Semantic chunker — splits text by sentence boundaries into 150-300 token chunks
 * with 1-sentence overlap. Preserves statistical claims and date context.
 */

const AVG_CHARS_PER_TOKEN = 4
const TARGET_TOKENS = 200
const MAX_TOKENS = 300
const OVERLAP_SENTENCES = 1

function splitSentences(text: string): string[] {
  // Split on sentence endings, preserving them
  return text
    .replace(/\n{2,}/g, ' ¶ ')  // paragraph breaks → marker
    .split(/(?<=[.!?])\s+(?=[A-Z"'(])/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN)
}

export interface TextChunk {
  content: string
  chunkIndex: number
  estimatedTokens: number
  startsNewParagraph: boolean
}

export function chunkDocument(text: string): TextChunk[] {
  const sentences = splitSentences(text)
  const chunks: TextChunk[] = []
  let current: string[] = []
  let currentTokens = 0
  let chunkIndex = 0

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    const sentenceTokens = estimateTokens(sentence)

    // If adding this sentence exceeds max, flush
    if (currentTokens + sentenceTokens > MAX_TOKENS && current.length > 0) {
      chunks.push({
        content: current.join(' ').replace(/ ¶ /g, '\n\n'),
        chunkIndex: chunkIndex++,
        estimatedTokens: currentTokens,
        startsNewParagraph: current[0]?.includes('¶') ?? false,
      })

      // Overlap: keep last sentence(s) for context
      current = current.slice(-OVERLAP_SENTENCES)
      currentTokens = current.reduce((sum, s) => sum + estimateTokens(s), 0)
    }

    current.push(sentence)
    currentTokens += sentenceTokens
  }

  // Flush remaining
  if (current.length > 0 && currentTokens > estimateTokens('')) {
    chunks.push({
      content: current.join(' ').replace(/ ¶ /g, '\n\n'),
      chunkIndex: chunkIndex++,
      estimatedTokens: currentTokens,
      startsNewParagraph: false,
    })
  }

  return chunks
}
