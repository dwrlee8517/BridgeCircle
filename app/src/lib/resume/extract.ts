import 'server-only'
import { inflateRawSync } from 'node:zlib'
import Anthropic from '@anthropic-ai/sdk'
import * as mammoth from 'mammoth'
import { type ExtractedProfile, extractedProfileSchema } from './schemas'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_OUTPUT_TOKENS = 2048
const MAX_DOCX_ENTRIES = 2_000
const MAX_DOCX_EXPANDED_BYTES = 20 * 1024 * 1024
const MAX_DOCX_ENTRY_BYTES = 10 * 1024 * 1024
const MAX_DOCX_COMPRESSION_RATIO = 100
const MAX_DOCX_TEXT_CHARS = 2_000_000
const DOCX_EXTRACTION_TIMEOUT_MS = 3_000

export type ExtractInput = {
  mimeType:
    | 'application/pdf'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'image/png'
  bytes: Buffer
}

export type ExtractResult =
  | { ok: true; profile: ExtractedProfile }
  | {
      ok: false
      error: 'no_api_key' | 'docx_parse_failed' | 'llm_call_failed' | 'invalid_response'
      detail?: string
    }

const SYSTEM_PROMPT = `You extract structured profile data from a resume.

Return ONLY a JSON object matching this exact shape — no prose, no markdown fences, no commentary.

{
  "name": string | null,
  "headline": string | null,
  "city": string | null,
  "currentEmployer": string | null,
  "currentTitle": string | null,
  "university": string | null,
  "major": string | null,
  "careerHistory": [
    {
      "employer": string,
      "title": string,
      "startDate": "YYYY" | "YYYY-MM" | null,
      "endDate": "YYYY" | "YYYY-MM" | null,
      "description": string | null
    }
  ],
  "educationHistory": [
    {
      "school": string,
      "degree": string | null,
      "field": string | null,
      "startDate": "YYYY" | "YYYY-MM" | null,
      "endDate": "YYYY" | "YYYY-MM" | null
    }
  ],
  "skills": string[]
}

Rules:
- If a field isn't in the resume, return null (or [] for arrays).
- Use null for endDate when the role is current.
- city should be the candidate's most recent location, formatted as "City, Region" or "City, Country".
- university and major reflect the most recent / highest education.
- currentEmployer and currentTitle reflect the most recent role (typically endDate=null in careerHistory).
- careerHistory is ordered most-recent-first.
- skills is a deduplicated, lowercase-where-natural list of 5-30 items.
- description in careerHistory is a 1-2 sentence summary, not the full bullet list.`

/**
 * Run the LLM extraction. Pure: takes raw bytes, returns ExtractedProfile.
 *
 * For PDF, we send the document as a base64 doc content block — Claude 4.x
 * reads PDFs natively. For PNG resume/CV screenshots, we send an image block.
 * For DOCX, we extract text with mammoth first since Claude doesn't accept
 * DOCX directly.
 *
 * On parse failure we retry once with a stricter "fix the JSON" message,
 * then bail. Cost is ~$0.008 per resume at Haiku pricing; latency 5-15s.
 */
export async function extractFromResume(input: ExtractInput): Promise<ExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'no_api_key' }

  const client = new Anthropic({ apiKey })

  let userContent: Anthropic.MessageParam['content']
  if (input.mimeType === 'application/pdf') {
    userContent = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: input.bytes.toString('base64'),
        },
      },
    ]
  } else if (input.mimeType === 'image/png') {
    userContent = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: input.bytes.toString('base64'),
        },
      },
      {
        type: 'text',
        text: 'Extract structured profile data from this resume or CV image.',
      },
    ]
  } else {
    let text: string
    try {
      const inspection = inspectDocxArchive(input.bytes)
      if (!inspection.ok) throw new Error(inspection.reason)
      const result = await withTimeout(
        mammoth.extractRawText({ buffer: input.bytes }),
        DOCX_EXTRACTION_TIMEOUT_MS,
      )
      text = result.value
      if (text.length > MAX_DOCX_TEXT_CHARS) throw new Error('docx_text_too_large')
    } catch (err) {
      return {
        ok: false,
        error: 'docx_parse_failed',
        detail: err instanceof Error ? err.message : String(err),
      }
    }
    userContent = [{ type: 'text', text }]
  }

  let raw: string
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userContent },
        // Prefill `{` to nudge JSON-only output.
        { role: 'assistant', content: [{ type: 'text', text: '{' }] },
      ],
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') {
      return { ok: false, error: 'invalid_response', detail: 'no text block' }
    }
    raw = `{${block.text}`
  } catch (err) {
    return {
      ok: false,
      error: 'llm_call_failed',
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'invalid_response', detail: 'not valid JSON' }
  }

  const validated = extractedProfileSchema.safeParse(parsed)
  if (!validated.success) {
    return {
      ok: false,
      error: 'invalid_response',
      detail: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    }
  }

  return { ok: true, profile: validated.data }
}

export type DocxInspection =
  | { ok: true; entryCount: number; expandedBytes: number }
  | { ok: false; reason: string }

/**
 * Inspect the ZIP central directory before Mammoth expands any DOCX entry.
 * ZIP64 and encrypted documents are rejected because their resource bounds
 * cannot be established from the classic central-directory fields below.
 */
