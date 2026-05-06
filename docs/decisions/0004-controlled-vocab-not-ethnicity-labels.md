# 0004 — Use controlled vocabulary (language/region/academic background) for mentor preference, not ethnicity labels

- **Status:** accepted
- **Date:** 2026-04-23
- **Decider:** Richard

## Context

The pilot includes Chadwick International (Songdo, Korea). Korean mentors and Korean-American alumni often prefer (and benefit from) being matched with mentees who share cultural or linguistic context. This is real signal worth respecting.

But labeling alumni by ethnicity is risky on multiple fronts: legally, socially, and as a mentee-side filter ("show me only Korean mentors") risks discriminatory matching even when the intent is benign.

## Decision

Mentor preference is captured as **controlled vocabulary** in three dimensions:

- **Language** (e.g. Korean, English, Spanish)
- **Region** (e.g. Korea, US-California, US-East-Coast)
- **Academic background** (e.g. STEM-undergrad, business, humanities, K-12-international-school)

These preferences are **soft ranking signals**, not hard filters. A mentee can still send a request to a mentor whose preference doesn't match — the preference shifts ranking, not access.

Mentor preferences are **kept private to the mentor**. They are never exposed to mentees in profile or search.

**Never:** ethnicity labels, race fields, nationality-by-birth fields, or any equivalent.

## Consequences

- **+** Captures the real cultural/linguistic signal without using protected categories.
- **+** Soft ranking + hidden preferences avoids the worst failure mode (mentee-driven filtering on ethnicity proxy).
- **+** Controlled vocabulary keeps the data clean and auditable.
- **−** Less precise than direct labels in edge cases (e.g. third-culture identities don't map cleanly).
- **−** Adds onboarding complexity for mentors (three preference dimensions).

## Alternatives considered

- **Ethnicity / nationality labels** — rejected; legal and ethical exposure outweighs matching gain.
- **No preference signal at all** — loses real information. Korean alumni in particular have flagged this as valuable.
- **Free-text "what do you want in a mentee" field** — doesn't compose with structured ranking; harder to keep private.
