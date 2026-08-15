# Brand assets

The 2026-08 mark refresh: "tuned baseline" mark + "quiet ink" wordmark.
Canonical geometry lives in [`src/components/ui/wordmark.tsx`](../../src/components/ui/wordmark.tsx)
(the component IS the lockup — these files exist for use *outside* the app:
decks, Arcade, social, print).

| File | Use |
|---|---|
| `mark.svg` | The mark on light backgrounds (ink + primary blue) |
| `mark-dark.svg` | The mark on dark backgrounds |
| `tile.svg` | App tile — favicon, home screen, avatars (also `src/app/icon.svg`) |
| `wordmark.svg` / `wordmark-dark.svg` | "BridgeCircle" with letterforms outlined to paths (Pretendard 700) — renders identically everywhere, no font needed |
| `lockup.svg` / `lockup-dark.svg` | Mark + wordmark combined, outlined — the deck/marketing asset |
| `lockup-light@2x.png` / `lockup-dark@2x.png` | PNG lockups captured from the running app header |

Rules:

- The name is one continuous word, single ink — the blue lives only in the
  mark. Never re-space, break, or two-tone the wordmark.
- Accent is the product primary (`--blue-500`, #3182f6 light / #4593fc dark).
  The pre-refresh files used a retired #0051d5 — if you find that blue
  anywhere, it's stale.
- The SVG wordmark/lockup letterforms are outlined from the app's vendored
  Pretendard variable font at weight 700 with the lockup's tight tracking, so
  the type is the app's actual face with zero font dependency. The PNGs are
  captured from the running header. To regenerate either after a wordmark
  change, see the capture/outline scripts referenced in the mark-refresh PR.
