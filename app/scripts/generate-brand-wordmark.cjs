#!/usr/bin/env node
/**
 * Regenerates public/brand wordmark + lockup SVGs by outlining "BridgeCircle"
 * from the vendored Pretendard variable font (weight 700, tight tracking), so
 * the assets carry the app's actual letterforms with no font dependency.
 *
 * One-off tool with deps deliberately NOT in package.json — run ad hoc:
 *   npm install --no-save fontkit wawoff2 && node scripts/generate-brand-wordmark.cjs
 *
 * Mark geometry here must stay in lockstep with src/components/ui/wordmark.tsx.
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const FONT = path.join(ROOT, 'src/app/fonts/PretendardLatinVar.woff2')
const OUT = path.join(ROOT, 'public/brand')
const TEXT = 'BridgeCircle'
const WEIGHT = 700
const SIZE = 64
const TRACKING = -0.02

async function main() {
  const fontkit = require('fontkit')
  const wawoff = require('wawoff2')
  // fontkit's variation support chokes on woff2-transformed glyf tables;
  // decompress to ttf in memory first.
  const ttf = Buffer.from(await wawoff.decompress(fs.readFileSync(FONT)))
  const font = fontkit.create(ttf)
  const instance = font.getVariation({ wght: WEIGHT })
  const run = instance.layout(TEXT)
  const scale = SIZE / instance.unitsPerEm

  let x = 0
  const pieces = []
  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i]
    const pos = run.positions[i]
    const gx = x + pos.xOffset * scale
    const d = glyph.path.toSVG()
    if (d && d.length > 0) {
      pieces.push(
        `<path transform="translate(${gx.toFixed(2)},0) scale(${scale.toFixed(6)},${(-scale).toFixed(6)})" d="${d}"/>`,
      )
    }
    x += pos.xAdvance * scale + TRACKING * SIZE
  }
  const width = Math.ceil(x - TRACKING * SIZE)
  const ascent = instance.ascent * scale
  const height = Math.ceil(ascent + Math.abs(instance.descent * scale))

  const wordmark = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- BridgeCircle wordmark ("quiet ink", 2026-08 refresh). Pretendard ${WEIGHT}, outlined -
       no font dependency. The name is one continuous word, single ink; never two-tone it. -->
  <g fill="${fill}" transform="translate(0,${ascent.toFixed(2)})">
    ${pieces.join('\n    ')}
  </g>
</svg>
`

  const lockup = (ink, accent) => {
    const markSize = SIZE * 0.92
    const gap = SIZE * 0.34
    const markY = (height - markSize) / 2
    const textX = markSize + gap
    const total = Math.ceil(textX + width)
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${height}" width="${total}" height="${height}">
  <!-- BridgeCircle lockup: tuned-baseline mark + quiet-ink wordmark (2026-08 refresh). -->
  <g transform="translate(0,${markY.toFixed(2)}) scale(${(markSize / 64).toFixed(4)})">
    <circle cx="25" cy="32" r="19" fill="none" stroke="${ink}" stroke-width="5"/>
    <circle cx="39" cy="32" r="19" fill="none" stroke="${accent}" stroke-width="5"/>
  </g>
  <g fill="${ink}" transform="translate(${textX.toFixed(2)},${ascent.toFixed(2)})">
    ${pieces.join('\n    ')}
  </g>
</svg>
`
  }

  fs.writeFileSync(path.join(OUT, 'wordmark.svg'), wordmark('#191f28'))
  fs.writeFileSync(path.join(OUT, 'wordmark-dark.svg'), wordmark('#e9eaec'))
  fs.writeFileSync(path.join(OUT, 'lockup.svg'), lockup('#191f28', '#3182f6'))
  fs.writeFileSync(path.join(OUT, 'lockup-dark.svg'), lockup('#e9eaec', '#4593fc'))
  console.log(`generate-brand-wordmark: wrote 4 SVGs (${width}x${height} text box)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
