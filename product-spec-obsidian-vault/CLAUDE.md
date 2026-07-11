# product-spec-obsidian-vault

An Obsidian vault for BridgeCircle product specs. Open this folder as a vault
in Obsidian (Open folder as vault → point it here); Obsidian adds its own
`.obsidian/` config on first open.

## File structure

- **`Production/`** — Finalized specs. Each note describes a full feature or
  flow end-to-end, with links to the corresponding design. These are the
  agreed-upon specs within the vault. Note: the repo's existing active specs
  still live under [`docs/`](../docs/) (indexed by [`docs/INDEX.md`](../docs/INDEX.md));
  a spec here is canonical for its feature only once it has been migrated in and
  the relevant docs updated to point at it.

- **`Prototype/`** — Working drafts. Each person uploads their own in-progress
  version of a spec here. This is the scratch space for proposals and
  work-in-progress before they're finalized. Nothing here is authoritative.

## Conventions

- A spec graduates from `Prototype/` to `Production/` once it's finalized and
  describes the full feature/flow with design links.
- Prototype notes are personal drafts — expect multiple parallel versions of
  the same idea, and don't assume any one is the accepted direction.
- Use Obsidian `[[wikilinks]]` to connect related specs across folders.
