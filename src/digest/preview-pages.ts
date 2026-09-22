import type { ContentBlockName, DigestResult } from '@/digest/types'

export type PreviewIndexRow = {
  name: string
  file: string
  send: boolean
  blocks: ContentBlockName[]
  reason?: string
}

export function scenarioFileName(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.html`
}

export function skipPageHtml(reason: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skipped</title>
</head>
<body style="margin:24px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;color:#1a1a1a;">
<p>${escapeIndex(reason)}</p>
</body>
</html>
`
}

export function previewIndexHtml(rows: PreviewIndexRow[]) {
  const body = rows
    .map((row) => {
      const decision = row.send ? 'Send' : 'Skip'
      const blocks = row.blocks.length ? row.blocks.join(', ') : '—'
      const reason = row.reason ?? '—'
      return `<tr>
<td><a href="${escapeIndex(row.file)}">${escapeIndex(row.name)}</a></td>
<td>${decision}</td>
<td>${escapeIndex(blocks)}</td>
<td>${escapeIndex(reason)}</td>
</tr>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Digest preview</title>
</head>
<body style="margin:24px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
<h1 style="font-size:22px;">Digest preview</h1>
<table style="border-collapse:collapse;font-size:16px;">
<thead>
<tr>
<th style="text-align:left;padding:8px;border-bottom:1px solid #c9bfae;">Scenario</th>
<th style="text-align:left;padding:8px;border-bottom:1px solid #c9bfae;">Send</th>
<th style="text-align:left;padding:8px;border-bottom:1px solid #c9bfae;">Blocks</th>
<th style="text-align:left;padding:8px;border-bottom:1px solid #c9bfae;">Skip reason</th>
</tr>
</thead>
<tbody>
${body}
</tbody>
</table>
</body>
</html>
`
}

function escapeIndex(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function previewFileBody(result: DigestResult) {
  if (result.send) return result.html
  return skipPageHtml(result.reason)
}