export function inspectDocxArchive(bytes: Buffer): DocxInspection {
  const eocdOffset = findEndOfCentralDirectory(bytes)
  if (eocdOffset < 0 || eocdOffset + 22 > bytes.length) {
    return { ok: false, reason: 'docx_central_directory_missing' }
  }
  const entryCount = bytes.readUInt16LE(eocdOffset + 10)
  const centralSize = bytes.readUInt32LE(eocdOffset + 12)
  const centralOffset = bytes.readUInt32LE(eocdOffset + 16)
  if (entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    return { ok: false, reason: 'docx_zip64_not_supported' }
  }
  if (
    entryCount === 0 ||
    entryCount > MAX_DOCX_ENTRIES ||
    centralOffset + centralSize > eocdOffset
  ) {
    return { ok: false, reason: 'docx_central_directory_invalid' }
  }

  let cursor = centralOffset
  let expandedBytes = 0
  let hasContentTypes = false
  let hasDocument = false
  for (let index = 0; index < entryCount; index++) {
    if (cursor + 46 > eocdOffset || bytes.readUInt32LE(cursor) !== 0x02014b50) {
      return { ok: false, reason: 'docx_entry_invalid' }
    }
    const flags = bytes.readUInt16LE(cursor + 8)
    const compressionMethod = bytes.readUInt16LE(cursor + 10)
    const compressedBytes = bytes.readUInt32LE(cursor + 20)
    const uncompressedBytes = bytes.readUInt32LE(cursor + 24)
    const nameLength = bytes.readUInt16LE(cursor + 28)
    const extraLength = bytes.readUInt16LE(cursor + 30)
    const commentLength = bytes.readUInt16LE(cursor + 32)
    const localOffset = bytes.readUInt32LE(cursor + 42)
    const next = cursor + 46 + nameLength + extraLength + commentLength
    if (
      (flags & 0x1) !== 0 ||
      ![0, 8].includes(compressionMethod) ||
      compressedBytes === 0xffffffff ||
      uncompressedBytes === 0xffffffff ||
      localOffset === 0xffffffff ||
      next > eocdOffset ||
      uncompressedBytes > MAX_DOCX_ENTRY_BYTES
    ) {
      return { ok: false, reason: 'docx_entry_unbounded' }
    }
    if (
      uncompressedBytes > 0 &&
      (compressedBytes === 0 || uncompressedBytes / compressedBytes > MAX_DOCX_COMPRESSION_RATIO)
    ) {
      return { ok: false, reason: 'docx_compression_ratio_exceeded' }
    }
    expandedBytes += uncompressedBytes
    if (expandedBytes > MAX_DOCX_EXPANDED_BYTES) {
      return { ok: false, reason: 'docx_expanded_size_exceeded' }
    }
    const localEntry = inspectAndExpandLocalEntry(bytes, {
      localOffset,
      centralOffset,
      flags,
      compressionMethod,
      compressedBytes,
      uncompressedBytes,
    })
    if (!localEntry.ok) return localEntry
    const name = bytes.toString('utf8', cursor + 46, cursor + 46 + nameLength)
    if (name === '[Content_Types].xml') hasContentTypes = true
    if (name === 'word/document.xml') hasDocument = true
    cursor = next
  }
  if (cursor !== centralOffset + centralSize || !hasContentTypes || !hasDocument) {
    return { ok: false, reason: 'docx_required_entries_missing' }
  }
  return { ok: true, entryCount, expandedBytes }
}

function inspectAndExpandLocalEntry(
  bytes: Buffer,
  entry: {
    localOffset: number
    centralOffset: number
    flags: number
    compressionMethod: number
    compressedBytes: number
    uncompressedBytes: number
  },
): { ok: true } | { ok: false; reason: string } {
  if (
    entry.localOffset + 30 > entry.centralOffset ||
    bytes.readUInt32LE(entry.localOffset) !== 0x04034b50 ||
    bytes.readUInt16LE(entry.localOffset + 6) !== entry.flags ||
    bytes.readUInt16LE(entry.localOffset + 8) !== entry.compressionMethod
  ) {
    return { ok: false, reason: 'docx_local_entry_invalid' }
  }
  const localNameLength = bytes.readUInt16LE(entry.localOffset + 26)
  const localExtraLength = bytes.readUInt16LE(entry.localOffset + 28)
  const dataStart = entry.localOffset + 30 + localNameLength + localExtraLength
  const dataEnd = dataStart + entry.compressedBytes
  if (dataEnd > entry.centralOffset) {
    return { ok: false, reason: 'docx_local_entry_invalid' }
  }
  const compressed = bytes.subarray(dataStart, dataEnd)
  if (entry.compressionMethod === 0) {
    return compressed.length === entry.uncompressedBytes
      ? { ok: true }
      : { ok: false, reason: 'docx_entry_size_mismatch' }
  }
  try {
    const expanded = inflateRawSync(compressed, {
      maxOutputLength: Math.max(1, entry.uncompressedBytes),
    })
    return expanded.length === entry.uncompressedBytes
      ? { ok: true }
      : { ok: false, reason: 'docx_entry_size_mismatch' }
  } catch {
    return { ok: false, reason: 'docx_entry_expansion_invalid' }
  }
}

function findEndOfCentralDirectory(bytes: Buffer): number {
  const minimum = Math.max(0, bytes.length - 65_557)
  for (let offset = bytes.length - 22; offset >= minimum; offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) return offset
  }
  return -1
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('docx_extract_timeout')), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
