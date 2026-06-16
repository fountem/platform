# RAG Pipeline — Technical Detail

## Chunking Strategy (packages/rag/src/chunker.ts)
Standard character-count chunking loses evidential context. Fountem uses **semantic unit chunking**: each chunk is a single complete statistical claim, policy commitment, or analytical finding with its surrounding sentence.

Target: 150–300 tokens per chunk. One-sentence overlap at boundaries. Each chunk independently meaningful — a journalist could quote it without the surrounding text.

Topic tags per chunk: ['housing', 'nhs', 'immigration', etc.]
Party relevance tags: ['labour', 'conservative', etc.]

## Hybrid Retrieval — BM25 + pgvector + RRF (packages/rag/src/retriever.ts)

```typescript
async function hybridRetrieve(query: string, topK: number = 8): Promise<RankedChunk[]> {
  // 1. BM25 keyword search via pg_trgm full-text
  const bm25Results = await supabase.rpc('bm25_search', { query_text: query, limit: 20 });

  // 2. Semantic vector search via pgvector
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small', input: query
  });
  const vectorResults = await supabase.rpc('vector_search', {
    query_embedding: embedding.data[0].embedding, limit: 20
  });

  // 3. Reciprocal Rank Fusion — merges both result sets
  return reciprocalRankFusion(bm25Results, vectorResults, topK);
}
```

Why hybrid? BM25 finds exact matches ("housing starts 2024 Q3"). Vector search finds related concepts even when the claim uses different words. Politicians never use ONS terminology exactly. Both are needed.

## Claude Sonnet Citations API (packages/rag/src/verdict-engine.ts)

Key: Pass evidence chunks as structured document sources with `citations: { enabled: true }`. Claude returns inline citations automatically — no manual citation extraction needed.

System prompt enforces:
1. Every factual assertion must cite a provided passage (never from training memory)
2. If documents lack sufficient evidence → return `inconclusive` and explain what's missing
3. Never express political opinion — assess the claim, not the politician
4. State what evidence would change the verdict (falsifiability — mandatory)
5. Plain English — write for a voter, not an academic

Output: `{ verdict, confidence_pct, summary, reasoning, what_would_change_this, source_citations }`

## Source Hierarchy (priority order)
1. ONS statistical bulletins — primary UK statistics authority
2. IFS analysis and reports — gold standard for fiscal/economic claims
3. Hansard transcripts — verbatim parliamentary record
4. NAO reports — public spending, government delivery
5. Resolution Foundation — housing, wages, inequality
6. Full Fact verdicts — **secondary corroboration only, never primary citation**
7. BBC Reality Check — corroboration only
8. Academic (peer-reviewed) — domain-specific depth

Full Fact and BBC Reality Check are corroboration only. Citing a fact-checker to fact-check is circular and legally weak.

## Eval Harness (scripts/eval-harness.ts)
50 claims with known correct verdicts. Run on every code change to the RAG pipeline.
Scoring: exact match = 2pts, adjacent verdict level = 1pt, wrong = 0pts
Target: 80%+ exact match, 95%+ within one verdict level

## Agent Layer (Phase 2 — Month 6)
Complex multi-part claims activate LangGraph agent:
1. ClaimAnalyser (Claude Haiku) — decompose into 2-4 sub-claims
2. SubClaimVerifier × N in parallel (Claude Sonnet + RAG)
3. ConflictResolver (Claude Sonnet) — handle "true stat used to support false conclusion"
4. VerdictOutput

Conflict resolution is the key differentiator: a politician can use a true statistic to support a false conclusion. Simple RAG pipelines return the statistic as true and miss the misleading inference. Fountem's agent catches this.
