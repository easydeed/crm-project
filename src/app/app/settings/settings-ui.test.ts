import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('settings loads a live preview beside how the email looks', () => {
  const page = src('./page.tsx')
  expect(page).toContain('effectiveAccountId')
  expect(page).toContain('loadSettingsPreview(db, accountId')
  expect(page).toContain('AppearanceForm')
  expect(page).not.toContain('assertWritable')

  const form = src('./appearance-form.tsx')
  expect(form).toContain('How the email looks')
  expect(form).toContain('lg:grid-cols-2')
  expect(form).toContain('AppearancePreview')
  expect(form).toContain('setSenderName')
  expect(form).toContain('setAccent')

  const preview = src('./appearance-preview.tsx')
  expect(preview).toContain('applyPreviewLook')
  expect(preview).toContain('SAMPLE_LABEL')
})

test('settings has four states', () => {
  expect(src('./loading.tsx')).toContain('Loading your settings')
  expect(src('./error.tsx')).toContain('couldn&apos;t load your settings')
  expect(src('./page.tsx')).toContain('We could not load your settings.')
})
