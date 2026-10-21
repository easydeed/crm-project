import { readdirSync, readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { expect, test } from 'vitest'
import { CALL_TAGS } from '@/app/app/call-tags'
import { HomeStory } from '@/app/home-story'
import { SurveyEtch } from '@/app/marketing/etch'
import { sampleCalls } from '@/app/marketing/sample-calls'
import { planPrice } from '@/app/marketing/ui'
import { getAddonRegistry } from '@/addons/registry'
import { canonicalFacts, fullDigest } from '@/digest/canonical-facts'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

/** Every file the marketing page is made of (OR-053). */
const MARKETING_FILES = [
  './page.tsx',
  './home-story.tsx',
  './sample/page.tsx',
  ...readdirSync(new URL('./marketing/', import.meta.url))
    .filter((name) => /\.tsx?$/.test(name) && !/\.test\./.test(name))
    .map((name) => `./marketing/${name}`),
]

function homeMarkup() {
  return renderToStaticMarkup(HomeStory({ facts: canonicalFacts(), digest: fullDigest() }))
}

/** The page's words, without tags, the email's srcdoc, or entities. */
function homeWords() {
  return homeMarkup()
    .replace(/srcDoc="[^"]*"/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

test('marketing, sample, and the fixture share one Oakdale story', () => {
  const facts = canonicalFacts()
  expect(facts.address).toBe('1142 Oakdale Ave')
  expect(facts.firstName).toBe('Marilyn')
  expect(facts.owner).toBe('Marilyn Okafor')
  expect(facts.streetMedian).toBe('about $1,040,000')
  expect(facts.taxedOn).toBe('$817,800')
  expect(facts.benefit).toBe('about $2,600')
  expect(facts.listingAddress).toBe('1187 Oakdale Ave')
  expect(facts.deed).toEqual({ instrument: 'Grant deed', recorded: 'March 14, 2019', document: '2019-0248117', amount: '$712,000' })

  const result = fullDigest()
  expect(result.send).toBe(true)
  if (!result.send) return
  expect(result.text).toContain(facts.benefit)
  expect(result.text).toContain('Hi Marilyn,')
  // The deed on the page is the one the email's recorder stamp quotes.
  expect(result.text).toContain(`Document ${facts.deed.document}`)
  expect(result.text).toContain(`Consideration ${facts.deed.amount}`)

  expect(src('./page.tsx')).toMatch(/canonicalFacts\(\)[\s\S]*fullDigest\(\)/)
  expect(src('./marketing/the-note.tsx')).toMatch(/facts\.deed\.document[\s\S]*facts\.deed\.amount/)
  expect(src('./sample/page.tsx')).toContain('fullDigest')
  // The home page shows the real email, not a drawing of one.
  expect(homeMarkup()).toContain('title="Email preview"')
})

test('no figure on the marketing page is typed in: every price and amount comes from facts, the fixtures or costs.ts', () => {
  for (const file of MARKETING_FILES) {
    expect(src(file), file).not.toMatch(/\$\d|\d[\d,]*\s?(?:dollars|cents|¢)|\b\d{3,4}-\d{3}-\d{3}\b/i)
  }
  const words = homeWords()
  const facts = canonicalFacts()
  for (const figure of [planPrice, facts.deed.amount, facts.deed.document]) expect(words).toContain(figure)
})

/**
 * OR-052 §2: the claims the design made that the product does not keep. The words are checked on
 * the rendered page and in every source file it is made of.
 */
const NOT_BUILT: Array<[string, RegExp]> = [
  ['texting homeowners', /text(ing)? (my|your) clients|homeowners can text/i],
  ['an engagement signal', /reading it closely|opened your last|clicked the/i],
  // OR-054 found the county check back, as "We'll tell you at signup if your county isn't on yet":
  // no county check exists at signup. The apostrophe is matched however the source spells it.
  ['a county list and a county check', /los angeles, orange|we(?:'|&apos;|’)ll tell you at signup|not in yours yet|county isn(?:'|&apos;|’)t on/i],
  ['past clients from an MLS import', /past clients/i],
  ['an unmeasured setup time', /four minutes|\d+ minutes/i],
  ['no daily logins', /daily logins/i],
  ['the v0 export’s campaigns and weekly note', /campaign|weekly/i],
  // The note's footer is name, brokerage and DRE; it prints no phone number (OR-054).
  ['a phone number on every note', /dre and phone|name and number|phone on every note/i],
]

test.each(NOT_BUILT)('the marketing page does not claim %s (OR-052)', (_claim, pattern) => {
  expect(homeWords()).not.toMatch(pattern)
  for (const file of MARKETING_FILES) expect(src(file), file).not.toMatch(pattern)
})

test('the sample call list is the real signal code on its own fixtures: three reasons, each sentence its own house’s', () => {
  const calls = sampleCalls()
  expect(calls.map((call) => call.kind)).toEqual(['sold_nearby', 'loan_paid_off', 'tax_upside'])
  expect(new Set(calls.map((call) => call.address)).size).toBe(3)
  const words = homeWords()
  for (const call of calls) {
    expect(call.tag).toBe(CALL_TAGS[call.kind].label)
    expect(words).toContain(call.address)
    expect(words).toContain(call.detail)
  }
  // A recorded-sale tag carries a sale, never a listing.
  expect(calls[0]!.detail).toMatch(/ sold for /)
  expect(calls[0]!.detail).not.toMatch(/list/i)
})

/**
 * OR-054. The hero cards' "Call" bars are a picture of the call list's button, as v6 drew them, so
 * none is a link or a button that a visitor could take for a call. And no card puts the canonical
 * Marilyn, whose real email is on the page, on a house that is not hers.
 */
test('the hero cards draw Call, never offer it, and never put Marilyn on another house', () => {
  const markup = homeMarkup()
  const controls = [...markup.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]!.replace(/<[^>]+>/g, '').trim())
  expect(controls.filter((text) => /^call\b/i.test(text))).toEqual([])
  expect(markup).toMatch(/aria-hidden="true"[^>]*>Call /)
  const facts = canonicalFacts()
  for (const call of sampleCalls()) {
    if (call.name === facts.owner) expect(call.address, call.name).toBe(facts.address)
  }
})

/**
 * OR-054. Gold is #e4b65c on every scheme, 9.50:1 on navy and 1.88:1 on white or cream, so it may
 * only sit on the navy family. This walks the rendered page and, for each element painted gold,
 * finds the nearest background behind it.
 */
const NAVY = new Set(['bg-mkt-navy', 'bg-mkt-inset', 'bg-mkt-rule'])
const VOID = new Set(['br', 'img', 'input', 'meta', 'link', 'hr', 'source'])

function goldGrounds(markup: string) {
  const stack: Array<{ tag: string; bg: string | null }> = []
  const found: string[] = []
  for (const m of markup.replace(/srcDoc="[^"]*"/gi, '').matchAll(/<(\/?)([a-z0-9]+)([^>]*?)(\/?)>/gi)) {
    const [, close, tag, attrs] = m
    if (close) {
      while (stack.length && stack.pop()!.tag !== tag) {}
      continue
    }
    const cls = /class="([^"]*)"/.exec(attrs!)?.[1]?.split(/\s+/) ?? []
    const bg = cls.find((name) => /^bg-mkt-/.test(name)) ?? null
    if (cls.some((name) => /^(text|bg|border|decoration|outline)-mkt-gold$/.test(name))) {
      const ground = [...stack].reverse().find((entry) => entry.bg)?.bg ?? 'none'
      found.push(`${tag} on ${ground}`)
    }
    if (!VOID.has(tag!) && !m[4]) stack.push({ tag: tag!, bg })
  }
  return found
}

