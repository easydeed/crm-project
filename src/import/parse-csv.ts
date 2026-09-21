export function detectDelimiter(text: string): ',' | '\t' {
  const first = text.split(/\r?\n/).find((line) => line.trim())
  if (!first) return ','
  return first.includes('\t') ? '\t' : ','
}

export function parseDelimited(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!source.trim()) return []
  const delimiter = detectDelimiter(source)
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      quoted = true
      continue
    }
    if (ch === delimiter) {
      current.push(field.trim())
      field = ''
      continue
    }
    if (ch === '\n') {
      current.push(field.trim())
      field = ''
      if (current.some((cell) => cell.length > 0)) rows.push(current)
      current = []
      continue
    }
    field += ch
  }

  current.push(field.trim())
  if (current.some((cell) => cell.length > 0)) rows.push(current)
  return rows
}

export function csvEscape(value: string): string {
  if (/[",\n\t]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}
