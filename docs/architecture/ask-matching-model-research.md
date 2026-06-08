# Ask Matching Model Research

- **Current as of:** 2026-06-08
- **Primary context:** [0009 - Hybrid Ask matching](../decisions/0009-hybrid-ask-matching.md)
- **Decision pressure:** choose the embedding and reranking stack for the next Ask matching upgrade without weakening privacy, warm-network scoring, or latency.

## Summary

ADR 0009 has the right product architecture: hard gates, hybrid retrieval, warm-network scoring, then reranking. The research changes the likely implementation detail: the default page-load path should probably use a dedicated reranker for semantic ordering, then reserve a small LLM for final explanations and ask-copy support.

Best practical default for BridgeCircle:

1. **Use hybrid retrieval, not vector-only.** Structured and lexical retrieval are still needed for exact names, employers, schools, cities, cohort, availability, and privacy gates.
2. **Use permission-safe profile chunks, not one global profile vector.** Each embedded chunk needs `organization_id`, `user_id`, `section`, `visibility_tier`, `content_hash`, `embedding_model`, and `embedding_dim`.
3. **Start hosted, not self-hosted.** Model cost is tiny at pilot scale; single-engineer operational complexity is the real cost.
4. **Evaluate `voyage-4` or `voyage-4-lite` plus `rerank-2.5-lite` first.** It gives one provider for embeddings and reranking, strong multilingual/general retrieval, 32k context, low cost, and Anthropic explicitly points Claude users toward Voyage because Anthropic has no native embeddings.
5. **Keep Claude Haiku 4.5 for explanations over the final 5-10 candidates, not for scoring all 20-40 candidates by default.** This preserves human-readable "why this match" copy while reducing latency, cost, and nondeterminism.
6. **Benchmark Google Gemini Embedding 2 / Gemini Embedding 001 and Qwen3 in evals.** Google is a strong embedding candidate but lacks a native reranker. Qwen3 is the strongest open-source family to test, especially if privacy or vendor control later justifies self-hosting.

## BridgeCircle-Specific Requirements

Ask matching is not ordinary document RAG. A good result is not just semantically similar to the ask. It must be safe, socially appropriate, and actionable.

Must-have ranking inputs:

- hard gates: same active organization, profile privacy, self-exclusion, helper availability, mentorship capacity
- semantic fit: role history, skills, bio, mentoring topics, education, location, and past/current distinctions
- warm-network fit: shared school, cohort proximity, shared city, shared major, friendship/path, profile freshness, helper load, response likelihood
- explanation quality: user-facing rationale must cite visible evidence, not inferred private facts

That means:

- Embeddings should improve **recall**: "find people the structured filters missed."
- Reranking should improve **precision**: "put the best evidence-backed people first."
- Warm-network scoring should stay mostly **deterministic**: do not let a model silently override trust, availability, privacy, or capacity.
- LLMs are useful for **explanations and draft help**, but they are the slowest and least deterministic way to score every candidate.

## Current Baseline In The Repo

Current code still follows the ADR 0006-style baseline:

- `app/src/lib/search/extractFilters.ts` uses `claude-haiku-4-5-20251001` to extract structured filters and a thematic intent.
- `app/src/lib/search/searchAlumni.ts` retrieves and scores active org members in JS using scalar filters and warm signals.
- `app/src/lib/search/rerankCandidates.ts` sends up to 30 candidate JSON objects to Haiku and asks for the top 10 plus rationales.
- Rich profile sections are redacted before reranking based on the viewer/candidate privacy relationship.

That baseline is reasonable for sub-1000 members, but it has two structural limits:

- The candidate pool is still bounded by scalar extraction, so semantically relevant helpers can be missed before the reranker sees them.
- Haiku reranks every request, which is useful for rationales but unnecessarily expensive and slow compared with a dedicated reranker.

## Model Landscape

### Hosted Embedding APIs

