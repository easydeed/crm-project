import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

/**
 * Colours in markup that predate the tokens (OR-028). Each is an expected failure: it passes
 * while the literal is still there. When a screen packet replaces one with a token, its test
 * goes red, and the packet deletes the entry. An empty list means the debt is paid.
 *
 * Input outlines at 20% of the text colour are about 1.5:1, under the 3:1 a control boundary
 * needs; --border replaces them. The hex values pass contrast but bypass the tokens.
 */
const DEBT: Array<{ file: string; literal: string; why: string }> = [
  { file: 'app/people/ui.ts', literal: 'border-foreground/20', why: 'input outline ~1.5:1, use --border' },
  { file: 'app/settings/field.tsx', literal: 'border-foreground/20', why: 'input outline ~1.5:1, use --border' },
  { file: 'app/people/import/import-form.tsx', literal: 'border-foreground/20', why: 'input outline ~1.5:1, use --border' },
  { file: 'app/people/import/column-mapping.tsx', literal: 'border-foreground/20', why: 'select outline ~1.5:1, use --border' },
  { file: 'login/login-form.tsx', literal: 'border-foreground/20', why: 'input outline ~1.5:1, use --border' },
  { file: 'register/register-form.tsx', literal: 'border-foreground/20', why: 'input outline ~1.5:1, use --border' },
  { file: 'admin/accounts/search.tsx', literal: 'border-foreground/20', why: 'input outline ~1.5:1, use --border' },
  { file: 'admin/matching/filters.tsx', literal: 'border-foreground/20', why: 'select outline ~1.5:1, use --border' },
  { file: 'admin/sends/filters.tsx', literal: 'border-foreground/20', why: 'select outline ~1.5:1, use --border' },
  { file: 'app/people/ui.ts', literal: '#3d3d3d', why: 'muted text, use --muted-ink' },
  { file: 'app/call-entry.tsx', literal: '#3d3d3d', why: 'called-name text, use --muted-ink' },
  { file: 'app/call-tags.ts', literal: '#9c3a1f', why: 'coral tag, use --coral-text on --coral-soft' },
  { file: 'app/call-tags.ts', literal: '#1d6336', why: 'green tag, use --green-text on --green-soft' },
  { file: 'app/call-tags.ts', literal: '#1c4a82', why: 'blue tag, use --foreground on --blue-soft' },
  { file: 'app/call-tags.ts', literal: '#3d3d3d', why: 'grey tag, use --muted-ink on --surface' },
  { file: 'admin/sends/sends-table.tsx', literal: '#f4e4e1', why: 'trouble row tint, use --coral-soft' },
]

const src = (file: string) => readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')

for (const { file, literal, why } of DEBT) {
  // Read outside the test, so a moved or deleted file is an error rather than a quiet pass.
  const text = src(file)
  test.fails(`${file} still hard-codes ${literal} (${why})`, () => {
    expect(text).not.toContain(literal)
  })
}
