'use client'

import { useActionState, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type CsvRow, type CsvRowError, parseInviteCsv } from '@/lib/invite/parseCsv'
import { type CsvSubmitState, submitCsvInvites } from './csv-actions'

const initialState: CsvSubmitState = {}

export function CsvInviteForm() {
  const [valid, setValid] = useState<CsvRow[]>([])
  const [invalid, setInvalid] = useState<CsvRowError[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [state, action, pending] = useActionState(submitCsvInvites, initialState)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setParseError(null)
    if (!file) {
      setValid([])
      setInvalid([])
      setFileName(null)
      return
    }
    setFileName(file.name)
    try {
      const text = await file.text()
      const result = parseInviteCsv(text)
      setValid(result.valid)
      setInvalid(result.invalid)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not read the file.')
      setValid([])
      setInvalid([])
    }
  }

  function reset() {
    setValid([])
    setInvalid([])
    setFileName(null)
    setParseError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function onSubmit() {
    const fd = new FormData()
    fd.set('rows', JSON.stringify(valid))
    action(fd)
  }

  const result = state.result

  return (
    <div className="space-y-4">
      {!result ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="csv">Upload CSV</Label>
            <Input
              ref={fileRef}
              id="csv"
              name="csv"
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
            />
            <p className="text-xs text-muted-foreground">
              Required column: <code>email</code>. Optional: <code>full name</code>,{' '}
              <code>graduation year</code>. Header names matched case-insensitively.
            </p>
          </div>

          {parseError ? <p className="text-sm text-destructive">{parseError}</p> : null}

          {fileName && (valid.length > 0 || invalid.length > 0) ? (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="font-medium">{fileName}</span> —{' '}
                  <span className="text-accent-sage">{valid.length} valid</span>
                  {invalid.length > 0 ? (
                    <>
                      , <span className="text-destructive">{invalid.length} skipped</span>
                    </>
                  ) : null}
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={reset}>
                  Reset
                </Button>
              </div>

              {valid.length > 0 ? (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">
                    Show {valid.length} rows that will be invited
                  </summary>
                  <ul className="mt-2 max-h-48 overflow-auto pl-4 text-xs">
                    {valid.slice(0, 50).map((r) => (
                      <li key={r.email}>
                        {r.email}
                        {r.fullName ? ` — ${r.fullName}` : ''}
                        {r.graduationYear ? ` (${r.graduationYear})` : ''}
                      </li>
                    ))}
                    {valid.length > 50 ? (
                      <li className="italic text-muted-foreground">
                        …and {valid.length - 50} more.
                      </li>
                    ) : null}
                  </ul>
                </details>
              ) : null}

              {invalid.length > 0 ? (
                <details className="text-sm" open>
                  <summary className="cursor-pointer text-destructive">
                    Show {invalid.length} skipped rows
                  </summary>
                  <ul className="mt-2 max-h-48 overflow-auto pl-4 text-xs">
                    {invalid.map((r) => (
                      <li key={`${r.rowNumber}-${r.email ?? ''}`}>
                        Row {r.rowNumber}
                        {r.email ? ` (${r.email})` : ''}: {r.error}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

              <Button type="button" onClick={onSubmit} disabled={pending || valid.length === 0}>
                {pending
                  ? `Sending ${valid.length} invites…`
                  : `Send ${valid.length} invite${valid.length === 1 ? '' : 's'}`}
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="space-y-3 rounded-md border p-4">
          <p className="text-sm">
            <span className="text-accent-sage font-medium">{result.sent} sent</span>
            {result.duplicate > 0 ? (
              <>
                {' · '}
                <span className="text-muted-foreground">{result.duplicate} already invited</span>
              </>
            ) : null}
            {result.failed > 0 ? (
              <>
                {' · '}
                <span className="text-destructive">{result.failed} failed</span>
              </>
            ) : null}
          </p>

          {result.failed > 0 ? (
            <details className="text-sm" open>
              <summary className="cursor-pointer text-destructive">Show failures</summary>
              <ul className="mt-2 max-h-48 overflow-auto pl-4 text-xs">
                {result.outcomes
                  .filter((o) => o.status !== 'sent' && o.status !== 'duplicate')
                  .map((o) => (
                    <li key={o.email}>
                      {o.email}: {o.status}
                      {o.detail ? ` — ${o.detail}` : ''}
                    </li>
                  ))}
              </ul>
            </details>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              window.location.reload()
            }}
          >
            Upload another file
          </Button>
        </div>
      )}
    </div>
  )
}
