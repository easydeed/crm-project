# OR-034 — Re-skin: settings and billing

Drafted by the builder. Approved by the Director with Decision A as defaulted
and the amendment at the end.

```
TASK: OR-034
BRANCH: feat/reskin-settings

OBJECTIVE
/app/settings, /app/settings/billing and the cancel screen restyled with
the OR-028 tokens. Same forms, readout, phone verification, plan,
invoices and cancel. Clears the two settings debt files and swaps this
packet's six linkClass copies. Closes a gap in OR-033a's buttonClass
test.

WHY
Settings is where the agent's name and the email's look are set, and
billing is where they leave. The cancel screen has copy constraints a
restyle must not loosen:
- no retention offer, no discount, no survey
- one form
- a plain statement of what happens to their homeowners
OR-018's test holds all of that, and this packet must leave it exactly
as it is.

SCOPE
- settings/field.tsx (debt):
  - its fieldClass is the shared fieldClass with border-foreground/20.
    It becomes a re-export of people/ui.ts's fieldClass, so the details,
    appearance and sending forms get the --border outline (1.53:1 to
    3.61:1 light).
  - Muted takes mutedClass
- settings/phone-verification.tsx (debt):
  - its code input's border-foreground/40 becomes --border. It keeps
    its own inputClass, because w-40 and tracking-widest are deliberate
    for a six-digit code.
  - its local buttonClass becomes the shared one; see "found" below
- billing/page.tsx and billing/cancel/page.tsx: their local buttonClass
  and linkClass copies become the shared classes
- the six linkClass copies from reskin-screen-log.md:
  - settings/error.tsx (+mt-6)
  - settings/page.tsx ("tap" variant, kept as `tap ${linkClass}`)
  - billing/error.tsx (+mt-6)
  - billing/page.tsx (identical)
  - billing/cancel/page.tsx (identical)
  - billing/invoice-list.tsx (no 15px; it sits in a 15px list)
  Their rows leave the "Found, not fixed" table.
- src/app/design-debt.test.ts: delete both entries and the OR-034 owner
- tests: new assertions only. settings-ui.test.ts and billing-ui.test.ts
  stay exactly as they are, the cancel test above all.
- Out of scope:
  - billing-copy.ts and every word on these screens
  - the appearance preview (the email's own design, not app tokens)
  - actions, save and Stripe

CURRENT STATE (read from the code)
- Settings is one page with four sections:
  - Your details, How the email looks (with a live preview) and Sending
    are three forms on settings/field.tsx's fieldClass
  - Phone for texts
  - plus a Billing link
  Helper lines use Muted (text-foreground/70).
- Billing shows the plan, status, next charge and card as a dl, the
  invoice list, and one action. The action depends on state:
  - Start your plan
  - Keep my plan (when set to end)
  - a "Cancel my plan" link
  - Restart your plan
- The cancel screen has one sentence (cancelSentence), one form with a
  filled "Cancel my plan" button, and a "Keep my plan" link.
  billing-ui.test.ts requires:
  - cancelSentence
  - no discount, offer, coupon, survey, reason, feedback or "% off"
  - exactly one <form>
  - no Stripe customer portal
- The export has no billing page and no cancel screen. Its settings has
  a "Pause all sending" switch that toasts on change. There is nothing
  to borrow for cancel.

FOUND WHILE READING (in scope, because the fix is the same edit)
- OR-033a's test "primary buttons use buttonClass" checked a list of
  five files. Outside /admin, six more copies of buttonClass's string
  exist:
  - in this packet: billing/page.tsx, billing/cancel/page.tsx and
    phone-verification.tsx
  - on <Link>s styled as buttons on the dashboard: home-card.tsx and
    home-billing-card.tsx. These shipped in OR-030 and add inline-block
    and mt-6.
  - on the marketing page: home-story.tsx
  /admin has five more, and it is unstyled by decision.
- The phone-verification copy matters most. Its "Text me a code" and
  "Confirm" buttons take disabled={pending} but carry no disabled style
  at all, so they look live while a code is sending.
- The test was named for every primary button and checked five files.
  That is the sixth check on this project found checking less than its
  name says.
- OR-034 adds a whole-tree version over src/app outside /admin. It has
  an allowlist of three entries, each with its owner, and it fails both
  ways, like design-debt: a new copy is red, and a listed copy that is
  gone is red too.
  - home-card.tsx and home-billing-card.tsx: final sweep. Links never
    take a disabled state, so they lose nothing meanwhile.
  - home-story.tsx: final sweep, alongside its linkClass copy
- The three in OR-034's own files are fixed here. The three listed
  copies go into reskin-screen-log.md under "Found, not fixed".
- OR-033a's file-list test stays as it is.

DESIRED BEHAVIOR

1. Debt:
   - settings fieldClass: the shared fieldClass (--border)
   - Muted: mutedClass
   - the phone code input: --border
   - both entries and the OR-034 owner deleted

2. DECISION A — "Cancel my plan" stays the filled primary button.
   APPROVED: yes.
   - The agent came to this screen to cancel. It has one decision, and
     the button that carries it out should look like the page's action.
   - Shrinking it, outlining it in coral, or making "Keep my plan" the
     bigger button is retention by layout. It is the visual form of the
     offer the copy test forbids.
   - Why not destructiveButtonClass: coral-on-outline means data goes
     away (Delete). Cancelling loses nothing; cancelSentence says their
     people and matches stay. Coral would say otherwise.
   - "Keep my plan" stays a plain link, the way out.
   - The alternative is the destructive outline. Say "coral" if you'd
     rather cancel read as a warning.

3. Every button and link on these screens uses buttonClass or linkClass.
   The billing and cancel screens should not move. Their copies differ
   only in focus colour and disabled state, and neither shows in a
   capture. The measurement will confirm it.

4. What we do not do, each for a reason:
   - The export's instant "Pause all sending" switch with a toast. Our
     pause is a checkbox saved with the Sending form. A switch that
     applies on change is a behaviour change, and the toast is a
     confirmation we don't use.
   - Colour on billing status ("Payment failed"). The words, and the
     line telling them to pay the open invoice, carry it. Colouring
     statuses is a pattern decision for every status, not one screen's.
   - Anything on the cancel screen beyond the sentence, the button and
     the link.

ACCEPTANCE CRITERIA
1. settings-ui.test.ts and billing-ui.test.ts pass unchanged, including
   the cancel test and four states.
2. New assertions:
   - settings/field.tsx's fieldClass is people/ui.ts's fieldClass, and
     Muted uses mutedClass
   - Whole tree (outside /admin): every file carrying buttonClass's
     string is people/ui.ts or one of the three listed copies. The
     allowlist shrinks: a fixed copy left on the list fails.
   - the cancel screen's one button is buttonClass, not
     destructiveButtonClass, and "Keep my plan" is a linkClass link
   - phone-verification's buttons use buttonClass, so its disabled state
     shows
   - the six files use linkClass and carry no copy of its string
3. design-debt.test.ts: both entries and the OR-034 owner are deleted,
   and the /app scan passes
4. The contrast test passes unchanged
5. The browser pass is 37/37 at both widths
6. The desktop comparison (exact, OR-030a), from a fresh seed, lists
   every changed screen. Expected: settings only, for the input outlines
   and the Muted lines. billing and billing-cancel should not change; if
   they do, the report says why.
7. reskin-screen-log.md:
   - gains the OR-034 row
   - drops the six rows it fixed from "Found, not fixed"
   - adds the three remaining buttonClass copies there
8. No dependency, no schema change, no copy change, no test loosened
9. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - Cleared debt returns: the phone code input back to
     border-foreground/40. design-debt.test.ts goes red as new debt,
     and nothing else.
   - A retention offer that avoids every banned word: a second <form>
     on the cancel screen with a "Pause my notes instead" button. The
     existing OR-018 cancel test goes red on its one-form assertion.
     This proves the old test catches the classic retention move even
     when the copy is clean.
10. pnpm verify passes, CI green before merge

DO NOT
- Add anything to the cancel screen, restyle "Keep my plan" into the
  bigger target, or make "Cancel my plan" look like a warning
- Change any copy in billing-copy.ts or on these screens
- Touch the appearance preview's email styling
- Use the Stripe customer portal
```

## Found while drafting, not absorbed

- The three buttonClass copies on other screens (home-card,
  home-billing-card, home-story) are recorded, not fixed. They are
  listed above and go to the final sweep.
- The PROJECT_STATE enforcement note (allowlist over denylist), held
  since OR-031, lands in this packet under the amendment.

## Amendment (Director)

```
Amendment to OR-034:

Add to the enforcement note in PROJECT_STATE.md — this packet may touch
that file for this purpose:

  A test named for a property must check the property, not a list. Two
  tests on this project were named for every instance and checked a
  handful: the People status column (keyword denylist, missed the
  export's actual labels) and the primary-button test (file list, missed
  six copies including one real bug). Prefer a whole-tree scan with a
  shrinking allowlist that fails in both directions — a new instance is
  red, and a listed instance that is gone is red too.

Also fold in the allowlist-over-denylist note held since OR-031.
```