| Provider | Current models to consider | Cost | Dimensions / context | Accuracy signal | BridgeCircle read |
|---|---:|---:|---:|---|---|
| OpenAI | `text-embedding-3-small` | $0.02 / 1M input tokens | 1536 dims, 8192 input tokens | OpenAI reports 62.3 MTEB | Very cheap, stable baseline. No native reranker. Good fallback, not likely best quality in 2026. |
| OpenAI | `text-embedding-3-large` | $0.13 / 1M input tokens | 3072 dims, 8192 input tokens, dimension truncation supported | OpenAI reports 64.6 MTEB | Mature and easy, but price/quality is less compelling than newer Voyage/Google/Qwen options. |
| Google | `gemini-embedding-2` | $0.20 / 1M text tokens standard, $0.10 batch | 128-3072 dims, 8192 input tokens, text/image/video/audio/PDF input | Latest Google embedding model, updated Apr 2026 | Strong if BridgeCircle later embeds resumes, PDFs, or profile media. Overkill for text-only pilot. No native reranker. |
| Google | `gemini-embedding-001` | $0.15 / 1M input tokens standard, $0.075 batch | 128-3072 dims, 2048 input tokens | Google reports MTEB 68.17 at 1536 dims and 67.99 at 768 dims | Strong text-only embedding. 2048-token context is fine for profile chunks. Needs external reranker or LLM rerank. |
| Voyage | `voyage-4-lite` | $0.02 / 1M tokens | 256/512/1024/2048 dims, 32k context | Latest low-cost Voyage embedding | Best cost-sensitive hosted candidate. Pairs directly with Voyage rerankers. |
| Voyage | `voyage-4` | $0.06 / 1M tokens | 256/512/1024/2048 dims, 32k context | Latest balanced Voyage embedding | Best first hosted candidate for BridgeCircle evals. Strong quality without high cost. |
| Voyage | `voyage-4-large` | $0.12 / 1M tokens | 256/512/1024/2048 dims, 32k context | Voyage's best general-purpose/multilingual retrieval model | Use only if local evals show material recall gain over `voyage-4`. |
| Alibaba / Qwen API | `text-embedding-v4` | $0.07 / 1M input tokens | 64-2048 dims, 8192 max tokens, batch size 10 | Alibaba says it is part of Qwen3-Embedding and supports 100+ languages plus code | Viable hosted Qwen option. More vendor/geography review needed than OpenAI/Google/Voyage. |
| Qwen open weights | `Qwen3-Embedding-0.6B`, `4B`, `8B` | No per-token model fee; pay hosting/ops | 32k context; max dims 1024, 2560, 4096 | Qwen reports state-of-the-art multilingual/retrieval results; Apache 2.0 | Best open-source family to test. Not first default unless privacy/infra strategy changes. |

OpenAI is still a good "it just works" embedding provider, especially `text-embedding-3-small`. The issue is not quality failure; it is that OpenAI has no native reranker and newer providers now give better retrieval/rerank pairings.

Google is especially strong on multilingual and multimodal embeddings. For the current text-profile Ask use case, the lack of a Google reranker means BridgeCircle would still pair Google embeddings with Voyage, Qwen, Cohere, or an LLM.

Voyage is the cleanest hosted stack because it offers current embeddings and rerankers under one provider. Anthropic's Claude docs explicitly say Anthropic does not offer embeddings and point users to Voyage as a provider to evaluate.

Qwen is the strongest open-source path. The model family is attractive because it offers both embeddings and rerankers in 0.6B, 4B, and 8B sizes under Apache 2.0. The tradeoff is serving complexity.

### Reranker Models

There are fewer serious reranker choices than embedding choices. The reason is architectural: a reranker usually scores query-document pairs with cross-attention or LLM-like reasoning, which is slower and more expensive than a bi-encoder embedding lookup.

