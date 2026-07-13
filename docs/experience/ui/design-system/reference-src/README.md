# Prototype Source Reference

Status: reference only. Nothing in this folder is production code.

The active production sources are:

1. [`../tokens.md`](../tokens.md) for tokens
2. [`../components.md`](../components.md) for component usage
3. `../../../../../app/src/app/globals.css` for the live CSS contract
4. `../../../../../app/src/components/ui/` for shared app primitives

## What This Folder Is

This folder contains source fragments used to build exported visual prototypes.
Some files are Civic-era references. Many `ds-*` files are older Atrium-era
explorations that still mention terracotta, oat surfaces, lamplight mode, and
other retired token names.

Those historical names are intentionally preserved so the prototype can still be
understood, but they are not instructions for production implementation.

## Do Not Copy

Do not copy token values, CSS exports, Tailwind config snippets, component code,
or raw colors from this folder into the app.

Especially do not copy from:

- `ds-tokens-export.jsx`
- `ds-foundations.jsx`
- `ds-components.jsx`
- `ds-patterns.jsx`

These files contain obsolete Atrium token exports and copyable-looking snippets
that no longer match the Civic Editorial production contract.

## How To Use These Files

Use this folder only for:

- visual intent
- interaction references
- historical comparison
- exploring whether a pattern is worth promoting

Before promoting anything from this folder:

1. Translate the pattern into the current Civic token contract.
2. Update [`../components.md`](../components.md) if it becomes a production
   component or reusable pattern.
3. Implement through `app/src/components/ui/` or a route-local component that
   uses shared primitives.
4. Verify against fresh screenshots of the live app (Playwright captures
   under `output/playwright/`, gitignored).
