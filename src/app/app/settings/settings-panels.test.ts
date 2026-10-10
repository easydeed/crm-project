import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { attribute, byTag, classTokens, descendants, only, parseJsx, tagOf } from '@/test/jsx'

/** OR-046. Settings, Billing, Cancel and Add-ons on panels, asked as properties. */
const PANEL = ['border', 'border-rule', 'rounded-xl']
const STRIP = ['bg-surface', 'border-b', 'text-[19px]', 'font-semibold']

function panelsIn(file: string) {
  const jsx = parseJsx(file)
  return { jsx, panels: byTag(jsx, 'section').filter((element) => PANEL.every((token) => classTokens(jsx, element).includes(token))) }
}

test('every settings block is a panel titled in a --surface strip', () => {
  for (const [file, count] of [
    ['app/app/settings/details-form.tsx', 1],
    ['app/app/settings/phone-verification.tsx', 1],
    ['app/app/settings/appearance-form.tsx', 1],
    ['app/app/settings/sending-form.tsx', 1],
    ['app/app/settings/page.tsx', 1],
    ['app/app/settings/billing/page.tsx', 2],
    ['app/app/addons/addons-panel.tsx', 1],
  ] as const) {
    // Billing's no-plan panel is plain on purpose: its heading is the sentence, not a strip.
    const { jsx, panels } = panelsIn(file)
    const titled = panels.filter((panel) =>
      descendants(panel).some((element) => tagOf(jsx, element) === 'h2' && STRIP.every((token) => classTokens(jsx, element).includes(token))),
    )
    expect(titled, file).toHaveLength(count)
  }
})

test('the email preview is its own framed panel, rendered by the form that feeds it', () => {
  const preview = parseJsx('app/app/settings/appearance-preview.tsx')
  expect(attribute(preview, only(byTag(preview, 'DigestPreviewPanel'), 'preview'), 'framed')).toBeDefined()
  const form = parseJsx('app/app/settings/appearance-form.tsx')
  // Not inside the form's grid, and not in a column beside it.
  const rendered = only(byTag(form, 'AppearancePreview'), 'AppearancePreview')
  expect(descendants(only(byTag(form, 'form'), 'form'))).not.toContain(rendered)
  expect(readFileSync(new URL('./appearance-form.tsx', import.meta.url), 'utf8')).not.toMatch(/grid-cols-2[^"]*">\s*<form/)
})

test('accent swatches are 44px, and keep their colours and their names out of sight', () => {
  const jsx = parseJsx('app/app/settings/appearance-form.tsx')
  const swatch = only(byTag(jsx, 'span').filter((element) => attribute(jsx, element, 'title')), 'swatch')
  expect(classTokens(jsx, swatch)).toContain('size-11')
  expect(attribute(jsx, swatch, 'style')?.initializer?.getText(jsx.source)).toBe('{{ backgroundColor: color.value }}')
})

test('billing: the plan is a <dl> run flush to its panel, statuses stay words, invoice links are 44px', () => {
  const page = parseJsx('app/app/settings/billing/page.tsx')
  expect(byTag(page, 'dt')).toHaveLength(0)
  expect(attribute(page, only(byTag(page, 'DetailsTable'), 'plan table'), 'flush')).toBeDefined()
  const list = parseJsx('app/app/settings/billing/invoice-list.tsx')
  expect(classTokens(list, only(byTag(list, 'a'), 'invoice link'))).toEqual(expect.arrayContaining(['tap', 'ml-auto']))
  for (const file of ['./billing/page.tsx', './billing/invoice-list.tsx']) {
    // Colouring two statuses would make the rest read as neutral (OR-046, Decision C).
    expect(readFileSync(new URL(file, import.meta.url), 'utf8')).not.toMatch(/tagClass|STATUS_TAG|bg-green|text-green/)
  }
})

test('cancel: one plain panel with no strip', () => {
  const { jsx, panels } = panelsIn('app/app/settings/billing/cancel/page.tsx')
  const panel = only(panels, 'cancel panel')
  expect(descendants(panel).filter((element) => tagOf(jsx, element) === 'h2')).toHaveLength(0)
})

test('an add-on switched off reads as a choice: --foreground, never --border', () => {
  const jsx = parseJsx('app/app/addons/addon-switch.tsx')
  const track = only(byTag(jsx, 'span').filter((element) => classTokens(jsx, element).includes('rounded-full') && classTokens(jsx, element).includes('border-2')), 'track')
  expect(classTokens(jsx, track)).toEqual(expect.arrayContaining(['border-foreground', 'h-8', 'w-14']))
  const all = byTag(jsx, 'span').flatMap((element) => classTokens(jsx, element))
  expect(all.filter((token) => token.includes('border-border') || token.includes('bg-border'))).toEqual([])
})
