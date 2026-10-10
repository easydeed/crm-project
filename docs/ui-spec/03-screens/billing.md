# Billing — `/app/settings/billing`

**Capture:** billing (390 and 1440)

## What the agent came here to do

See what they pay and when, which card is on file, and past invoices; then do the one thing their
plan's state allows: start it, cancel it, keep it after cancelling, restart it, or pay a failed
invoice. Everything comes from Stripe at page load (`src/billing/account-billing.ts:25-42`), so a
cancel or resume shows the moment it happens. There is no Stripe Customer Portal on purpose
(`packets/OR-018-billing.md`: "no Customer Portal, no offer, no survey").

## Layout
Since OR-046: a 760px column with the same margins and gaps as Settings.

1. The "Settings" back link (44px on phones), then `<h1>` "Billing", then any notice.
   - The link keeps its words; the design's "←" was refused.
2. **No plan**: one plain panel.
   - Its heading is the sentence "You don't have a plan yet.", not a strip.
   - Then the plan line and "Start your plan".
3. **Your plan**: a panel with a strip.
   - The rows are the shared `DetailsTable` with `flush`: a `<dl>` running to the panel's edges.
     Labels sit in a 120px (160px from `sm`) `--surface` column in muted ink.
   - Rows: Plan, Status, then Next charge or Ends, then Card.
   - Statuses stay plain words. The design coloured "Active" and "Paid" green and said nothing
     about the other states, so no status is coloured (OR-046, Decision C).
   - The plan action sits in a footer under a `--rule`. It is one of:
     - "Cancel my plan"
     - "Keep my plan"
     - the past-due sentence
     - "Restart your plan"
4. **Invoices**: a panel with a strip.
   - Each row, divided by `--rule`: date · amount (semibold) · status · link.
   - The link is pushed right. Standing alone, it is 44px on a phone (`.tap`).
   - "No invoices yet…" when there are none.

## Controls

| Label (quoted) | What it does | Disabled look / when | Focus after |
|---|---|---|---|
| `Settings` (`page.tsx:37-39`) | Back to `/app/settings`. | — | Navigates. |
| **The one plan action**, chosen by `PlanActions` (`page.tsx:82-97`): | | | |
| · `Start your plan` (no subscription) | Server action → Stripe-hosted Checkout (`actions.ts:18-27`). Returns to `?checkout=done`, or here with no notice if the agent backs out. | Not rendered in view-as. No disabled styling while submitting. | Leaves the site for Stripe. |
| · `Cancel my plan` (active, not cancelling) | A **link**, not a button, to the cancel screen; nothing happens until the agent confirms there. | Not rendered in view-as. | Navigates to `/app/settings/billing/cancel`. |
| · `Keep my plan` (active, set to end) | Filled `buttonClass` form button; undoes the cancel (`resumePlanAction`, `actions.ts:41-51`) and returns with `?done=resumed`. | Not rendered in view-as. | Page reloads with the notice. |
| · no control (past due) | Text only: `Pay the open invoice below to start sending again.` | — | — |
| · `Restart your plan` (ended or any other status) | Same Checkout action as Start. | Not rendered in view-as. | Leaves for Stripe. |
| `Pay this invoice` / `View invoice` (`invoice-list.tsx:25-29`) | Opens Stripe's hosted invoice page. "Pay" when the invoice is open. Only when Stripe returned a URL. | — | Navigates away. |
| `Try again` (error screen) | `reset()` re-renders. `linkClass`. | — | — |

## States

- **Active** — captured: billing. The e2e Stripe stand-in (`src/billing/e2e-gateway.ts:5-21`)
  gives `Plan` `$19 a month, up to 250 homeowners`, `Status` `Active`, `Next charge`
  `December 31, 2098`, `Card` `Ending in 4242`, the `Cancel my plan` link, and two invoices
  `September 1, 2026  $19  Paid` and `August 1, 2026  $19  Paid` with no links (the stand-in
  gives no URLs). The odd date: the stand-in's period end is 2099-01-01 00:00 UTC, shown in the
  agent's timezone (`billing-copy.ts:26-33`), which is still December 31 in Los Angeles.
  Note: the plain seed (`scripts/seed.ts`) has no subscription; the capture depends on
  `scripts/e2e-setup.ts:33-34` inserting one.
- **Set to end** — `Status` `Active until the end of this period`, the date row reads `Ends`,
  action `Keep my plan`. Notice after cancelling: `Your plan is set to end. Nothing changes until then.`
  Producible by confirming the cancel screen; not captured.
