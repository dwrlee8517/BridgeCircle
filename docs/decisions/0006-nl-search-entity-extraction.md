# 0006 — NL search uses entity extraction → structured match (not vector search)

- **Status:** superseded by 0009
- **Date:** 2026-04-25
- **Decider:** Richard

## Context

Week 3 ships natural-language search over the alumni directory ("alumni in finance who went to UPenn", "founders in LA"). Two architectural paths:

1. **Vector search** — embed every profile, embed the query, return cosine-similarity matches. Needs `pgvector` extension, embedding pipeline, and re-embedding on profile updates.
2. **Entity extraction** — LLM parses the query into structured fields (university, role, industry, city, year-range), then runs the existing structured search.

At sub-1000 alumni per org for Phase 1, structured filters already cover the realistic query space.

## Decision

Use **entity extraction**:

1. Query goes to Claude Haiku with a structured-output prompt.
2. Haiku returns `{ universities, roles, industries, cities, gradYearRange, openToMentor }` (or null fields).
3. The existing structured search (`app/src/lib/search/searchAlumni.ts`) runs against the parsed entities.
4. The result-card relevance reason is templated from the matched entities ("UPenn alum, finance, NYC").

No vector embeddings. No `pgvector` extension. No re-embedding pipeline.

This was the correct Phase 1 baseline. It is superseded for the default Ask
matching architecture by [0009 — Hybrid Ask matching](./0009-hybrid-ask-matching.md).
People directory search may still reuse this bounded entity-extraction path
where directory-style filtering is the intended product behavior.

## Consequences

- **+** Cheap. One Haiku call per query (~$0.0001). No infra to provision.
- **+** Interpretable. Users see why each result matched.
- **+** Reuses the structured search code path → one ranking implementation to maintain.
- **+** Falls back gracefully: if entity extraction fails or returns nothing, show "no matches" without a noisy semantic top-10.
- **−** Misses queries that don't reduce to entity filters ("warm and approachable mentors", "people I'd vibe with"). Acceptable for Phase 1.
- **−** Adds a soft dependency on Anthropic API availability for the search box (the structured search itself still works without it).

## Alternatives considered

- **`pgvector` + OpenAI/Cohere embeddings** — over-engineered for sub-1000 profiles. Re-embedding on every profile update is its own operational burden.
- **Hybrid (vector + structured)** — defer until structured-only proves insufficient. Premature optimization.
- **No NL search; structured filters only** — week 3 spec includes the NL search box because it's the demo moment ("type any sentence, get the right alumni"). Cutting it weakens the launch pitch.
