import { expect, test } from 'vitest'
import { scenarios } from '@/digest/fixtures/scenarios'
import { renderDigest } from '@/digest/render'

function factsFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

test('every scenario produces the expected send decision and block list', () => {
  for (const scenario of scenarios) {
    const result = renderDigest(scenario.input)
    expect(result.send, scenario.name).toBe(scenario.send)
    if (result.send) {
      expect(result.blocks, scenario.name).toEqual(scenario.blocks)
      expect(result.subject).toBeTruthy()
    } else {
      expect(result.reason).toMatch(/not enough/i)
    }
  }
})

test('html has no svg, script, or remote images', () => {
  for (const scenario of scenarios) {
    const result = renderDigest(scenario.input)
    if (!result.send) continue
    expect(result.html, scenario.name).not.toMatch(/<svg|<script/i)
    expect(result.html, scenario.name).not.toMatch(
      /<img[^>]+src=["']https?:\/\//i,
    )
    expect(result.html).toContain('color-scheme')
    expect(result.html).toContain('max-width:600px')
  }
})

test('the text part repeats every fact from the html', () => {
  for (const scenario of scenarios) {
    const result = renderDigest(scenario.input)
    if (!result.send) continue
    const facts = factsFromHtml(result.html)
    const numbers = facts.match(/\$[\d,]+|\b20\d{2}-\d{2}-\d{2}\b|\b20\d{6,}\b/g) ?? []
    for (const fact of numbers) {
      expect(result.text, `${scenario.name} ${fact}`).toContain(fact.replace(/,/g, ','))
    }
    expect(result.text).toContain('Morning, Marilyn.')
  }
})