| Provider | Model | Cost | Limits | Accuracy signal | BridgeCircle read |
|---|---:|---:|---:|---|---|
| Voyage | `rerank-2.5-lite` | $0.02 / 1M processed tokens | 1000 docs, 32k query+doc pair, 600k request tokens | Voyage positions it for latency-sensitive apps | Best first production default if eval quality is sufficient. |
| Voyage | `rerank-2.5` | $0.05 / 1M processed tokens | Same as lite | Voyage's highest-accuracy reranker | Use if `lite` misses nuanced profile matches. Still far cheaper than LLM reranking. |
| Alibaba / Qwen API | `qwen3-rerank` | $0.10 / 1M input tokens | 500 docs, 4000 tokens/doc, 120k request tokens | 100+ languages | Good hosted Qwen pair for Alibaba embedding. Needs vendor/geography review. |
| Qwen open weights | `Qwen3-Reranker-0.6B`, `4B`, `8B` | Hosting/ops cost | 32k context | Qwen reports MTEB-R 65.80, 69.76, 69.02 respectively; 4B is strongest in that table | Best open-source reranker family. 0.6B is practical; 4B is the quality sweet spot; 8B may not justify extra latency. |
| Cohere | `rerank-v3.5` | Search-unit pricing, not as cleanly token-comparable | Supports documents and semi-structured JSON | Mature enterprise rerank provider | Worth testing only if Voyage/Qwen fail. Adds another provider and less transparent cost math. |
| BGE / Jina / MiniLM open models | `bge-reranker-v2-m3`, Jina rerankers, MS MARCO MiniLM cross-encoders | Hosting/ops cost | Varies, often shorter context than Qwen/Voyage | Useful baselines; Qwen's own table ranks BGE v2 M3 below Qwen3-Reranker | Good local baselines, not likely final default. |
| LLM judge | Claude Haiku 4.5 or a small OpenAI/Gemini model | Token-priced input/output | Depends on model context | Highest task flexibility; can produce rationales | Good for final explanations or async deep match. Too slow and costly as the only default reranker. |

## Cost Analysis

At BridgeCircle pilot scale, embedding cost is basically noise. Rerank and LLM explanation cost matters more because it happens per query.

Assumptions for one Ask request:

- query: 60 tokens
- candidate evidence string: 250 tokens after privacy redaction
- rerank pool: 30 candidates
- final results: 5-10
- current Haiku-style JSON output: roughly 1000 output tokens

### One-Time / Background Embedding Cost

Assume 1000 members, 3 visible chunks per member, 500 tokens per chunk: 1.5M embedded tokens.

| Model | Approx cost to backfill 1000 members |
|---|---:|
| OpenAI `text-embedding-3-small` | $0.03 |
| OpenAI `text-embedding-3-large` | $0.20 |
| Google `gemini-embedding-001` | $0.23 standard, $0.11 batch |
| Google `gemini-embedding-2` | $0.30 standard, $0.15 batch |
| Voyage `voyage-4-lite` | $0.03 |
| Voyage `voyage-4` | $0.09 |
| Voyage `voyage-4-large` | $0.18 |
| Alibaba `text-embedding-v4` | $0.11 |

Even at 50,000 members with the same chunking assumption, these numbers multiply by 50. The monthly cost is still modest. Storage is also modest: 150,000 vectors at 1024 dims is roughly 600 MB of raw float32 data; 3072 dims is roughly 1.8 GB before index overhead.

Conclusion: choose embeddings on retrieval quality, provider fit, and operational simplicity, not on token cost.

### Per-Query Cost

| Strategy | Rough cost per Ask | What you pay for |
|---|---:|---|
| Similarity only | less than $0.00001 to $0.00003 | one query embedding plus pgvector search |
| Voyage `rerank-2.5-lite` over 30 candidates | about $0.00019 | `(query tokens * docs) + doc tokens`, about 9300 processed tokens |
| Voyage `rerank-2.5` over 30 candidates | about $0.00047 | same token formula |
| Alibaba `qwen3-rerank` over 30 candidates | about $0.00093 | same rough processed-token volume |
| Claude Haiku 4.5 rerank over 30 candidates | about $0.01 to $0.015 | candidate JSON input plus structured output |
| Claude Haiku 4.5 explanation for final 5-10 only | about $0.003 to $0.008 | much smaller candidate set, rationale/draft output |

Dedicated reranking is roughly 10x to 50x cheaper than an LLM judge for the ranking step. The larger savings is latency and reliability, not dollars.

## Latency Analysis

Expected latency bands for the default Ask page:

| Strategy | Expected latency | Notes |
|---|---:|---|
| Structured + lexical + vector similarity only | 300-900 ms | Best fallback path. Good for broad asks; weak for nuanced ranking. |
| Hybrid retrieval + dedicated hosted reranker | 700 ms - 2 s | Should fit ADR 0009's 2-5 s budget comfortably. |
| Hybrid retrieval + self-hosted Qwen reranker | 500 ms - 3 s | Depends heavily on GPU, quantization, batching, cold starts, and deployment. |
| Hybrid retrieval + small LLM rerank over 20-40 candidates | 2-6 s | Current architecture target. Quality and rationales are good, but default page load can feel slow. |
| Async deep matching with larger LLM | 5-30 s | Keep as explicit deeper pass, not default. |

