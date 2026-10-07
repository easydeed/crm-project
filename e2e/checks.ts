import { expect, type Page } from '@playwright/test'
import { TAP_DEBT } from './tap-allowlist'

export type Problem = { rule: string; what: string }

/**
 * The layout rules every screen must pass, measured in the page:
 * - no horizontal page scroll;
 * - on a phone, every tappable control at least 44px in its smaller dimension (WCAG 2.5.8: a link
 *   inside a sentence is exempt; a checkbox or radio is measured by its label). A link standing on
 *   its own that is still under 44px must be listed, with its owner, in tap-allowlist.ts;
 * - no text under 15px (the rendered email lives in an iframe and is not measured);
 * - no text cut off by an element that hides its overflow, and nothing past the right edge.
 */
export async function layoutProblems(page: Page, { tapTargets, screen }: { tapTargets: boolean; screen?: string }): Promise<Problem[]> {
  const debt = TAP_DEBT.filter((entry) => screen !== undefined && entry.screens.includes(screen)).map((entry) => entry.href)
  return page.evaluate(({ checkTaps, debt }) => {
    const problems: { rule: string; what: string }[] = []
    // A phone widens its layout viewport to fit content that is too wide, so innerWidth grows
    // with the page. clientWidth stays at the device width the page must fit.
    const doc = document.documentElement
    const vw = doc.clientWidth
    if (doc.scrollWidth > vw) problems.push({ rule: 'no-horizontal-scroll', what: `scrollWidth ${doc.scrollWidth} > ${vw}` })
    if (window.innerWidth > vw) problems.push({ rule: 'no-horizontal-scroll', what: `layout viewport widened to ${window.innerWidth}` })

    const visible = (el: Element) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
    }
    const describe = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} "${(el.textContent ?? '').trim().slice(0, 40) || el.getAttribute('aria-label') || el.getAttribute('name') || ''}"`
    // Inline means inside a sentence: the link's own parent holds words outside it (OR-041). The
    // earlier test asked whether the nearest block held any other text, which every link placed
    // in a page column passed, standalone or not.
    const isInlineLink = (el: Element) =>
      el.tagName === 'A' &&
      [...(el.parentElement?.childNodes ?? [])].some((node) => node.nodeType === Node.TEXT_NODE && /[A-Za-z]/.test(node.textContent ?? ''))
    const owed = debt.map((source) => ({ re: new RegExp(source), matched: 0 }))

    const tappables = document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=switch], [role=button], summary')
    for (const el of checkTaps ? tappables : []) {
      if (isInlineLink(el)) continue
      let target: Element = el
      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) target = el.closest('label') ?? el
      // A visually hidden input is tapped through its label; only skip it when there is none.
      if (target.closest('.sr-only') || !visible(target)) continue
      const r = target.getBoundingClientRect()
      if (Math.min(r.width, r.height) >= 44 - 0.5) continue
      const href = el.tagName === 'A' ? new URL((el as HTMLAnchorElement).href).pathname : null
      const entry = href === null ? undefined : owed.find((item) => item.re.test(href))
      if (entry) entry.matched++
      else problems.push({ rule: 'tap-44', what: `${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)}` })
    }
    for (const item of owed) {
      if (checkTaps && item.matched === 0) problems.push({ rule: 'tap-44', what: `tap-allowlist entry ${item.re.source} matches nothing here: its links are fixed, delete the entry` })
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set<Element>()
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement
      if (!el || seen.has(el) || !(node.textContent ?? '').trim()) continue
      seen.add(el)
      if (el.closest('.sr-only, script, style, noscript') || !visible(el)) continue
      const size = parseFloat(getComputedStyle(el).fontSize)
      if (size < 15) problems.push({ rule: 'text-15', what: `${describe(el)} ${size}px` })
      const r = el.getBoundingClientRect()
      if (r.right > vw + 0.5) problems.push({ rule: 'no-clipping', what: `${describe(el)} ends at ${Math.round(r.right)}px` })
    }

    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el)
      if (!['hidden', 'clip'].includes(s.overflowX) || !visible(el) || el.closest('.sr-only')) continue
      if (el.scrollWidth > el.clientWidth + 1 && (el.textContent ?? '').trim()) problems.push({ rule: 'no-clipping', what: `${describe(el)} hides ${el.scrollWidth - el.clientWidth}px` })
    }
    return problems
  }, { checkTaps: tapTargets, debt })
}

/** Tap targets are a touch rule: checked on the phone viewport, where the buyer taps. Desktop keeps its layout. */
export async function expectCleanLayout(page: Page, { tapTargets, screen }: { tapTargets: boolean; screen?: string }) {
  expect(await layoutProblems(page, { tapTargets, screen })).toEqual([])
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBe(page.viewportSize()?.width)
}
