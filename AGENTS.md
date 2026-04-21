# AGENTS.md

Guidance for Codex when working in this repository.

## Project Overview

BridgeCircle is an early-stage concept for a verified alumni and community network focused on referrals, mentorship, recruiting, events, and local connection.

This repository is currently in a planning and concept phase. For now, it mostly contains positioning, MVP framing, and pitch materials rather than application code.

The likely near-term path is:

1. brainstorming and market framing
2. product planning and flow definition
3. MVP scoping
4. implementation
5. iteration based on feedback

## Source Of Truth

- `project-summary.md` is the main source of truth for product framing, MVP scope, market positioning, and growth direction.
- `alumni-network-investor-mvp-pitch.html` is the current single-file pitch / concept presentation.
- `README.md` should stay concise and high level.

## Current Phase

- Default to planning-first work unless the user clearly asks for implementation.
- Favor clarifying the product, user flows, data model, and MVP boundaries before introducing code or tooling.
- When proposing features, optimize for the smallest credible MVP that proves recurring member value.
- Preserve optionality. Do not prematurely lock the project into a specific stack, architecture, or monetization path unless the user asks for that decision.

## Working Conventions

- Use `BridgeCircle` as the project name unless the user explicitly renames it.
- Keep messaging consistent with the member-first positioning in `project-summary.md`.
- Avoid reframing the product as generic "alumni management software" unless the user explicitly requests that positioning.
- Prefer small, direct edits over adding extra tooling or restructuring the repo.
- Prefer concrete deliverables over vague brainstorming. Good outputs include product briefs, user stories, flows, MVP cuts, comparison tables, launch plans, and technical option memos.

## HTML Editing Guidance

- Keep `alumni-network-investor-mvp-pitch.html` self-contained unless the user asks for a multi-file split.
- Preserve the existing visual style unless the user asks for a redesign.
- When changing pitch copy, make sure the HTML and `project-summary.md` do not drift in meaning.

## Planning Guidance

- When the user is brainstorming, help convert ideas into structured artifacts:
  - target user segments
  - core jobs to be done
  - user flows
  - MVP vs later roadmap
  - risks and open questions
  - monetization assumptions
- Call out tradeoffs explicitly when recommending scope cuts or product choices.
- If a recommendation depends on an assumption, state the assumption clearly.
- Keep planning outputs practical and builder-oriented, not generic startup advice.

## Implementation Guidance

- When this repo starts gaining code, keep product intent aligned with the member-first thesis in `project-summary.md`.
- Prefer simple, readable foundations over premature abstraction.
- Add infrastructure only when it supports an immediate product need.
- Do not introduce heavy frameworks, services, or automation without a clear reason.
- When implementation begins, update documentation so the repo reflects the actual product direction rather than stale concept language.

## Repository Evolution

- As the project grows, keep the repo organized and easy to navigate.
- Root files should stay limited to high-signal project docs and top-level configuration.
- If planning materials expand, create a `docs/` directory and group files by purpose, such as product, market, roadmap, and architecture.
- If application code is added later, separate it clearly from concept and planning materials.
- If the project direction materially changes, update `README.md`, this file, and any core planning docs together.

## Repo Expectations

- There is currently no build system, package manager, or automated test suite in this repo.
- For documentation or HTML edits, validate changes by checking file consistency and keeping the repo simple.
- If new assets are added later, place them in a clearly named folder and update `README.md`.
- If code and tests are added later, document the main run/test commands in this file so future Codex runs can use them reliably.
