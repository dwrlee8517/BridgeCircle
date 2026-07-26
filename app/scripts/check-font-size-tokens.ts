/**
 * Guards the one silent failure mode in the type system.
 *
 * tailwind-merge cannot tell a custom `text-<size>` utility from a
 * `text-<color>` utility. Any named size missing from FONT_SIZE_TOKENS in
 * src/lib/utils.ts is bucketed as a COLOR, then dropped whenever a real color
 * class follows it in the same cn() call — the element silently inherits the
 * 16px root size. Nothing throws, nothing logs, and the diff looks fine.
 *
 * So: the set of size names in globals.css @theme must exactly equal
 * FONT_SIZE_TOKENS. This script fails the build when they drift apart.
 *
 * A `--text-<name>` entry in @theme is a SIZE when its value is a length
 * (`0.625rem`, `12px`) or references `--font-size-*`. It is a COLOR when it
 * resolves to a color role (--text-primary, -secondary, -muted, -faint,
 * -disabled, -on-fill) — those live in the same namespace and must be excluded.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.tsx?$/.test(entry.name)) yield full
  }
}

const globalsPath = resolve('src/app/globals.css')
const utilsPath = resolve('src/lib/utils.ts')
const css = readFileSync(globalsPath, 'utf8')
const utils = readFileSync(utilsPath, 'utf8')

function themeBlock(source: string): string {
  const start = source.indexOf('@theme inline {')
  if (start === -1) throw new Error('Could not find the @theme inline block in globals.css')
  let depth = 0
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, i)
    }
  }
  throw new Error('Unbalanced braces in the @theme inline block')
}

const LENGTH = /^\s*(?:-?[\d.]+(?:rem|px|em)|var\(--font-size-[a-z0-9-]+\))/

function themeSizeNames(block: string): Set<string> {
  const names = new Set<string>()
  for (const line of block.split('\n')) {
    const match = /^\s*--text-([a-z0-9-]+)\s*:\s*(.+?);/.exec(line)
    if (!match) continue
    const [, name, value] = match
    if (LENGTH.test(value)) names.add(name)
  }
  return names
}

function registeredNames(source: string): Set<string> {
  const match = /const FONT_SIZE_TOKENS = \[([\s\S]*?)\] as const/.exec(source)
  if (!match) throw new Error('Could not find FONT_SIZE_TOKENS in src/lib/utils.ts')
  return new Set(Array.from(match[1].matchAll(/'([a-z0-9-]+)'/g), (m) => m[1]))
}

const inTheme = themeSizeNames(themeBlock(css))
const registered = registeredNames(utils)

const missing = [...inTheme].filter((n) => !registered.has(n)).sort()
const extra = [...registered].filter((n) => !inTheme.has(n)).sort()

/**
 * Third check: a `text-<name>` used in source but defined nowhere.
 *
 * The set-equality checks above compare @theme to FONT_SIZE_TOKENS, so a name
 * absent from BOTH looks "in sync" while producing no utility at all — the
 * element silently falls back to inherited sizing. `text-display-section` sat
 * in five page headings this way.
 *
 * Scoped to the scale's own naming families (display-*, heading*, body*, plus
 * the standalone role names) so colour, alignment, and Tailwind's built-in
 * sizes never trip it.
 */
const SCALE_FAMILY = /^(display-|heading|body|subtitle$|caption$|label$|kicker$|nav$|chip$|control$|micro$|fine$|overline$|section-title$|page-title$|event-date)/
const used = new Map<string, string[]>()
for (const file of walk(resolve('src'))) {
  const text = readFileSync(file, 'utf8')
  for (const [, name] of text.matchAll(/\btext-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\b/g)) {
    if (!SCALE_FAMILY.test(name) || registered.has(name) || inTheme.has(name)) continue
    const where = used.get(name) ?? []
    if (!where.includes(file)) where.push(file)
    used.set(name, where)
  }
}

if (missing.length === 0 && extra.length === 0 && used.size === 0) {
  console.log(`font-size tokens in sync (${inTheme.size} named sizes, no undefined text-* in src)`)
  process.exit(0)
}

if (used.size > 0) {
  const lines = [...used.entries()]
    .sort()
    .map(([n, files]) => `  text-${n}  —  ${files.length} file(s): ${files.map((f) => f.replace(`${process.cwd()}/`, '')).join(', ')}`)
  console.error(
    `Scale-family \`text-*\` classes used in src but defined in neither @theme nor FONT_SIZE_TOKENS:\n${lines.join('\n')}\n` +
      '  → These generate no utility; the element inherits its size silently.\n' +
      '  → Define the token in globals.css @theme and register it, or use an existing role.',
  )
}

if (missing.length > 0) {
  console.error(
    `Named sizes in globals.css @theme but NOT registered in FONT_SIZE_TOKENS:\n  ${missing.join(', ')}\n` +
      '  → tailwind-merge will treat these as colors and silently drop them.\n' +
      '  → Add them to FONT_SIZE_TOKENS in src/lib/utils.ts.',
  )
}
if (extra.length > 0) {
  console.error(
    `Registered in FONT_SIZE_TOKENS but no longer a named size in @theme:\n  ${extra.join(', ')}\n` +
      '  → Remove them from FONT_SIZE_TOKENS, or restore the token in globals.css.',
  )
}
process.exit(1)
