# OR-032 — Re-skin: review queue

Drafted by the builder. Approved by the Director with Decisions A and B as
defaulted and the additional scope at the end.

```
TASK: OR-032
BRANCH: feat/reskin-review

OBJECTIVE
The review queue restyled with the OR-028 tokens. Same flow: one person
at a time, the cards, "This one", "None of these", the no-parcel panel,
five-second Undo and the done states. Clears its one debt file.

WHY
This is the screen where one tap attaches a house to a person. A wrong
tap sends the monthly note about the wrong house until someone notices.
The cards must make it plain which button belongs to which house, and
what the record actually says about each one.

SCOPE
- review/candidate-cards.tsx: the card outline (debt; Decision B); the
  name-match line (Decision A)
- src/app/globals.css: one comment line, only if Decision B is --border
- review/review-queue.tsx, review/error.tsx: the two inline copies of
  linkClass become linkClass. The strings are identical, so these
  screens do not change.
- src/app/design-debt.test.ts: delete the candidate-cards entry
- src/app/app/people/review/review-ui.test.ts: new assertions only;
  the seven existing tests stay exactly as they are
- The wrong-house mode (/app/people/[id]/review) renders the same
  components and changes with them
- Out of scope:
  - review/actions.ts, the queue's order, the undo timer and all copy
    in src/people/review-copy.ts
  - no-parcel-panel.tsx and done-state.tsx: already tokens only
    (fieldClass, linkClass, buttonClass, mutedClass); no edit
  - /admin/matching

CURRENT STATE (read from the code)
- Header "Needs a look · 1 of 7" (22px), then "You gave us:" with the
  typed name and address.
- Cards: one column on phones, three from md. Each card is an li with
  border-foreground/20 (1.53:1 on white, 1.66:1 dark;
  the same value fieldClass had). It shows:
  - the street, then city and ZIP
  - "Recorded owner: …"
  - "Name matches" in font-medium, when the owner matches the typed
    name
  - beds, baths and sq ft in mutedClass: parcels columns, from the
    assessor roll, not MLS, so no MlsAttribution
  - the match reason
  - a full-width-on-phones "This one" (buttonClass)
- "This one" is the only thing that picks a house. The card itself is
  not clickable.
- "None of these" and the error screen's "Try again" repeat linkClass's
  string inline.
- Undo is a sticky bar at the bottom for five seconds after each
  decision.
- A test holds the review UI to 15px and 22px text and focus rings.

DESIRED BEHAVIOR

1. Debt: the card outline leaves border-foreground/20 (Decision B says
   which token), and the entry is deleted.

2. DECISION A — "Name matches" as a tag. APPROVED: yes, the neutral
   pair.
   - It becomes a tag, the same shape as the People status tags:
     --foreground on --blue-soft (in the contrast test: 15.30:1 light, 13.32:1 dark).
   - The same words, "Name matches". Text carries it; colour repeats it.
   - Why not green: green means "On the map" everywhere else in /app.
     On a candidate card it would read as "this is the right house".
     The app does not know that. A person can own two houses, and a
     name match is evidence, not an answer.
   - The alternative is no tag, keeping font-medium. Say no if you
     want the cards to carry no emphasis at all.

3. DECISION B — card outline in --border, not --rule. APPROVED:
   --border, with the exception written down.
   - The debt table says --rule, and so does the OR-028 rule in
     globals.css: "Cards take a --rule border, not a shadow." --rule is
     decorative: 1.29:1 light, 1.43:1 dark. That is fainter than
     today's 1.53:1.
   - This decision makes an exception to that rule. If you approve it,
     the globals.css comment gains one line: "except candidate cards,
     where the outline says which button picks which house".
   - On a phone the cards stack, each ending in an identical full-width
     "This one". The outline is what tells you which button picks
     which house. At 1.29:1 that boundary is hard to see in sunlight.
     --border is 3.61:1 light and 4.22:1 dark.
   - WCAG does not require it: a card is not a control. This is the
     one screen where I'd pay the extra weight.
   - Say --rule to keep the OR-028 rule without exception. The
     outline then gets fainter than it is today (1.53 to 1.29:1).

4. linkClass replaces its two inline copies. The strings are identical,
   so nothing moves; this removes duplication, not colour.

5. What we do not do, each for a reason:
   - The export's whole-card button with a selected ring and a separate
     confirm (lot-card.tsx). The card stays inert, and "This one" is
     the only target. A tap that lands while scrolling a stack of cards
     must not pick a house.
   - Highlighting where the typed address differs from the candidate
     (411 vs 410). That is comparison logic, not a restyle. If wanted,
     it is its own packet, built on the existing address normalization.
   - The export's APN and last-deed line under each card. We show no
     field that nothing tested reads. Adding recorded fields is a
     product decision, and a recorded figure would carry its document
     number.
   - Colour on the error line. role="alert" and the words carry it.

ACCEPTANCE CRITERIA
1. All seven review-ui.test.ts tests pass unchanged. They cover:
   - one person at a time
   - the card fields and REVIEW_NAME_MATCHES
   - no-parcel options
   - done states
   - five-second undo
   - four states
   - 15px text and focus rings
2. New assertions:
   - the name-match tag uses exactly the Decision A pair, and that pair
     is in tokens.test PAIRS
   - the card outline is the Decision B token
   - onChoose is called in exactly one place in candidate-cards.tsx,
     and that place is the "This one" button's onClick
   - review-queue.tsx and error.tsx carry no inline copy of linkClass's
     string
3. design-debt.test.ts: the candidate-cards entry is deleted, and the
   /app scan passes
4. The contrast test passes unchanged
5. The browser pass is 37/37 at both widths
6. The desktop comparison (exact, OR-030a), from a fresh seed, lists
   every changed screen with its reason. Expected: review-queue only.
   Nothing else uses candidate-cards.tsx, and the linkClass swap is
   byte-identical.
7. reskin-screen-log.md gains the OR-032 row
8. No dependency, no schema change, no copy change, no test loosened
9. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - The whole card made clickable (onClick={() => onChoose(...)} on
     the li): the one-target assertion goes red. Lint does not catch
     this: next/core-web-vitals carries no click-events rule. That is
     why the test exists.
   - "Name matches" replaced by a coloured dot with no words (colour
     alone): the existing card-fields test goes red on
     REVIEW_NAME_MATCHES. This proves the old test already guards this
     case, and the new tag test is not needed to catch it.
10. pnpm verify passes, CI green before merge

DO NOT
- Make the card, its outline or anything but "This one" pick a house
- Change the order, the undo window, the copy or the actions
- Show a figure without its source (recorded: document number; MLS:
  status and date)
- Touch /admin/matching or no-parcel-panel's behaviour
```

## Found while drafting, not absorbed

- The card's beds, baths and sq ft come from the assessor roll
  (`parcels`). They are shown without saying so. PROJECT_STATE
  principle 3 asks that every figure be legible as county record or
  MLS. These are neither a recorded document (no doc number) nor MLS.
  They are unlabelled assessor facts. That is a copy and product
  question, not colour debt, and no packet owns it. Raising it, not
  fixing it.

## Additional scope (Director)

```
Additional to OR-032 scope:

Record in docs/audits/reskin-screen-log.md, under a new "Found, not
fixed" section: the candidate cards show beds, baths and sqft from the
assessor roll with no source label, which principle 3 asks for. Not
colour debt, no packet owns it, raised in OR-032. Note that the same
figures appear unlabelled in the digest's four-doors-down comparison,
where the MLS side is attributed and the assessor side is not — so this
is a product question about how assessor data is labelled, not one
screen's copy.
```