test('gold sits only on navy: never on cream or white (OR-054)', () => {
  const grounds = goldGrounds(homeMarkup())
  expect(grounds.length).toBeGreaterThan(10)
  expect(grounds.filter((entry) => !NAVY.has(entry.split(' on ')[1]!))).toEqual([])
  // The walk sees a ground: gold under cream is red.
  expect(goldGrounds('<div class="bg-mkt-cream"><p class="text-mkt-gold">x</p></div>')).toEqual(['p on bg-mkt-cream'])
})

/** The survey etch is decoration drawn by CSS: it holds no words for the clipping check to miss. */
test('the survey etch is aria-hidden and holds no text', () => {
  const markup = renderToStaticMarkup(SurveyEtch())
  expect(markup).toMatch(/^<div aria-hidden="true"/)
  expect(markup.replace(/<[^>]+>/g, '').trim()).toBe('')
  expect(markup.match(/data-etch="[^"]+"/g)).toHaveLength(4)
})

test('the add-ons are the ones the app sells, at its prices', () => {
  const words = homeWords()
  for (const addon of getAddonRegistry().list()) expect(words).toContain(addon.title)
  expect(src('./marketing/plan.tsx')).toContain('getAddonRegistry().list()')
})

/** The fan and the add-on switches are the only client pieces. Everything else is server-rendered. */
const CLIENT_FILES = ['./marketing/hero-cards.tsx', './marketing/addon-switches.tsx']

/**
 * Nothing on the page works only on hover, and every link takes a marketing class with `.tap`.
 * The fan also answers click and tap. No file uses an app button class.
 */
test('every marketing link takes a marketing class and .tap; the fan is not hover-only', () => {
  const shared = /\b(heroCtaClass|goldCtaClass|ctaClass|pillClass|navLinkClass|callBarClass)\b|`tap /
  for (const file of MARKETING_FILES.filter((name) => name.endsWith('.tsx'))) {
    const text = src(file)
    expect(text, file).not.toMatch(/hover:|from '@\/app\/app\/people\/ui'/)
    if (!CLIENT_FILES.includes(file)) expect(text, file).not.toMatch(/onMouse|onPointer|'use client'/)
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const links: string[] = []
    const visit = (node: ts.Node) => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === 'Link') {
        const className = node.attributes.properties.find(
          (prop): prop is ts.JsxAttribute => ts.isJsxAttribute(prop) && prop.name.getText(source) === 'className',
        )
        links.push(className?.initializer?.getText(source) ?? '(none)')
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
    for (const link of links) expect(link, file).toMatch(shared)
  }
})