The highest-risk latency path is not vector search. It is a live LLM call that has to read every candidate and emit JSON. Dedicated rerankers are designed for exactly this middle stage.

## Accuracy Analysis

Public leaderboards are useful but insufficient for BridgeCircle. MTEB and vendor reports measure broad retrieval tasks; BridgeCircle needs people-matching under privacy and warm-network constraints.

Still, the public evidence suggests:

- Modern embeddings beat entity extraction on semantic recall, especially for past roles, adjacent skills, multilingual phrasing, and non-exact career language.
- Hybrid retrieval is safer than vector-only because exact-match and structured constraints remain important.
- Cross-encoder or LLM reranking usually improves top-k precision over raw embedding similarity when the initial pool has enough recall.
- LLM reranking can outperform smaller cross-encoders on nuanced judgment, but it costs more and adds nondeterminism.
- Open-source rerankers have improved materially. Qwen3-Reranker-4B is especially strong on Qwen's reported retrieval subsets, but it is operationally heavier than hosted Voyage.

For BridgeCircle, the likely quality hierarchy is:

1. **Hybrid retrieval + warm score + dedicated reranker + final LLM explanations**: best default balance.
2. **Hybrid retrieval + warm score + small LLM rerank**: strongest reasoning/explanations, but slower and more expensive.
3. **Hybrid retrieval + warm score + similarity-only final sort**: acceptable fallback, not enough for the default Ask promise.
4. **Vector-only similarity**: not acceptable as default because it ignores hard gates, exact entities, and trust signals.

## Recommended Evaluation Plan

Do not pick the final model from MTEB alone. Build a BridgeCircle eval set first.

Create 40-80 Ask fixtures:

- "I am a recent grad deciding between consulting and product management."
- "I want someone who worked at McKinsey before moving into VC."
- "I need advice from someone who understands Chadwick International and US college recruiting."
- "I want to talk to a founder in health tech."
- "Can someone review a career decision in Korea?"
- "I want a former journalist who moved into tech communications."
- "I need help from someone open to advice, not necessarily formal mentorship."

For each fixture, label:

- ideal helpers
- acceptable helpers
- unacceptable helpers
- privacy-disqualified evidence
- exact-match expectations, such as named employer, city, or school

Measure:

- `recall@50`: did retrieval include the right people?
- `nDCG@10` or `MRR@10`: did ranking put them near the top?
- top-5 unacceptable rate
- top-5 "no visible evidence" rate
- median and p95 latency by pipeline stage
- token cost by provider
- send/request conversion after users see matches
- explicit "result felt off" feedback

Candidate stacks to test:

1. OpenAI `text-embedding-3-small` + similarity-only fallback.
2. OpenAI `text-embedding-3-large` + current Haiku rerank.
3. Google `gemini-embedding-001` + Voyage `rerank-2.5-lite`.
4. Google `gemini-embedding-2` + Voyage `rerank-2.5-lite`.
5. Voyage `voyage-4-lite` + Voyage `rerank-2.5-lite`.
6. Voyage `voyage-4` + Voyage `rerank-2.5-lite`.
7. Voyage `voyage-4` + Voyage `rerank-2.5`.
8. Qwen hosted `text-embedding-v4` + `qwen3-rerank`.
9. Self-hosted Qwen3-Embedding-0.6B + Qwen3-Reranker-0.6B if local infrastructure is easy.
10. Self-hosted Qwen3-Embedding-4B + Qwen3-Reranker-4B only if there is a credible GPU path.

The first production implementation should keep provider-switching cheap:

```text
EmbeddingProvider.embedQuery(text, options)
EmbeddingProvider.embedDocuments(chunks, options)
Reranker.rerank(query, candidates, options)
ExplanationModel.explain(query, finalCandidates, options)
```

Do not bake OpenAI, Google, Voyage, or Qwen directly into the database schema. Store the provider/model metadata as data.

## Architecture Implications

### Chunking

Use section-level chunks instead of one profile blob:

- `headline_current_role`
- `career_history_visible`
- `education_history_visible`
- `skills_visible`
- `bio_visible`
- `mentoring_topics_visible`

Each chunk should preserve evidence:

- source section
- exact visible text
- current/past field
- dates where visible
- visibility tier
- profile content hash
- embedding model and dimension

