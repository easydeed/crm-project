import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('settings loads a live preview under how the email looks', () => {
  const page = src('./page.tsx')
  expect(page).toContain('effectiveAccountId')
  expect(page).toContain('loadSettingsPreview(db, accountId')
  expect(page).toContain('AppearanceForm')
  expect(page).not.toContain('assertWritable')

  const form = src('./appearance-form.tsx')
  expect(form).toContain('How the email looks')
  // OR-046: the preview is its own framed panel after the form, not a column beside it (a ~304px
  // column would make Desktop and Phone render the same). The property that matters: it is the
  // form that renders it, fed by the form's live sender name and accent.
  expect(form.indexOf('<AppearancePreview')).toBeGreaterThan(form.indexOf('</form>'))
  expect(form).toMatch(/live=\{\{\s*sender: senderName\.trim\(\) \|\| account\.name,\s*accent: accentFrom\(accent\),/)
  expect(form).toContain('setSenderName')
  expect(form).toContain('setAccent')

  const preview = src('./appearance-preview.tsx')
  expect(preview).toContain('applyPreviewLook')
  expect(preview).toContain('SAMPLE_LABEL')
  expect(preview).toMatch(/<DigestPreviewPanel\s+framed/)
})

test('settings has four states', () => {
  expect(src('./loading.tsx')).toContain('Loading your settings')
  expect(src('./error.tsx')).toContain('couldn&apos;t load your settings')
  expect(src('./page.tsx')).toContain('We could not load your settings.')
})
