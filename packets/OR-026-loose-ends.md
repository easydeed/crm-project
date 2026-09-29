# OR-026 — loose ends

```
TASK: OR-026
BRANCH: fix/loose-ends

OBJECTIVE
Close the small gaps reported across S4 through S6 and left open.

WHY
Each is a dead control, a stated-but-undecided question, or a known
inaccuracy. Individually small; collectively the kind of thing that
becomes a launch checklist nobody finds.

SCOPE
- The items below, nothing else
- Out of scope: anything needing a new feature

DESIRED BEHAVIOR

1. "Contact us" is a dead control.
   The system-pause message on the dashboard opens a blank mailto. Point
   it at a real address with a prefilled subject naming the account:
     mailto:<support address>?subject=Paused%20account%20-%20<account id>
   Put the address in one config constant, not inline. If no support
   address exists yet, use the one Jerry provides; if he has not provided
   one, report BLOCKED rather than inventing an address.

2. subscriptions.account_id blocks account deletion.
   It is ON DELETE NO ACTION, so any account that ever subscribed cannot
   be deleted.

   DECISION: leave the constraint, and make the failure legible. A delete
   attempt on an account with a subscription row must fail with a clear
   reason, not a raw constraint error:
     "This account has billing history. Cancel in Stripe and remove the
     customer first."
   Deleting a former customer's local row while Stripe still holds the
   customer, invoices, and tax records creates a reconciliation problem
   nobody would notice for months. It stays a deliberate two-step.
   Record this in docs/ERASURE.md alongside the existing questions.

3. The "1187 Oakdale" canonical example.
   Confirm the fixture, /sample, and the marketing page all use the same
   figures: $712,000 recorded 2019-03-14 doc 2019-0248117, assessed
   $817,800, street median $1,040,000, benefit about $2,600, and 1187
   Oakdale appearing only as an active listing. Report any surface that
   disagrees. Fix the app surfaces; report marketing-page differences
   rather than editing them, since that page lives outside this repo.

4. Stripe go-live checklist — docs/GO_LIVE.md, specification only:
   - the sk_test_ enforcement in the gateway must be lifted by a packet
   - Stripe dashboard: subscription behavior on failed payment must move
     the subscription out of active, or past_due never fires
   - the four webhook event types must be configured on the endpoint
   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID in the
     deployed env
   - UNSUBSCRIBE_SECRET, APP_ORIGIN, MAIL_FROM_MONTHLY in the deployed
     env, or unsubscribe links fall back to localhost
   - SEND_ENABLED stays false until the S2 gate passes on real data
   Write it; do not do it.

5. Sweep for other dead controls.
   Every href, button, and action in /app and /admin: report any that
   goes nowhere, opens an empty target, or has no handler. Fix the
   trivial ones, list the rest.

ACCEPTANCE CRITERIA
1. The pause message links to a real address with a prefilled subject, or
   the packet reports BLOCKED for want of one
2. Deleting an account with billing history fails with the plain message,
   proven by test
3. Every app surface uses the canonical figures; disagreements are
   reported
4. docs/GO_LIVE.md exists and covers all six items
5. The dead-control sweep is reported in full, with the trivial ones fixed
6. pnpm verify passes, CI green before merge

DO NOT
- Invent a support address
- Change the subscriptions constraint
- Lift the sk_test_ enforcement
- Edit the marketing page
```

## Added by the Director after OR-022 through OR-025

```
7. Text delivery visibility. A call-list text that was claimed but never
   sent (blocked or transiently failed) currently leaves no trace for the
   agent. Admin: /admin/accounts/[id] shows this period's text_messages
   row with its state and error, so a support question is answerable.
   Agent: no change. Report whether a retry inside the same period is
   worth building later, and what would guard against double-sending.

8. Phone normalization. Signup stores the phone as typed; Settings stores
   bare digits. Normalize on write in both paths, backfill accounts.phone,
   and keep the read-side normalization as a belt-and-braces measure.
   Signup must not reject a number an existing agent could already have.

9. Signup makes two closedByAgent calls per agent. Cache the search result
   for 15 minutes so the import reads the cache (closing_searches table;
   delete rows older than an hour when writing). The server-side re-read
   stays; it must never trust the posted list.

10. Support address is help@onrecord.com. Put it in one config constant.

11. MLS framing (option 2, decided). CSV import is the sphere path; MLS
    import is a farming list. Record it in PROJECT_STATE.md, change the
    dashboard empty state and step 2's intro and found heading. Report the
    exact copy. Do not edit the marketing page.

Also: A2P 10DLC / toll-free registration in docs/GO_LIVE.md beside
TEXTING_ENABLED; the support mailbox must exist before launch; the
invariant checker scans untracked files in src/; the /u address input
gets box-sizing on desktop too, and the desktop baselines are recaptured.
```
