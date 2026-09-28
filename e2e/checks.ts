import { expect, type Page } from '@playwright/test'

export type Problem = { rule: string; what: string }

/**
 * The layout rules every screen must pass, measured in the page:
 * - no horizontal page scroll;
 * - on a phone, every tappable control at least 44px in its smaller dimension (WCAG 2.5.8: a link
 *   inside a line of text is exempt; a checkbox or radio is measured by its label);
 * - no text under 15px (the rendered email lives in an iframe and is not measured);
 * - no text cut off by an element that hides its overflow, and nothing past the right edge.
 */
export async function layoutProblems(page: Page, { tapTargets }: { tapTargets: boolean }): Promise<Problem[]> {
  return page.evaluate((checkTaps) => {
    const problems: { rule: string; what: string }[] = []
    const vw = window.innerWidth
    const doc = document.documentElement
    if (doc.scrollWidth > vw) problems.push({ rule: 'no-horizontal-scroll', what: `scrollWidth ${doc.scrollWidth} > ${vw}` })

    const visible = (el: Element) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
    }
    const describe = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} "${(el.textContent ?? '').trim().slice(0, 40) || el.getAttribute('aria-label') || el.getAttribute('name') || ''}"`
    const blockOf = (el: Element) => {
      let node: Element | null = el.parentElement
      while (node && getComputedStyle(node).display.startsWith('inline')) node = node.parentElement
      return node
    }
    const isInlineLink = (el: Element) => {
      if (el.tagName !== 'A') return false
      const block = blockOf(el)
      const own = (el.textContent ?? '').trim()
      return Boolean(block && (block.textContent ?? '').trim().length > own.length + 1)
    }

    const tappables = document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=switch], [role=button], summary')
    for (const el of checkTaps ? tappables : []) {
      if (isInlineLink(el)) continue
      let target: Element = el
      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) target = el.closest('label') ?? el
      // A visually hidden input is tapped through its label; only skip it when there is none.
      if (target.closest('.sr-only') || !visible(target)) continue
      const r = target.getBoundingClientRect()
      if (Math.min(r.width, r.height) < 44 - 0.5) problems.push({ rule: 'tap-44', what: `${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)}` })
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
  }, tapTargets)
}

/** Tap targets are a touch rule: checked on the phone viewport, where the buyer taps. Desktop keeps its layout. */
export async function expectCleanLayout(page: Page, { tapTargets }: { tapTargets: boolean }) {
  expect(await layoutProblems(page, { tapTargets })).toEqual([])
  const { scrollWidth, width } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: window.innerWidth }))
  expect(scrollWidth).toBe(width)
}
