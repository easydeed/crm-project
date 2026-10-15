# OR-051 — The cron route answers the method Vercel uses

Raised by the builder while scoping the hosted preview; the Director made it its own packet, to
run before OR-050.

```
TASK: OR-051
BRANCH: fix/cron-get

FINDING (verified against Vercel's documentation, 2026-10-15)
- vercel.com/docs/cron-jobs: "To trigger a cron job, Vercel makes an HTTP GET
  request to your project's production deployment URL, using the path
  provided in your project's vercel.json file."
- vercel.com/docs/cron-jobs/manage-cron-jobs: CRON_SECRET "will be
  automatically sent as an Authorization header"; "The authorization header
  will have the Bearer prefix."
- The same page: "The timezone is always UTC." Hobby invocations land "at any
  point within the specified hour". Delivery is best effort and can repeat a
  run: "cron jobs should be resilient to both missed runs and duplicate runs".
- src/app/api/cron/tick/route.ts exports POST only. Next answers a GET with
  405. So no Vercel cron has ever reached the job runner, in any
  environment, since OR-012: no scheduling, no compose, no send, no call
  lists. Nothing caught it: nothing has deployed, and the route's one test
  calls POST directly and checks only the refusal.

SCOPE
1. The route answers GET, which is what Vercel calls. POST stays for a
   manual run. Both go through the same handler and the same secret check
   (Authorization: Bearer, or x-cron-secret). The route is dynamic, never
   cached: a cached reply would skip the work.
2. Tests:
   - Every path in vercel.json's crons resolves to a route file that exports
     the method Vercel uses (GET).
   - A request shaped like Vercel's (GET, Authorization: Bearer
     $CRON_SECRET, x-vercel-cron-schedule, user-agent vercel-cron/1.0) runs
     the scheduler and the runner. They are mocked: no database.
   - The same GET with no secret, a wrong secret, or only the schedule
     header is a 404, and runs nothing.
3. GO_LIVE.md: CRON_SECRET must be set in the Vercel project. Crons call
   only the production deployment. Hobby lands anywhere in the hour. Runs
   can be missed or repeated, which the idempotent jobs already allow for.
   It goes at the end of the file, clear of OR-049's Vercel section.

NOT IN THIS PACKET
- The schedule (OR-049), the runner, the backoff and the limit.
- OR-050, the hosted demo.

ACCEPTANCE CRITERIA
1. Existing tests pass; the new tests pass, each proven both ways.
2. Measured against a running `next start` on the scratch database: GET with
   the bearer secret is 200, and so is POST; GET without it is 404. Before
   the fix, GET is 405.
3. Step 0 and the same-day comparison against main. The known unstable
   pair (people-bulk-bar, people-view-as, OR-049) is reported, not hidden.
4. pnpm verify; browser pass green.
5. Two deliberate breaks, each red in CI on its intended signal only, each
   reverted to an identical tree:
   - GET removed from the route: the method test is red.
   - The bearer check removed, leaving x-cron-secret only: the Vercel-shaped
     request test is red.
6. CI green before merge.
```
