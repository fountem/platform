// Semantic unit chunker — splits on paragraph/sentence boundaries
// Target: 150–300 tokens. Hard max: 400. One-sentence overlap.

const AVG_CHARS_PER_TOKEN = 4

export interface Chunk {
  content: string
  chunk_index: number
  token_estimate: number
  topic_tags: string[]
  party_relevance: string[]
}

const TOPIC_PATTERNS: Record<string, RegExp[]> = {
  housing: [/hous/i, /planning/i, /construction/i, /rental/i, /mortgage/i],
  nhs: [/nhs/i, /health/i, /hospital/i, /waiting list/i, /gp/i],
  economy: [/gdp/i, /inflation/i, /growth/i, /fiscal/i, /budget/i, /unemployment/i],
  immigration: [/immigr/i, /asylum/i, /migrant/i, /visa/i, /border/i],
  climate: [/climate/i, /net zero/i, /carbon/i, /emission/i, /renewable/i],
  education: [/school/i, /university/i, /tuition/i, /ofsted/i, /teacher/i],
  crime: [/crime/i, /police/i, /prison/i, /knife/i, /asbo/i],
}

const PARTY_PATTERNS: Record<string, RegExp[]> = {
  labour: [/labour/i, /keir starmer/i, /wes streeting/i, /rachel reeves/i],
  conservative: [/conservative/i, /tory/i, /kemi badenoch/i, /rishi sunak/i],
  lib_dem: [/liberal democrat/i, /lib dem/i, /ed davey/i],
  snp: [/snp/i, /scottish national/i, /humza yousaf/i, /john swinney/i],
  reform: [/reform uk/i, /nigel farage/i, /richard tice/i],
}

function tagTopics(text: string): string[] {
  return Object.entries(TOPIC_PATTERNS)
    .filter(([, patterns]) => patterns.some(p => p.test(text)))
    .map(([topic]) => topic)
}

function tagParties(text: string): string[] {
  return Object.entries(PARTY_PATTERNS)
    .filter(([, patterns]) => patterns.some(p => p.test(text)))
    .map(([party]) => party)
}

function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 20)
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN)
}

export function chunkDocument(text: string): Chunk[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50)
  const chunks: Chunk[] = []
  let chunkIndex = 0
  let prevSentence = ''

  for (const paragraph of paragraphs) {
    const sentences = splitSentences(paragraph)
    let current = prevSentence ? prevSentence + ' ' : ''

    for (let i = 0; i < sentences.length; i++) {
      const candidate = current + sentences[i] + ' '
      const tokens = estimateTokens(candidate)

      if (tokens > 400 || (tokens > 300 && i > 0)) {
        // Flush current chunk
        if (current.trim()) {
          const content = current.trim()
          chunks.push({
            content,
            chunk_index: chunkIndex++,
            token_estimate: estimateTokens(content),
            topic_tags: tagTopics(content),
            party_relevance: tagParties(content),
          })
          // One-sentence overlap
          prevSentence = sentences[i - 1] ?? ''
          current = prevSentence + ' ' + sentences[i] + ' '
        }
      } else {
        current = candidate
      }
    }

    // Flush remaining
    if (current.trim() && estimateTokens(current) > 50) {
      const content = current.trim()
      chunks.push({
        content,
        chunk_index: chunkIndex++,
        token_estimate: estimateTokens(content),
        topic_tags: tagTopics(content),
        party_relevance: tagParties(content),
      })
      prevSentence = ''
    }
  }

  return chunks
}
