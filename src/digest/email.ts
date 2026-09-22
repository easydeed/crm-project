import { BODY_FONT, ink, paper } from '@/digest/style'
import { escapeHtml } from '@/digest/format'

export function wrapEmail(subject: string, rows: string[], accent: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<style type="text/css">
:root { color-scheme: light dark; }
</style>
</head>
<body style="margin:0;background:${paper};color:${ink};font-family:${BODY_FONT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper};">
<tr><td align="center" style="padding:16px 8px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${paper};border:1px solid ${accent};">
${rows.join('\n')}
</table>
</td></tr>
</table>
</body>
</html>`
}
