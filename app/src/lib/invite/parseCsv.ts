import Papa from 'papaparse'

export type CsvRow = {
  email: string
  fullName: string | null
  graduationYear: number | null
}

export type CsvRowError = {
  rowNumber: number
  email: string | null
  error: string
}

export type ParseCsvResult = {
  valid: CsvRow[]
  invalid: CsvRowError[]
}

const HEADER_ALIASES: Record<string, 'email' | 'fullName' | 'graduationYear'> = {
  email: 'email',
  'e-mail': 'email',
  'email address': 'email',
  name: 'fullName',
  'full name': 'fullName',
  fullname: 'fullName',
  'grad year': 'graduationYear',
  'graduation year': 'graduationYear',
  year: 'graduationYear',
  'class of': 'graduationYear',
  class: 'graduationYear',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Parse a CSV string into invite rows. Required column: email. Optional
 * columns: full name, graduation year. Header names are matched
 * case-insensitively against a small alias list so admins don't have to
 * remember the exact column names.
 *
 * Pure: takes a string, returns rows + per-row errors. The caller decides
 * what to do with each (preview, batch send, etc.). Dedup against the
 * existing invites/memberships happens server-side, not here — that's a
 * DB concern.
 *
 * Within the file we also dedup the same email appearing twice — first
 * occurrence wins, subsequent ones become invalid rows. This is almost
 * always a paste mistake.
 */
export function parseInviteCsv(csv: string): ParseCsvResult {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => HEADER_ALIASES[h.trim().toLowerCase()] ?? h.trim().toLowerCase(),
  })

  const valid: CsvRow[] = []
  const invalid: CsvRowError[] = []
  const seenEmails = new Set<string>()

  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      if (err.row === undefined) continue
      invalid.push({
        rowNumber: err.row + 2,
        email: null,
        error: err.message,
      })
    }
  }

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i]
    const rowNumber = i + 2

    const rawEmail = (row.email ?? '').trim().toLowerCase()
    const fullName = (row.fullName ?? '').trim() || null
    const yearStr = (row.graduationYear ?? '').trim()

    if (!rawEmail) {
      invalid.push({ rowNumber, email: null, error: 'Missing email.' })
      continue
    }
    if (!EMAIL_RE.test(rawEmail)) {
      invalid.push({ rowNumber, email: rawEmail, error: 'Email is not valid.' })
      continue
    }
    if (seenEmails.has(rawEmail)) {
      invalid.push({ rowNumber, email: rawEmail, error: 'Duplicate email in this file.' })
      continue
    }

    let graduationYear: number | null = null
    if (yearStr) {
      const n = Number(yearStr)
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1900 || n > 2100) {
        invalid.push({
          rowNumber,
          email: rawEmail,
          error: 'Graduation year must be a 4-digit year.',
        })
        continue
      }
      graduationYear = n
    }

    seenEmails.add(rawEmail)
    valid.push({ email: rawEmail, fullName, graduationYear })
  }

  return { valid, invalid }
}
