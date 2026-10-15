# OR-050 — A hosted demo on crm-preview, behind a guard that checks what the database holds

Approved by the Director as drafted. The three decisions are the Director's (OR-050 review):
the demo-seed script with the double guard, an env-supplied password plus Deployment Protection
with the demo moved off `main`, and no admin agent on the hosted demo. Runs after OR-051.

```
TASK: OR-050
BRANCH: feat/hosted-demo

OBJECTIVE
Jerry can sign in to a hosted preview of the app interior, on demo data, with nothing local-only
weakened and nothing able to reach crm-dev or crm.

SCOPE
1. scripts/demo-seed.ts: a new entry point. seed.ts and e2e-setup.ts keep their local-only
   guard, unchanged.
   - The guard checks names first:
     - DATABASE_URL must contain DEMO_PROJECT_REF, which the operator sets.
     - It must not contain the crm ref (already in src/config/database-url.ts).
     - It must not contain DEMO_REFUSED_REFS, crm-dev's ref if Jerry supplies it.
   - Then it checks what the database holds. It refuses if any account exists whose email is
     not one of the demo agents'. crm-dev holds real accounts, so it is refused whatever its
     URL says. The seed truncates every table, so this is the check that matters.
   - DEMO_AGENT_PASSWORD is required, is at least 16 characters, and must not be the local e2e
     constant. It is never committed; Jerry gets it privately. The demo emails are public in
     the repo, so this password is the only secret.
   - It reuses the seed and the agents builder, without the admin agent (decision 3). The
     admin is seeded locally only.
   - It runs the same expects check e2e-setup runs. Setup fails if a demo agent stops showing
     its state.
   - The live events are dated from the day it runs, so reseeding every few weeks keeps the
     call tags current. The README says so.
2. ONRECORD_DEMO=1: the hosted demo's billing stand-in.
   - It is honoured only when DATABASE_POOLER_URL contains DEMO_PROJECT_REF and not the crm
     ref. Otherwise the app uses StripeGateway, as now.
   - With the stand-in, each demo agent's billing state shows as it does locally.
   - GO_LIVE: ONRECORD_DEMO is never set on the production project.
3. Where it deploys (decision 2): a branch deploy, never main.
   - Vercel's production branch stays main and production stays empty until something is
     promoted deliberately.
   - The demo is a Preview deployment, so VERCEL_ENV is "preview" and Deployment Protection
     covers it.
   - Crons call production only (vercel.com/docs/cron-jobs), so the demo never runs the job
     runner. That is correct: SEND_ENABLED is off and nothing should be scheduled.
4. Two records the Director asked to ride with this packet:
   - docs/audits/check-findings.md gains #17, under "compared against the wrong thing":
     - The cron route's only test called POST directly and checked only the refusal.
     - It tested the handler that existed, not the contract the platform requires (Vercel
       calls GET, with a Bearer header).
     - Held now by src/app/api/cron/tick/route.test.ts "every cron path in vercel.json is a
       route that answers the method Vercel calls it with" (OR-051).
     The citation test's count of findings moves from 16 to 17.
   - docs/ui-spec/05-open.md gains a numbered entry: people-bulk-bar (and people-view-as) are
     unstable captures.
     - One anti-aliased pixel at the sticky navy bar's corner differs between browser
       processes on the same build and data.
     - It is reproducible: step 0 failed on it in OR-049 and again in OR-051.
     - It is unresolved, and a flaky capture erodes the exactness the comparison method
       depends on.
     - What is measured: across five runs on one build and one database, the bar's position
       is identical. Only one corner pixel, over the panel's right border, differs. A
       fractional move would change every edge pixel of the bar, so the evidence points at
       rasterization varying between browser processes, not layout.
     - What is suspected: the sticky bar, composited over the border.
     - The options from the OR-049 report are listed there. It is worth chasing soon: the pixel
       comparison is the main instrument for the re-skin.
5. README demo section, and a line for Jerry: Vercel's first green deploy of main is the
   production deployment. Production exists, with no data and no CRON_SECRET, so nothing runs.
   It stays an empty placeholder until something is promoted deliberately. CRON_SECRET stays
   unset on production (Director, OR-051 review).
6. The preview's env, documented in the README's demo section:
   - DATABASE_POOLER_URL: crm-preview's transaction pooler, port 6543.
   - SESSION_SECRET, UNSUBSCRIBE_SECRET, APP_ORIGIN.
   - ONRECORD_DEMO=1 and DEMO_PROJECT_REF.
   - Left unset on purpose, each with its reason: SEND_ENABLED, TEXTING_ENABLED, STRIPE_*,
     POSTMARK_*, TWILIO_*, CRON_SECRET.

TESTS (each proven both ways)
- demo-seed's guard, as a pure function over (url, refs, accounts in the database, password):
  - refuses the crm ref
  - refuses a ref other than DEMO_PROJECT_REF
  - refuses a database holding a non-demo account
  - refuses a missing, short or local-constant password
  - accepts an empty database, and one holding only demo accounts
- The admin agent is not in the demo set.
- ONRECORD_DEMO picks the stand-in only with the demo ref, never with the crm ref or with
  none.
- seed.ts and e2e-setup.ts keep their local-only guard. A source test fails if either imports
  the demo guard or loses isLocalDatabaseUrl.
- The register holds 17 findings, each citing a test that exists (the OR-048 citation test,
  with its count moved).

THEN, WITH CREDENTIALS (a new session with PREVIEW_DATABASE_URL, or Jerry running it)
- pnpm db:migrate against crm-preview; pnpm db:drift against a from-zero build: no drift.
- pnpm demo-seed against crm-preview.
- Sign in on the branch's preview URL as at least three agents (Dana, past due, groups), and
  report what each shows. If Deployment Protection is on, this needs a protection-bypass token
  as an environment secret.

ACCEPTANCE CRITERIA
1. Existing tests pass; the new ones pass, each proven both ways.
2. Step 0 and the same-day comparison: no capture changes. The known unstable pair is reported.
3. pnpm verify; browser pass green.
4. No change to seed.ts's or e2e-setup.ts's guard. No schema change. No dependency.
5. Two deliberate breaks, each red in CI on its intended signal only, each reverted to an
   identical tree:
   - The content check removed from demo-seed: the guard test is red.
   - ONRECORD_DEMO honoured without the ref: the billing-selection test is red.
6. The live sign-in is reported with what each agent shows, or NOT PROVEN with the reason.

DO NOT
- Point anything at crm-dev or crm, or make demo-seed able to run against either.
- Commit the demo password, or show it on any page.
- Deploy the demo from main.
- Seed the admin agent on the hosted demo.
```

## Order and dependencies

- Runs after #68 (OR-049), #69 (OR-051) and #67 (OR-048) merge. The register and its citation
  test arrive with #67.
- Then 05-open #31, the missed send-day tick, gets its own packet before any real send.
