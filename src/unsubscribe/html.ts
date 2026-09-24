import { signUnsubscribeToken, type UnsubscribeScope } from '@/unsubscribe/token'
import type { UnsubscribeView } from '@/unsubscribe/load'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function scopeLabel(scope: UnsubscribeScope) {
  return scope === 'weekly' ? 'Stop the weekly note' : 'Stop these emails'
}

export function renderUnsubscribeHtml(view: UnsubscribeView, token: string) {
  const address = escapeHtml(view.propertyAddress)
  const notice = view.notice ? `<p>${escapeHtml(view.notice)}</p>` : ''
  const active = view.scopes.filter((row) => row.active)
  const showWeekly = active.some((row) => row.scope === 'weekly')
  const choices = showWeekly ? active : active.filter((row) => row.scope === view.scope)
  const stopForms = view.blocked
    ? ''
    : choices
        .map((row) => {
          const action = `/u/${signUnsubscribeToken(view.contactId, row.scope)}`
          return `<form method="post" action="${action}">
<input type="hidden" name="intent" value="stop" />
<button type="submit">${escapeHtml(scopeLabel(row.scope))}</button>
</form>`
        })
        .join('')
  const undo =
    // Only a homeowner's own unsubscribe can be undone. A bounce or complaint never can.
    !view.blocked && (!view.suppressed || view.reversible) && !active.some((row) => row.scope === view.scope)
      ? `<form method="post" action="/u/${escapeHtml(token)}">
<input type="hidden" name="intent" value="keep" />
<button type="submit">Actually, keep them coming</button>
</form>`
      : ''
  const blocked = view.blocked
    ? `<p>This address stopped accepting our email. Ask ${escapeHtml(view.agentName)} to add a different one.</p>`
    : ''
  const update = view.blocked
    ? ''
    : `<form method="post" action="/u/${escapeHtml(token)}">
<input type="hidden" name="intent" value="update" />
<label>Address
<input name="address" value="${escapeHtml(view.addressRaw)}" autocomplete="street-address" />
</label>
<button type="submit">Update my address</button>
</form>
<p>Moved? Tell us where and we'll switch to your new home.</p>`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Your email</title>
<style>
  body { margin: 0; padding: 32px 16px; background: #fff; color: #0E1729; font: 16px/1.45 Georgia, serif; }
  main { max-width: 32rem; margin: 0 auto; }
  h1 { font-size: 22px; font-weight: 600; margin: 0 0 12px; }
  p, label, button { font-size: 16px; }
  input { display: block; width: 100%; margin-top: 8px; font: 16px Georgia, serif; padding: 8px; }
  button { margin-top: 16px; font: 16px Georgia, serif; padding: 8px 12px; }
  button:focus-visible, input:focus-visible, a:focus-visible { outline: 2px solid #0E1729; outline-offset: 2px; }
  form:first-of-type button { font-size: 18px; font-weight: 600; }
</style>
</head>
<body>
<main>
<h1>${address}</h1>
${notice}
${blocked}
${update}
${stopForms}
${undo}
</main>
</body>
</html>`
}
