# AGENTS.md

Guidance for Codex when working in this repository.

## Project Overview

BridgeCircle is an early-stage concept for a verified alumni and community network focused on referrals, mentorship, recruiting, events, and local connection.

This repository currently holds concept and pitch materials rather than application code.

## Source Of Truth

- `project-summary.md` is the main source of truth for product framing, MVP scope, market positioning, and growth direction.
- `alumni-network-investor-mvp-pitch.html` is the current single-file pitch / concept presentation.
- `README.md` should stay concise and high level.

## Working Conventions

- Use `BridgeCircle` as the project name unless the user explicitly renames it.
- Keep messaging consistent with the member-first positioning in `project-summary.md`.
- Avoid reframing the product as generic "alumni management software" unless the user explicitly requests that positioning.
- Prefer small, direct edits over adding extra tooling or restructuring the repo.

## HTML Editing Guidance

- Keep `alumni-network-investor-mvp-pitch.html` self-contained unless the user asks for a multi-file split.
- Preserve the existing visual style unless the user asks for a redesign.
- When changing pitch copy, make sure the HTML and `project-summary.md` do not drift in meaning.

## Repo Expectations

- There is currently no build system, package manager, or automated test suite in this repo.
- For documentation or HTML edits, validate changes by checking file consistency and keeping the repo simple.
- If new assets are added later, place them in a clearly named folder and update `README.md`.
