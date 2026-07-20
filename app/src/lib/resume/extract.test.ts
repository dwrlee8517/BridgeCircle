import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { inspectDocxArchive } from './extract'

type Entry = {
  name: string
  content: Buffer
  declaredCompressedBytes?: number
  declaredUncompressedBytes?: number
}

function archive(entries: Entry[]): Buffer {
  const compressed = entries.map((entry) => deflateRawSync(entry.content))
  const localSize = entries.reduce(
    (total, entry, index) => total + 30 + Buffer.byteLength(entry.name) + compressed[index].length,
    0,
  )
  const centralSize = entries.reduce(
    (total, entry) => total + 46 + Buffer.byteLength(entry.name),
    0,
  )
  const bytes = Buffer.alloc(localSize + centralSize + 22)
  let cursor = 0
  const localOffsets: number[] = []
  for (const [index, entry] of entries.entries()) {
    localOffsets.push(cursor)
    const name = Buffer.from(entry.name)
    bytes.writeUInt32LE(0x04034b50, cursor)
    bytes.writeUInt16LE(20, cursor + 4)
    bytes.writeUInt16LE(8, cursor + 8)
    bytes.writeUInt32LE(compressed[index].length, cursor + 18)
    bytes.writeUInt32LE(entry.content.length, cursor + 22)
    bytes.writeUInt16LE(name.length, cursor + 26)
    name.copy(bytes, cursor + 30)
    compressed[index].copy(bytes, cursor + 30 + name.length)
    cursor += 30 + name.length + compressed[index].length
  }

  const centralOffset = cursor
  for (const [index, entry] of entries.entries()) {
    const name = Buffer.from(entry.name)
    bytes.writeUInt32LE(0x02014b50, cursor)
    bytes.writeUInt16LE(20, cursor + 4)
    bytes.writeUInt16LE(20, cursor + 6)
    bytes.writeUInt16LE(8, cursor + 10)
    bytes.writeUInt32LE(entry.declaredCompressedBytes ?? compressed[index].length, cursor + 20)
    bytes.writeUInt32LE(entry.declaredUncompressedBytes ?? entry.content.length, cursor + 24)
    bytes.writeUInt16LE(name.length, cursor + 28)
    bytes.writeUInt32LE(localOffsets[index], cursor + 42)
    name.copy(bytes, cursor + 46)
    cursor += 46 + name.length
  }
  bytes.writeUInt32LE(0x06054b50, cursor)
  bytes.writeUInt16LE(entries.length, cursor + 8)
  bytes.writeUInt16LE(entries.length, cursor + 10)
  bytes.writeUInt32LE(centralSize, cursor + 12)
  bytes.writeUInt32LE(centralOffset, cursor + 16)
  return bytes
}

describe('DOCX archive inspection', () => {
  it('accepts a bounded classic DOCX central directory', () => {
    const result = inspectDocxArchive(
      archive([
        { name: '[Content_Types].xml', content: Buffer.from('<Types />') },
        { name: 'word/document.xml', content: Buffer.from('<document>Hello</document>') },
      ]),
    )
    expect(result).toEqual({
      ok: true,
      entryCount: 2,
      expandedBytes: Buffer.byteLength('<Types /><document>Hello</document>'),
    })
  })

  it('rejects an archive whose declared expansion ratio is unsafe', () => {
    const result = inspectDocxArchive(
      archive([
        { name: '[Content_Types].xml', content: Buffer.from('<Types />') },
        {
          name: 'word/document.xml',
          content: Buffer.from('payload'),
          declaredCompressedBytes: 1,
          declaredUncompressedBytes: 1_000,
        },
      ]),
    )
    expect(result).toEqual({ ok: false, reason: 'docx_compression_ratio_exceeded' })
  })

  it('rejects a ZIP that is not a DOCX package', () => {
    const result = inspectDocxArchive(
      archive([{ name: 'payload.bin', content: Buffer.from('payload') }]),
    )
    expect(result).toEqual({ ok: false, reason: 'docx_required_entries_missing' })
  })

  it('rejects a deflate stream that expands beyond its declared bound', () => {
    const result = inspectDocxArchive(
      archive([
        { name: '[Content_Types].xml', content: Buffer.from('<Types />') },
        {
          name: 'word/document.xml',
          content: Buffer.alloc(1_024, 65),
          declaredUncompressedBytes: 1,
        },
      ]),
    )
    expect(result).toEqual({ ok: false, reason: 'docx_entry_expansion_invalid' })
  })
})
