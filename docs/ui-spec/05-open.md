# 05 — Known to be imperfect, and not owned

These are things that are wrong or unfinished today and that no work item owns. Each one is
recorded so a redesign doesn't copy it as if it were intended. Where an item is a design
problem, a redesign may fix it. Where it is a product or copy decision, it isn't the
designer's to settle, and the item says so.

Each item says how it is known:

- **Measured**: seen in a browser.
- **From the code**: read in the source, but not run.
- **Logged**: already recorded in `docs/audits/reskin-screen-log.md`, "Found, not fixed".

## Product and copy decisions (not a designer's to make)

1. **Assessor facts are shown without their source.** *Logged.*
   - Review candidate cards show beds, baths and square feet from the county assessor
     roll with no label saying so.
   - The email's "Four doors down" block does the same for "Your house", while the
     listing beside it carries its MLS attribution.
   - PROJECT_STATE principle 3 says every figure must be legible as county record or MLS.
   - How assessor data is labelled everywhere is an open product question.

2. **The marketing page does not answer its own comprehension test.** *Logged.*
   - The test is in PROJECT_STATE validation 3: after ten seconds on the page, an agent
     should say "it tells me who to call".
   - The page talks about the note and the tax difference, and never mentions the call
     list.
   - A "who to call" hero rewrite exists and has not shipped. That decision is Jerry's.

3. **There is no privacy policy or terms page.** *Logged. No owner; flagged for Jerry.*
   - Register collects names, emails and phone numbers.
   - In California this is a CCPA question, not only a missing page.
   - Nothing links to either page today, and nothing may until they exist. Do not draw a
     footer with links to them.

4. **The "Four doors down" listing never appears in a real email.** *From the code.*
   - The block compares a nearby MLS listing with the homeowner's house. It renders only
     in fixtures, the sample page and the settings sample.
   - Real sends always pass no listing: `src/digest/build-input.ts:174` sets
     `nearbyListing: null`.
   - Design it as a real block, but know that agents do not see it in their homeowners'
     mail today.

5. **The MLS listing shows a status but no date.** *From the code.*
   - CLAUDE.md says MLS figures carry a status and a date.
   - The block renders status and price (`src/digest/blocks/four-doors.ts:26`), but not
     the listing date, which the data has (`src/digest/types.ts:48`).
   - The sentence also reads "is active listed at $1,065,000." with no comma.

6. **The email footer's "Update this address" goes to the unsubscribe page.** *From the
   code.* Both footer links are replaced with the same URL (`src/unsubscribe/links.ts:36-37`).
   That page does have an address form at the top, so the link isn't dead. It just isn't
   a separate destination.

7. **Weakly held copy.**
   - Much of the review-queue and person-edit copy is held only as named constants, not
     as the words themselves. A test checks the constant is used, not what it says.
   - Several strings have no test at all, including:
     - "Log out"
     - the view-as banner
     - the cancel screen's `<h1>`
     - Billing's status words
     - the password error lines on register
   - Each screen file marks these. Treat them as fixed anyway, and route rewording
     through a copy pass.

## Design problems a redesign may fix

8. **Closed in OR-041: standalone links under 44px.** The check now exempts only a link
   inside a sentence. Run over every screen, it found 13 kinds of link, not the six measured
   in OR-039. All are 44px on a phone now, except each People row's name and "Edit" links:
   an owned exception in `e2e/tap-allowlist.ts`, for OR-045. "Edit" is 27px wide, so it
   needs width as well as height.

9. **A disabled add-on switch looks live.** *From the code.*
   - Its only disabled styling is the cursor (`src/app/app/addons/addon-switch.tsx:19`).
   - During a save, or for an admin in view-as, it looks like a working switch.
   - It should take the disabled look from `02-system.md`. It must still not make an
     *off* switch look unavailable (`01-constraints.md` §3.3).

10. **Closed in OR-043: the view-as banner covered the bar on a phone.** It was fixed at 68px against a
    56px page offset. It is sticky and in the page's flow now, on the coral alert pair.

11. **The review queue can say "done" too early.** *From the code.*
    - "Review this match" on a person's page opens the queue part-way through.
    - Deciding moves forward and never wraps back. After the last person, the done screen
      shows, even though people before the starting point are still waiting
      (`src/app/app/people/review/review-queue.tsx:45, 61-63, 108`).
    - It is a behaviour bug, not a design one. Don't design around it.

12. **Asking for a person not in the queue opens someone else.** *From the code.*
    `/app/people/[id]/review` for a person who is already matched or left out opens the
    first person in the queue instead (`review/page.tsx:41-43`).

