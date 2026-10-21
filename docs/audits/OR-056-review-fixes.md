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
   Only a fresh pre-attempt hold reason is eligible: older generic stale errors
   might already have overwritten attempt history in #75, so they fail closed.
   Empty provider-error strings still count as history. Missing identity proof
   never produces the affirmative "No provider attempt was made" hold reason.
   Provider/guard failures receive a distinct stored prefix; a provider returning
   our hold sentence verbatim cannot mint an eligible pre-attempt hold.
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
   A persisted-details flag refreshes Settings after a partial phone save while
   retaining the billing error, so the uncontrolled input cannot reset to the old
   number. Provider read outages return the same honest partial-save state.
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
- The new shared visual harness explicitly captures known-bad main with baseline
  mode. Head defaults to strict assertions for the billing error and saved phone
  value. It waits for admin content/state and completed POST responses before
  capturing, so streaming placeholders and pre-action DOM cannot count as visual
  evidence. No existing browser test or comparison assertion changes.

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
before initialization and before every entitlement read; mismatches are not
silently charged or entitled. A matching legacy state initializes before its
configuration can change, so rejection/rollback still preserves provider truth.

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
have not been load-tested. The evidence harness adds six main/head captures
beyond the existing 73: ready/done admin sends, refused/success admin notices,
demo checkout, and the Settings panel after failed phone-change billing switch-off.
They are prepared through real login/forms against local fixture state and are
reported separately from the historical 73-state inventory. Recovery pages are
unchanged in this packet. Pixel counts are retained in the CI artifacts/PR report.

The initial parent/main capture measured the twenty requested states plus the
review queue's corrected "4 of 7" → "1 of 7" counter: 21 total. All are recorded
individually in `reskin-screen-log.md`, including the extra measured state.

API contracts consulted: [Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create)
and [subscription update](https://docs.stripe.com/api/subscriptions/update).
The branch exclusion follows [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration).
