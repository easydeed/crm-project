# OR-056 — Fix forward from PR #75's independent review

Base: `1088036`, 2026-10-21. Owner requested a draft PR only, no merge, no
ready transition, and no deployment. Other editors remain paused.

## Findings and design

1. **Activation pricing.** Demo activation calculates the current total inside the
   same account lock/transaction as activation. Stripe Checkout has a fixed quote:
   a durable queue hold prevents paid switches until Stripe confirms completion or
   expiry. Reopening checkout reuses its session. A completed session can populate
   the trusted cache without waiting for its webhook. Ambiguous session creation
   fails closed instead of opening another checkout or releasing its quote.
2. **Admin recomposition.** Finished sends are refused. An active send rebuilds only
   fingerprinted rows held before their first attempt; uncertain receipts and newly
   eligible contacts are untouched. Previous provider refusals keep their history
   after an edit, so they cannot become a never-attempted stale-content hold.
   Delivery and recomposition share an operation lock, avoiding a worker finishing
   the batch while support replaces a recipient. Deleted contacts' historical
   receipts are excluded from rebuilds. The admin page reports a completed rebuild
   or an explicit refusal instead of silently redirecting after no change.
3. **External transaction safety.** DB configuration commits before provider
   mutation. Paid entitlement and recurring price are written in one Stripe
   subscription update and read from that same provider object. A DB proposal is
   never an active paid entitlement by itself. Rejection or a lost response reports
   an unconfirmed change; reads reflect provider truth. Dedicated direct-session
   advisory locks span the DB commit and provider operation; no session lock is put
   on a transaction pooler. The demo retains its single-database atomic update.
4. **Texting failures.** Phone-change Settings returns an error without a success
   timestamp/notice when billing switch-off fails. STOP clears verification first,
   propagates switch-off failure, and keeps unverified owners discoverable for a
   webhook retry. All owners are processed before any failure is propagated.
5. **Redirects.** Reject backslashes, off-site origins, control characters, escaped
   delimiters, and malformed escapes. Preserve ordinary local paths/query/hash.
6. **Consent/deletion race coverage.** Tests compose first, then unsubscribe or
   soft-delete through the write abstraction, then prove no provider call occurs.
   Send history remains intact.

## Existing tests changed

- `src/jobs/audit-safety.integration.test.ts`: the support recovery fixture now
  explicitly represents a ready, unfinished batch. It previously expected a
  finished send to reopen, contrary to finding 2. Every existing assertion remains;
  new tests independently require refusal of done/skipped sends and limit active
  recomposition to its held target set.
- `src/billing/subscription-fixture.ts` (test-only helper): paying fixtures now
  declare the base price and empty paid-feature set. Unknown prices must not be
  treated as permission to initialize or change a real plan's price.
- No existing test assertion, threshold, skip, or source guard was relaxed.
- The existing self-review runner gains review probes and selects unit/integration
  projects from suite suffixes so the new redirect suite is actually executed.

## Evidence plan

Full local and Linux verification, real mobile/desktop browser checks, and exact
pixel comparison on one Linux runner. The desktop evidence job captures `775f7d0`,
`1088036` twice for stability, and this branch, each with a fresh fixture seed.
It reports every differing decoded pixel with no masks or tolerances. Five tests
prove PNG filters 0–4 decode consistently and a one-pixel marketing change fails.
It then runs the existing, unchanged `desktop-unchanged.spec.ts`: fresh main
baselines first, copied to the branch, followed by the branch comparison. A
nonzero strict-comparison exit fails the evidence job and is retained for review.

Every finding has an intentional regression probe: frozen demo price, open Stripe
quote, Stripe before commit, DB entitlement fallback, ignored phone/STOP errors,
off-site redirect, reopening finished sends, widening recomposition, discarding
attempt history, late unsubscribe, and late deletion. The runner requires the
intended assertion failure and restores exact source bytes afterward.

## Beyond the six findings

- Required screen logs, instability log, and production demo-env checklist.
- Branch-specific Vercel deployment exclusion to enforce "do not deploy".
- A dedicated screenshot-evidence workflow, exact PNG comparator and its tests.
- Demo confirmation copy now describes activation-time choices truthfully.
- Shared cache writer avoids two implementations of provider-confirmed cache data.

## Limits to report honestly

There is no distributed DB/Stripe transaction. The repair removes duplicated
authoritative entitlement, rather than promising an impossible cross-system
rollback. A provider outage makes paid-state reads fail visibly. External manual
changes that split metadata and price fail closed and require reconciliation.
Legacy priced subscriptions with no metadata require a matching existing total
before initialization; mismatches are not silently charged or entitled.

Ambiguous Checkout creation before its session ID is saved keeps a durable hold
for support/provider reconciliation. No automatic repeat charge is attempted.
Actual test-mode Stripe HTTP calls remain to be exercised by an authorized
integration task; these tests use provider fakes and mocked transport, never a
live key, payment, email, SMS, or remote DB.

## Builder's second-pass review

Re-read the staged production diff, test changes, and evidence harness as a
reviewer. Checked lock ordering, source-of-truth reads after rejection/unknown
outcome, quote ownership, durable holds, callback rollback, stale cached status,
recipient scope, historical/deleted receipts, and STOP retry behavior.

Production connectivity and connection limits for dedicated direct-session locks
have not been load-tested. The existing 73-state pixel suite does not capture
admin send details or the newer demo checkout/recovery pages; the demo flow runs
through real forms in the browser suite and admin rebuild semantics have DB tests.
Do not describe those uncaptured pages as pixel-identical. Pixel counts and the
OR-055 screen inventory will be recorded from the same-runner artifacts.

API contracts consulted: [Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create)
and [subscription update](https://docs.stripe.com/api/subscriptions/update).
The branch exclusion follows [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration).