13. **Empty call list with no next action.** *From the code.*
    - If all three names this month are marked "Not now", nothing renders under "Worth a
      call this month", and the month is not counted as quiet
      (`src/app/app/call-list-view.ts:50-75`).
    - The quiet-month line, "Quiet month. That happens.", names no next action either.
    - Both fall short of the four-states rule (`01-constraints.md` §3.4).

14. ~~**The send card can carry two actions.**~~ *Closed in OR-044.* The scheduled state
    keeps both, with one primary: "Preview it" is the button and "Skip this month" a form
    button styled as a link. `sendCardClass` now says "at most one primary action".

15. **The review error screen has no link back.** *From the code.* It says to go back to
    your people, but offers only "Try again".

16. **Import stays enabled with an incomplete column mapping.** *From the code.* Rows
    with an unmapped address come back as skipped. The server's "Tell us which column…"
    message can't be reached from the form.

17. **Focus does not move after an action.** *From the code.*
    - On review, import and start, nothing moves focus after a choice, a save or a
      result.
    - A keyboard or screen-reader user stays where they were while the screen changes
      below.

18. **Markup quirks.** *From the code.*
    - The import tabs have `role="tab"` without arrow keys or a tab panel.
    - The no-parcel panel puts its input and its Save button inside one `<label>`.
    - `import-form.tsx` keeps its own field style, not the shared `fieldClass`.
    - On register, the password input has no accessible label, because "Password" is a
      plain `<p>` (`src/app/register/register-form.tsx:59`), and the requirements list
      isn't tied to it.

19. **The Desktop / Phone toggle on the email preview does nothing on a phone.** *From
    the code.*
    - At 390px both widths shrink to the column (`src/app/digest/preview-panel.tsx`).
    - On a phone it's close to a dead control (CLAUDE.md invariant 1).
    - Hide it or make it say something there.

20. **Same labels, opposite controls.** *From the code.* On Billing, "Cancel my plan" is
    a link and "Keep my plan" is a filled button that undoes a pending cancel. On the
    cancel screen it is the other way round. Each is right where it is. A redesign
    should keep the two screens recognisably different.

21. **"Text me a code" blames the number when texting is off.** *From the code.* With
    texting turned off, it says "We could not send the code. Check the number and try
    again."

22. **The People selection survives a filter change.** *From the code.* Bulk actions
    may act on people the current filter hides. Not checked in a browser.

23. **/sample has no `<h1>`.** Its only heading is the preview panel's `<h2>`.

24. **The unsubscribe page puts the emphasis on "Update my address".**
    - A CSS rule makes the first form's button 18px bold
      (`src/unsubscribe/html.ts:69`), and the first form is the address form.
    - Nothing records whether stopping or updating should carry the weight.
    - The page's colours are outside the colour scan, which covers `src/app` only.

25. **The plain-text note has no block labels.** *Seen in the OR-043a capture.*
    - The HTML note labels its blocks: "Property taxes", "What sold on your street".
    - The plain text drops the labels, so a reader gets the tax lines and then two street-sales
      lines with no heading.
    - Nothing records whether the labels belong in plain text.

26. **`parcels.last_refreshed_at` is written and never read.** *From the code, OR-043a.*
    - The seed writes it (2026-08-01).
    - Nothing outside the schema and fixtures reads it.
    - That may be a write-only field (CLAUDE.md invariant 2), or a reader my search missed.
    - It will matter when real parcel data lands and a stale parcel needs to look stale.

27. **A sticky element at `top: 24px` slides under the view-as banner.** *From the code, OR-046.*
    - The banner is `sticky top-0 z-20` (`src/app/app/view-as-banner.tsx`).
    - The design's sticky Settings preview (`top: 24px`) would have slid under it in view-as.
    - OR-046 didn't take that column, so nothing does this today. Anything that sticks near the top
      later needs the banner's height as its offset.

## Smaller things

- `src/app/fonts/fonts.ts` says Fraunces is "used nowhere yet". Since OR-038 it is used on
  the home `<h1>`. This is a stale comment.
- The home page types "Oakdale" by hand (`src/app/home-story.tsx:24`). The email derives
  the street name from the address. The shared-story test checks the figures, not that
  word.
- The `start` capture shows whichever MLS ID the last browser run searched for, not the
  seed's, because a search saves the ID to the account.
- The edit screen and the per-person review entry are not in the browser pass, so none of
  the 390px checks run on them.
