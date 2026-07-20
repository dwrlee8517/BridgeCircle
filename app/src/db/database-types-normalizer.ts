export function normalizeGeneratedDatabaseTypes(source: string): string {
  const lines = source.split(/\r?\n/)
  const fieldIndex = lines.indexOf('  __InternalSupabase: {')

  if (fieldIndex >= 0) {
    const fieldEndIndex = lines.findIndex((line, index) => index > fieldIndex && line === '  }')
    if (fieldEndIndex < 0) {
      throw new Error('Generated __InternalSupabase metadata block is malformed')
    }

    let blockStartIndex = fieldIndex
    while (blockStartIndex > 0 && lines[blockStartIndex - 1]?.startsWith('  //')) {
      blockStartIndex -= 1
    }
    lines.splice(blockStartIndex, fieldEndIndex - blockStartIndex + 1)
  }

  return `${lines.join('\n').replace(/\n+$/u, '')}\n`
}
