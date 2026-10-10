# Cancel your plan — `/app/settings/billing/cancel`

**Capture:** billing-cancel (390 and 1440)

## What the agent came here to do

Cancel. They tapped "Cancel my plan" on Billing and meant it. This screen tells them, in one
sentence, exactly what will happen, and then does it in one tap. It is the only confirmation;
there is no dialog. The plan is not ended on the spot: it is set to end when the paid period
runs out, and the agent can undo that on Billing with "Keep my plan" until then
(`src/billing/account-billing.ts:65-77`).

## Layout
Since OR-046: a 760px column.
1. `<h1>` "Cancel your plan".
2. **One plain panel** (`panelClass` and its body, no strip). It holds:
   - the cancel sentence, unchanged
   - one `<form>` with "Cancel my plan" (the primary button)
   - "Keep my plan" (a link, 44px on phones)
   It isn't `sendCardClass`: that class is the dashboard's send card.

## Controls

| Label (quoted) | What it does | Disabled look / when | Focus after |
|---|---|---|---|
| `Cancel my plan` (`page.tsx:30-34`) | `buttonClass` submit. Tells Stripe to end the plan at period end (`cancelPlanAction`, `actions.ts:29-39`), then goes to Billing with `?done=canceled`: `Your plan is set to end. Nothing changes until then.` On failure, Billing with `We could not cancel your plan. Try again in a minute; nothing changed.` | Never disabled; no pending state. | Navigates to Billing. |
| `Keep my plan` (`page.tsx:35-37`) | `linkClass` link back to `/app/settings/billing`. Changes nothing. | — | Navigates to Billing. |

Note for a designer: the same two labels mean different things on Billing. There, "Cancel my
plan" is a link that brings the agent here, and "Keep my plan" is a filled button that undoes a
cancel already made (`billing/page.tsx:83-91`).

## Why "Cancel my plan" is the filled primary, not the destructive outline

The app has one primary button (`buttonClass`, dark fill) and one destructive style
(`destructiveButtonClass`, coral words on an outline), and the destructive one is for Delete
only: "coral-on-outline means data goes away" (`src/app/app/people/ui.ts:20-22`). This was
settled as **Decision A** in OR-034 (`packets/OR-034-reskin-settings.md`, approved):

- The agent came to this screen to cancel. It has one decision, and the button that carries it
  out should look like the page's action.
- Shrinking it, outlining it in coral, or making "Keep my plan" the bigger button is retention by
  layout: the visual form of the retention offer the copy test forbids.
- Cancelling loses nothing. The sentence says their people and matches stay
  (`src/billing/billing.integration.test.ts:129` proves the end of a plan stops mail but keeps
  everything). Coral would say otherwise.
- "Keep my plan" stays a plain link: the way out.

`settings-reskin.test.ts:16-21` holds it: the page must contain the `buttonClass` "Cancel my plan"
button and the `linkClass` "Keep my plan" link, and must not contain `destructiveButtonClass`.
The OR-034 packet also forbids "restyle 'Keep my plan' into the bigger target, or make 'Cancel my
plan' look like a warning".

## No retention offer, discount or survey

The screen offers nothing but the sentence, the button and the link (`page.tsx:11`: "One screen,
one decision, and the two ways out of it."; `billing-copy.ts:5`: "The cancel screen, word for
word. Nothing else is offered there."). `billing-ui.test.ts:29-38` holds it:

- the sentence is exactly `cancelSentence`'s output;
- the page source contains none of `discount`, `offer`, `coupon`, `survey`, `reason`,
  `feedback`, `% off`;
- exactly one `<form>`;
- no Stripe customer portal (`billing_portal`, `customer_portal`), which would bring Stripe's own
  cancellation flow and its options.

The one-form rule exists because a word list can be dodged. In OR-034 the builder added a second
form, "Pause my notes instead", which uses none of the banned words; only the one-form assertion
caught it, and the change was reverted (commit 8b5bd85, "a retention offer with no banned word").
A pause option, a downgrade, a "tell us why" box, or a second button of any kind all break this.

## States

- **Populated** — captured: billing-cancel. With the e2e Stripe stand-in the sentence reads
  `Your homeowners stop getting the monthly note after December 31, 2098. Your people and their matches stay here. Come back any time.`
  (the stand-in's period end, 2099-01-01 UTC, in Los Angeles time; `src/billing/e2e-gateway.ts:11`).
  The plain seed has no subscription; the capture depends on `scripts/e2e-setup.ts:33-34`.
- **Not allowed here → redirect, no screen** (`page.tsx:14-21`): signed out → login; view-as →
  Billing; no plan, a plan that is not active, a plan already set to end, or no period end →
  Billing. So there is no empty state: anyone who cannot cancel never sees the page.
- **Loading** — this route has no `loading.tsx`; Billing's applies: `Loading your billing…`
  (`billing/loading.tsx:4`). Not captured.
- **Error** — no `error.tsx` here; Billing's applies: `We couldn't reach Stripe for your billing.`,
  `Nothing about your plan changed. Try again in a minute.`, `Try again` (`billing/error.tsx:13-23`). Not captured.
- **Cancel failed** — shown on Billing as the `error=cancel` notice above. Not captured.

## Fixed copy

- `Your homeowners stop getting the monthly note after <date>. Your people and their matches stay here. Come back any time.`
  **Fixed** — `billing-ui.test.ts:30-32`. It states the fact (what stops, from when, what stays)
  and nothing else; it is the copy the whole screen exists to show.
- `Cancel my plan` (filled `buttonClass` submit) **Fixed** — `settings-reskin.test.ts:18`.
- `Keep my plan` (`linkClass` link to `/app/settings/billing`) **Fixed** — `settings-reskin.test.ts:20`.
- `Cancel your plan` (`<h1>`) — no test.
- The billing notices it leads to (`billing-copy.ts:11, 15`) — no test.

## Tests that assert on this screen

- `src/app/app/settings/billing/billing-ui.test.ts:29` — the exact sentence; no discount, offer, coupon, survey, reason, feedback or "% off"; one form; no customer portal.
- `src/app/app/settings/settings-reskin.test.ts:16` — "Cancel my plan" is `buttonClass`, not `destructiveButtonClass`; "Keep my plan" is a `linkClass` link to Billing.
- `settings-reskin.test.ts:30` — the page uses `linkClass`, not a copy of its string.
- `src/billing/billing.integration.test.ts:129` — cancel at period end keeps sending until then; resume restores it; the end stops mail and keeps everything.
- `e2e/screens.spec.ts:6` with `e2e/checks.ts` — no horizontal scroll at 390, 44px tap targets on phone, no text under 15px, no clipping; the capture reports none (`e2e/screenshots/*/billing-cancel.json` is `[]`). "Keep my plan" stands alone, so it is held to 44px; it carries `.tap` since OR-041 (`checks.ts:35-37`).

## What the v0 export did, and why we did not take it

Nothing: the export has no cancel screen and no billing page (`docs/audits/OR-027-v0-audit.md:123, 139`;
the OR-034 packet: "nothing to borrow for cancel"). Its only billing data is a hardcoded
`BILLING` constant (`reference/v0-export/lib/store.tsx:20-25`). Per the audit, a screen with no
export counterpart keeps our markup and is only restyled (audit :390).
