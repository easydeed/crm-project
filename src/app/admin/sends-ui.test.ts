import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('agents 404 on the admin layout that wraps sends', () => {
  const layout = src('./layout.tsx')
  expect(layout).toContain("session.role !== 'admin'")
  expect(layout).toContain('notFound()')
  expect(src('./sends/page.tsx')).toContain('listSendsForAdmin')
  expect(src('./deliverability/page.tsx')).toContain('loadDeliverabilityForAdmin')
})

test('the composed tab reads stored html and does not re-render', () => {
  const page = src('./sends/[id]/page.tsx')
  expect(page).toContain('srcDoc={reading.html}')
  expect(page).toContain('sandbox=""')
  expect(page).toContain('Re-run this send')
  expect(page).not.toContain('renderDigest')
  expect(page).toContain('Permanent')
  expect(page).toContain('Retriable')
  expect(page).toContain('{row.count}')
})

test('a failed run is marked and deliverability cannot lift a suppression', () => {
  expect(src('./sends/sends-table.tsx')).toContain('Needs a look')
  const board = src('./deliverability/page.tsx')
  expect(board).toContain('Unpause account')
  expect(board).toContain('Suppression list')
  expect(board).not.toMatch(/\.delete\(|remove suppression|lift/i)
})

test('a system pause tells the agent what happened, without blame', () => {
  const card = src('../app/home-card.tsx')
  const system = card.slice(card.indexOf("kind === 'system-paused'"), card.indexOf("kind === 'paused'"))
  expect(system).toContain('We paused your monthly note.')
  expect(system).toContain('A few people marked it as spam, so we stopped to protect everyone')
  expect(system).toContain('Contact us')
  expect(system).not.toContain('Unpause')
  expect(system).not.toMatch(/complaint rate|threshold|your fault|bought|suppression/i)
})