- **Payment failed** — `Status` `Payment failed`, no date row, the pay-the-invoice sentence, and
  the open invoice reads `Not paid yet` with `Pay this invoice`. Not producible from the seed;
  described from `billing-copy.ts:21`, `page.tsx:93-95`, `invoice-list.tsx:8, 27`.
- **Ended** — `Status` `Ended`, action `Restart your plan`. Any other Stripe status reads
  `Not active` (`billing-copy.ts:22-23`). Not producible from the seed.
- **No plan** — `You don't have a plan yet.` and
  `$19 a month, up to 250 homeowners. Your homeowners start getting the monthly note once the plan is active.`
  with `Start your plan` (`page.tsx:46-50`). Producible with the plain seed (no e2e setup); not captured.
- **No card / no invoices** — `No card on file`; `No invoices yet. Your first one appears here after the first charge.` (`page.tsx:68`, `invoice-list.tsx:16`). Not captured.
- **Invoice status words** — `Paid`, `Not paid yet`, `Voided`, `Not collected`, `Being prepared` (`invoice-list.tsx:6-12`).
- **Notices** (`billing-copy.ts:10-17`), `role="status"`: `Your plan will keep going. Nothing else changed.`;
  `Thanks. Your plan starts as soon as Stripe confirms the payment, usually within a minute.`;
  `We could not open checkout. Try again in a minute.`;
  `We could not cancel your plan. Try again in a minute; nothing changed.`;
  `We could not resume your plan. Try again in a minute; nothing changed.`
- **View-as** — the details and invoices show, but no action renders (`page.tsx:50, 70`); a
  submitted action is bounced back here (`actions.ts:14`). Not producible from the seed.
- **Loading** — `Loading your billing…` (`loading.tsx:4`). Not captured.
- **Error** — `We couldn't reach Stripe for your billing.`,
  `Nothing about your plan changed. Try again in a minute.`, `Try again` (`error.tsx:13-23`).
  It names Stripe because the page reads Stripe live; the likeliest failure is Stripe being slow.
  Not captured.

## Fixed copy

- `$19 a month, up to 250 homeowners` (`PLAN_LINE`) **Fixed** — `billing-ui.test.ts:46`. Built from `PLAN` in `src/config/costs.ts`, never typed in.
- `You don't have a plan yet.` **Fixed** — `billing-ui.test.ts:43`.
- `Loading your billing`, `Try again` **Fixed** — `billing-ui.test.ts:41-42`.
- `Not paid yet`, `Pay this invoice`, `View invoice`, `No invoices yet` **Fixed** — `billing-ui.test.ts:22-26`.
- Status words and notices: no test; they state what Stripe reports and what changed, nothing more.

## Tests that assert on this screen

- `src/app/app/settings/billing/billing-ui.test.ts:10` — invoice history renders Stripe's dates, amounts and status, a pay link on an open invoice, and the empty line.
- `billing-ui.test.ts:40` — four states, and the Stripe customer portal is never used (`src/billing/stripe-gateway.ts` has no `billing_portal`); `PLAN_LINE` wording.
- `src/app/app/settings/settings-reskin.test.ts:30` — `billing/page.tsx`, `billing/error.tsx`, `billing/invoice-list.tsx` use `linkClass`, not a copy.
- `src/billing/billing.integration.test.ts:129` — cancel keeps sending until the period ends, resume restores it, the end stops mail but keeps everything.
- `billing.integration.test.ts:166` — a failed payment moves the account to past due.
- `billing.integration.test.ts:178` — the billing view reads card and invoices from Stripe.
- `e2e/screens.spec.ts:6` with `e2e/checks.ts` — no horizontal scroll at 390, 44px tap targets on phone (a link inside a line of text is exempt), no text under 15px, no clipping. The capture reports none (`e2e/screenshots/*/billing.json` is `[]`). The "Settings" back link stands alone, so it is held to 44px; it carries `.tap` since OR-041 (`checks.ts:35-37`).

## What the v0 export did, and why we did not take it

There is nothing to take: the export has no billing screen (`docs/audits/OR-027-v0-audit.md:123, 139`).
It only shows a `BILLING` constant, `card: 'Visa 4417'`, `nextCharge: 'October 1'`
(`reference/v0-export/lib/store.tsx:20-25`), printed under its add-on bill
(`components/app/addon-bill.tsx:72`). A hardcoded card and date are invented data; ours reads
Stripe (audit :329). The audit's rule for screens with no export counterpart applies: keep our
markup and only restyle it (audit :390).
