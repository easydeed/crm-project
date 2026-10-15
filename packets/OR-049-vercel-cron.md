# OR-049 — The Vercel Hobby cron: a preview-only schedule, written down as wrong for production

Approved by the Director: build on its own branch, alongside OR-048 (#67), which touches
different files.

```
TASK: OR-049
BRANCH: chore/vercel-cron

OBJECTIVE
Vercel Hobby rejects vercel.json's every-minute cron: it allows one run per
day. Change the schedule to 0 9 * * * so a preview deploys. Say plainly, in
GO_LIVE.md, that this schedule is wrong for production. Hold the two together
with a test.

WHAT A DAILY TICK DOES (measured from the code, OR-049 investigation)
- Vercel runs cron schedules in UTC. 0 9 * * * is 01:00 or 02:00 Pacific.
- A tick runs only jobs already due (run_after <= now). A send for the 1st at
  9:00 Pacific is enqueued with that time, and the 09:00 UTC tick on the 1st
  comes first. It goes out at the next tick, about 01:00 Pacific on the 2nd.
  The dashboard says the 1st. Compose and the call list shift the same way.
- The backoff (1m, 5m, 30m: src/jobs/backoff.ts) is a floor, not a schedule.
  Nothing runs between ticks, so a failing job is tried on days 0, 1, 2 and 3,
  then dead: three days, not 36 minutes.
- Each tick runs at most 10 due jobs (DEFAULT_LIMIT in the cron route, 50 at
  most with ?limit=). An account needs about three jobs a month (compose,
  send, call list): about three accounts' sends a day, a cap that arrives
  silently at the fourth customer.
- On a preview none of it is visible: SEND_ENABLED is false and the providers
  are fixtures. The schedule is wrong for production, not reduced.

SCOPE
1. vercel.json: "* * * * *" → "0 9 * * *". JSON holds no comment, so the
   explanation goes in GO_LIVE.md.
2. docs/GO_LIVE.md, a Vercel section, saying plainly:
     Vercel Hobby caps cron at one run per day. The send pipeline was built
     for every-minute ticks. On a daily tick every send goes out the day
     after the dashboard says it will, retries stretch from 36 minutes to
     three days, and the 10-jobs-per-tick limit caps the service at roughly
     three accounts' sends per day. Production requires Pro and a
     minute-by-minute schedule. This is not a soft preference.
   It names the schedule vercel.json carries now.
3. .vercelignore with reference/: the v0 export is 134 files (1.1MB) that
   nothing builds or reads.
4. A test, failing both ways:
   - vercel.json carries any schedule other than every-minute while GO_LIVE
     lacks the Hobby note: red.
   - GO_LIVE names a schedule vercel.json does not carry: red.
   - vercel.json is back to every-minute while GO_LIVE still carries the
     Hobby note: red. The note would describe a schedule that no longer
     exists.
   - The note's numbers come from the code: 36 minutes is the sum of the
     backoff, three days is the attempts after the first, 10 is the route's
     DEFAULT_LIMIT. A change to any of them without the note is red.

NOT IN THIS PACKET
- Vercel's production-branch setting. It is the project's, not the repo's.
- packets/OR-012.md's "vercel.json cron every minute". It records what was
  decided then.
- Any change to the runner, the backoff or the limit.

ACCEPTANCE CRITERIA
1. Every existing test passes; the new test passes, each property proven both
   ways.
2. Step 0 and the same-day comparison against main: 72 of 72 byte-identical.
3. Browser pass green.
4. No dependency, no schema change, no app code change.
5. Two deliberate breaks, each red in CI on its intended signal only, each
   reverted to an identical tree:
   - vercel.json's schedule changed without GO_LIVE: the cron test is red.
   - The Hobby note removed from GO_LIVE: the cron test is red.
6. pnpm verify passes, CI green before merge.
```