### Retrieval Flow

Recommended default flow:

1. Apply hard gates.
2. Run structured retrieval, lexical retrieval, and vector retrieval in parallel.
3. Merge with reciprocal-rank fusion or normalized scores.
4. Add deterministic warm-network score.
5. Select top 40 candidates for reranking.
6. Rerank with a dedicated reranker using only permission-safe candidate evidence.
7. Combine reranker score with warm-network score.
8. Generate templated explanations from evidence.
9. Optionally call Haiku for final 5-10 explanation polish and suggested first ask copy.

### Scoring Discipline

Keep these separate:

- Semantic relevance: model/reranker score.
- Warm-network trust: deterministic product score.
- Eligibility: hard gate, never model-adjusted.
- Explanation: generated only from visible evidence and stored retrieval evidence.

This avoids a common failure mode where a model buries an actually available, trusted helper because another candidate has a semantically richer profile.

## Final Recommendation

For the next Ask matching upgrade, implement the pipeline with provider interfaces and test the following first:

```text
Embedding: voyage-4 at 1024 dims
Reranker:  rerank-2.5-lite over top 40 candidates
LLM:       Claude Haiku 4.5 only for final explanations and ask-copy suggestions
Fallback:  structured + lexical + warm score, with vector similarity if embeddings are available
```

If evals show quality misses:

- upgrade reranker first: `rerank-2.5-lite` -> `rerank-2.5`
- then test `voyage-4-large`
- then test Google `gemini-embedding-001` / `gemini-embedding-2`
- then test Qwen3 open or hosted if vendor/infra constraints point that way

Do not self-host Qwen for the first pass unless privacy policy or vendor review requires it. The token costs of hosted embeddings/rerankers are too low to justify extra infrastructure during Phase 1.

## Sources

- BridgeCircle ADR: [0009 - Hybrid Ask matching](../decisions/0009-hybrid-ask-matching.md)
- Current implementation: [extractFilters.ts](../../app/src/lib/search/extractFilters.ts), [searchAlumni.ts](../../app/src/lib/search/searchAlumni.ts), [rerankCandidates.ts](../../app/src/lib/search/rerankCandidates.ts)
- OpenAI: [Embeddings guide](https://developers.openai.com/api/docs/guides/embeddings), [`text-embedding-3-small`](https://developers.openai.com/api/docs/models/text-embedding-3-small), [`text-embedding-3-large`](https://developers.openai.com/api/docs/models/text-embedding-3-large)
- Google: [Gemini embeddings docs](https://ai.google.dev/gemini-api/docs/embeddings), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [Gemini Embedding GA announcement](https://developers.googleblog.com/en/gemini-embedding-available-gemini-api/), [Gemini Embedding technical report](https://arxiv.org/abs/2503.07891)
- Anthropic: [Embeddings guidance](https://platform.claude.com/docs/en/build-with-claude/embeddings), [Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Voyage: [Text embeddings](https://docs.voyageai.com/docs/embeddings), [Rerankers](https://docs.voyageai.com/docs/reranker), [Pricing](https://docs.voyageai.com/docs/pricing), [MongoDB Voyage model overview](https://www.mongodb.com/docs/voyageai/models/)
- Qwen: [Qwen3 Embedding paper](https://arxiv.org/abs/2506.05176), [Qwen3 Embedding GitHub](https://github.com/QwenLM/Qwen3-Embedding), [Qwen3-Embedding-0.6B model card](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B), [Qwen3-Reranker-8B model card](https://huggingface.co/Qwen/Qwen3-Reranker-8B), [Alibaba Model Studio models](https://www.alibabacloud.com/help/en/model-studio/models), [Alibaba Model Studio pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing), [Qwen Cloud rerank API](https://docs.qwencloud.com/api-reference/rerank/dashscope-rerank)
- Reranking and retrieval studies: [Enhancing Q&A Text Retrieval with Ranking Models](https://arxiv.org/abs/2409.07691), [Evaluating retriever-reranker pairings in RAG](https://link.springer.com/article/10.1007/s10791-026-10156-3), [From BM25 to Corrective RAG](https://arxiv.org/abs/2604.01733), [Reranking survey](https://arxiv.org/abs/2512.16236), [Cohere Rerank docs](https://docs.cohere.com/docs/rerank)
