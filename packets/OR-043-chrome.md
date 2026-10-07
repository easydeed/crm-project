# OR-043 — The chrome: navy bar, identity line, view-as banner

Drafted by the builder. Approved by the Director with Decisions A, B (both) and C as
defaulted, and the notes at the end.

```
TASK: OR-043
BRANCH: feat/chrome

OBJECTIVE
Every /app screen opens with the design's navy top bar, built on the bar
pair from OR-042:
- the current page is the light pill on the dark bar, in both themes
- an identity line sits under it, with Log out kept as a form button
- the view-as banner is recoloured so it can never merge with the bar,
  and stops covering the bar on a phone
- the dashboard captures exercise the call tags that have never
  rendered

WHY
The bar is the one element on every app screen. OR-042 defined its
pair and left the pill tokens unrendered; this packet is their first
user.

Three known problems sit in the chrome today:
1. The view-as banner is #0E1729, the light --bar value: 1.00:1. The
   moment the bar goes navy, the banner disappears into it.
2. The dark blue-soft nav pill (#1a2240) is close to the bar's dark
   value (#202b4f), so the current page barely shows in dark until the
   pill moves to the bar pair.
3. The banner is about 68px tall on a phone, and the page is pushed down
   only 56px (05-open item 10).

WHAT I FOUND ABOUT THE CALL TAGS
The list holds three names (CALL_LIST_SIZE = 3), so one dashboard can
never show four kinds. And the seed's call list isn't built from the
seed's own dates. scripts/e2e-setup.ts calls buildCallLists with
asOf = now. The seed's three Oakdale sales are recorded 2024-05-14,
2024-11-08 and 2025-03-21. "Big sale next door" only fires within a
trailing window of asOf, so those sales have aged out, and every
contact falls through to "Been a while". They almost certainly produced
real signals when they were written.

That is the bill-bar pattern in data form: the capture went quiet and
nothing said so. A fixed-date fixture checked against a moving "now"
loses its signals on a calendar schedule.

SCOPE
1. Top bar (top-bar.tsx, nav-link.tsx):
   - bg-bar, with the wordmark in --on-bar (18px bold)
   - nav links 16px in --on-bar
   - the current page: bg-bar-current with --on-bar-current words,
     semibold, aria-current kept
   - the focus ring is outline-on-bar: it clears 3:1 on the bar,
     where --foreground would be invisible
   - hover: underline only. No rgba fill (OR-040).
   - The dashboard and /app/start highlight nothing, as today.
2. Identity line (layout.tsx), under the bar:
   - the account's name and brokerage, joined by " · ", in mutedClass
   - Log out on the right: still <form action={logoutAction}><button>,
     styled with linkClass, at 44px
   - In view-as it shows the viewed account, which is the one whose
     data is on screen.
   - Data, not copy: no new words except the " · " join.
3. View-as banner (Decision A):
   - recoloured and brought onto tokens
   - the page's top padding follows the banner's real height at every
     width (it is taller on a phone)
4. Call tags in the captures (Decision B):
   - e2e-setup writes recorded events dated relative to the run, for
     three of the seeded agent's matched contacts:
     - a sale four doors down, recorded 10 days ago (sold_nearby)
     - a reconveyance 20 days ago (loan_paid_off)
     - a street median far above the assessed value, for the third
       (tax_upside)
     That is setup data in the local scratch DB, never seed. scripts/seed.ts
     stays fixed and still refuses non-local databases.
   - The dashboard then shows coral, green and blue-soft tags, light
     and dark.
5. top-bar.test.ts:24 is rewritten on purpose: the current mark is the
   bar pill pair, not blue-soft. New property tests, below.

DESIRED BEHAVIOR

1. DECISION A — the view-as banner becomes coral with navy words.
   Default: yes.
   - A new token pair, --alert #ff4a2b and --on-alert #0e1729, with
     the same values in both themes. Coral is already the fill and
     #0e1729 the light ink.
   - Navy words on coral: 5.34:1.
   - Coral against the light bar: 5.34:1. Against the dark bar: 4.12:1.
     It can't merge with the bar in either theme.
   - The banner leaves the EXEMPT list in design-debt.test.ts and the
     LINK_LISTED copy in shared-classes. It was outside the system
     only because the system had nothing loud enough. INK_COLOR stays
     for the email's "ink" accent swatch, which is its other use.
   - The alternative is to keep the banner exempt with a new hex. It
     stays loud, but its contrast is checked by nothing. Say "exempt"
     for that.

2. DECISION B — how the four tag kinds get captured. Default: three in
   the existing captures, plus one second account for the fourth.
   - With the dated events above, dashboard and dashboard-dark show
     "Big sale next door", "Paid off their loan" and "Taxes worth a
     talk". That covers the three never seen, in both themes.
   - "Been a while" then leaves those captures. It is muted ink on
     --surface, 4.56:1, the tightest pair in the system, so it should
     not go uncaptured.
   - A second seeded agent with no recent events gets a quiet dashboard
     of "Been a while" rows. It is captured as dashboard-quiet and
     dashboard-quiet-dark.
     - Cost: a second fixture agent in the seed, a second login state in
       auth.setup, and an optional `as` on a Screen.
     - It also opens the door to states the single agent can't produce:
       paused, system-paused, no people.
   - Say "three only" to skip the second account. The grey tag would
     then be held by ratio alone, the gap you just named.

3. DECISION C — the auth pages' bar. Default: not in this packet.
   - The design puts a wordmark-only navy bar on /login and /register.
     They have no top bar today. That is a structure change on two
     signed-out screens, so it belongs with their restyle (OR-047).
   - Say "now" to add it here.

PROPERTY TESTS (each proven both ways, as in OR-041)
- The bar:
  - the header fills bg-bar
  - its words are on-bar
  - the only fill inside it is bg-bar-current, on the aria-current link,
    whose words are on-bar-current
  - every focus outline in it is outline-on-bar
  - no blue, no blue-soft, no rgba
- The banner: fills bg-alert with text-on-alert, and carries no
  style={{}} colour.
- Log out is a <button> inside a <form> whose action is logoutAction.
  Never a link: a link to log out would be a dead control (invariant 1).
- tokens.test PAIRS gains on-alert/alert TEXT and alert/bar NON_TEXT.
- The seed for captures: e2e-setup's events are dated from the run's
  "now". A test reads the setup and fails if any event date is a fixed
  literal.

ACCEPTANCE CRITERIA
1. Every existing test passes, except top-bar.test.ts:24, rewritten on
   purpose, and the banner's EXEMPT and LINK_LISTED entries, deleted.
2. The new property tests pass, each proven red on a break and green on
   a cosmetic change.
3. dashboard and dashboard-dark show three tag colours. Per Decision B,
   dashboard-quiet and dashboard-quiet-dark show "Been a while". The
   report states each tag's measured ratio in each theme.
4. The browser pass is green at both widths, including the new screens.
   A view-as capture isn't possible: the seed has no admin. The
   banner's phone height is measured in a probe and reported, and the
   page padding follows it.
5. The desktop comparison (exact), from a fresh seed, after a
   capture-only first commit. Expected:
   - every /app screen changes (the bar and the identity line)
   - login, register, home, sample, sample-text-dark and unsubscribe
     are byte-identical
   - dashboard changes for the tags too; the report separates the two
     causes
6. Docs:
   - 02-system: the alert pair and the bar's use
   - 03-screens/top-bar.md rewritten for the bar, the identity line and
     the banner
   - 05-open item 10 closed
   - reskin-screen-log row
7. No dependency, no schema change, no copy change beyond the identity
   join. No test loosened.
8. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - The current nav pill goes back to bg-blue-soft. The bar property
     test goes red.
   - The banner goes back to INK_COLOR. The banner test goes red, and so
     does design-debt, now that the banner is scanned.
9. pnpm verify passes, CI green before merge.

DO NOT
- Make Log out a link, or move it out of a form
- Add a hover fill, an rgba, brass or any colour outside the tokens
- Put dated test events in scripts/seed.ts, or let setup touch anything
  but the local scratch database
- Restyle the auth pages, the screens' content or any copy
```

