import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { MAX_ATTEMPTS, retryDelayMs } from '@/jobs/backoff'
import { JOB_KINDS } from '@/jobs/types'

/**
 * OR-049. Vercel Hobby allows one cron run a day, so vercel.json carries a daily schedule for a
 * preview. The send pipeline was built for every-minute ticks, and on a daily one it is wrong, not
 * slower: GO_LIVE.md says so. This holds the two together both ways, and holds the note's numbers
 * to the code they describe, so neither the schedule, the note nor the runner can move alone.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8')
const EVERY_MINUTE = '* * * * *'
const HOBBY_NOTE = 'Vercel Hobby caps cron at one run per day.'

function tickSchedule(vercel: string) {
  const crons = (JSON.parse(vercel) as { crons?: { path: string; schedule: string }[] }).crons ?? []
  expect(crons.map((cron) => cron.path)).toEqual(['/api/cron/tick'])
  return crons[0]!.schedule
}

/** What GO_LIVE.md must say for a given schedule; empty when it is right. */
function drift(schedule: string, goLive: string) {
  const noted = goLive.includes(HOBBY_NOTE)
  if (schedule === EVERY_MINUTE) return noted ? ['GO_LIVE still describes a Hobby schedule vercel.json no longer carries'] : []
  const wrong: string[] = []
  if (!noted) wrong.push(`vercel.json runs "${schedule}" and GO_LIVE lacks the Hobby note`)
  else if (!goLive.includes(`\`vercel.json\` carries \`${schedule}\``)) wrong.push(`GO_LIVE names a schedule other than "${schedule}"`)
  return wrong
}

test('vercel.json and GO_LIVE agree: a schedule other than every minute is named and called wrong for production', () => {
  expect(drift(tickSchedule(read('vercel.json')), read('docs/GO_LIVE.md'))).toEqual([])
})

test('the drift check is red in each direction it guards', () => {
  const note = `${HOBBY_NOTE} \`vercel.json\` carries \`0 9 * * *\``
  expect(drift('0 9 * * *', note)).toEqual([])
  expect(drift('0 9 * * *', 'nothing about it')).toHaveLength(1)
  expect(drift('0 10 * * *', note)).toHaveLength(1)
  expect(drift(EVERY_MINUTE, note)).toHaveLength(1)
  expect(drift(EVERY_MINUTE, 'nothing about it')).toEqual([])
})

test("the Hobby note's numbers are the runner's: 36 minutes of backoff, three days of retries, 10 jobs a tick", () => {
  const goLive = read('docs/GO_LIVE.md')
  if (!goLive.includes(HOBBY_NOTE)) return
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  // The retries after the first attempt, and the minutes they wait for on a minute tick.
  const retries = MAX_ATTEMPTS - 1
  const minutes = Array.from({ length: retries }, (_, index) => retryDelayMs(index + 1)!).reduce((sum, ms) => sum + ms, 0) / 60_000
  expect(goLive).toContain(`retries stretch from ${minutes} minutes to ${words[retries]} days`)
  // The jobs a tick may run, and the accounts' sends that covers: each account needs a compose, a
  // send and a call list every month.
  const limit = Number(/const DEFAULT_LIMIT = (\d+)/.exec(read('src/app/api/cron/tick/route.ts'))?.[1])
  const perAccount = ['compose', 'send', 'build_call_lists'] as const
  for (const kind of perAccount) expect(JOB_KINDS).toContain(kind)
  expect(goLive).toContain(`the ${limit}-jobs-per-tick limit caps the service at roughly ${words[Math.floor(limit / perAccount.length)]} accounts' sends per day`)
})