## Found while drafting, not absorbed

- **The fixed-date seed is ageing out.** Today it's the call tags. The
  same applies to anything windowed against "now": the email's
  street-sales block, and "recorded in the last N days" anywhere. I'd
  audit the seed's dated rows once, in a short packet, rather than
  discover each one when a capture quietly changes.
- **The four-tag ask can't be met by one dashboard.** The product shows
  three names. Decision B is the closest honest answer.
- **The banner was exempt from the token system** because nothing in it
  was loud enough. Decision A ends the only exemption in src/app outside
  /admin and the email canvas.

## Director's notes on approval

- The finding behind B is the fourteenth, and a new species: **time-dependent fixtures that
  expire**. Nothing was mis-scoped or mis-matched; the check drifted out of the window its data
  occupied. No test failed; the captures just got less interesting, and three tags became
  ratio-only without anyone deciding that.
- A: the coral banner with navy words ends the exemption, and stays distinguishable from the bar
  it sits on in both themes.
- B: both. Relative-dated events in test setup for the three live tags; a second quiet agent for
  "Been a while", the tightest pair in the system, and the last that should be held by arithmetic
  alone.
- C: the auth pages wait for OR-047.
- **OR-043a follows straight after**: audit every dated row in the seed and fixtures, report which
  have expired or will, and convert them to relative dates where what they feed is time-windowed.
  The digest's street-sales block is built from the same fixtures and has probably been rendering
  a thinner note than the product produces.
