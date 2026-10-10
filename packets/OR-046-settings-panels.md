# OR-046 — Settings, billing, cancel and add-ons

Drafted by the builder; approved by the Director with all four decisions as defaulted.

```
TASK: OR-046
BRANCH: feat/settings-panels

OBJECTIVE
Settings, Billing, Cancel and Add-ons take the panel system already used on
the dashboard and People. Every control and every Fixed string stays. Where
the design would cost a working control or a checked colour, the design
gives way.

WHAT THE DESIGN DRAWS (1440 only; README:130 says 390 "stacks the same panels")
- Settings (D:337-439):
  - a 1200px container
  - a 760px column of five panels with strips: Your details, Phone for
    texts, How the email looks, Sending, Billing
  - a sticky Preview column beside it, drawn as an inline <div>
- Billing (D:497-531):
  - "← Settings"
  - a "Your plan" panel: label/value rows, a green "Active" chip, Cancel
    in a ruled footer
  - an "Invoices" panel: date · $19 · green "Paid" · "View invoice" on the
    right
- Cancel (D:536-563): one plain panel holding the Fixed sentence, "Cancel
  my plan" and "Keep my plan".
- Add-ons (D:441-491):
  - one "Extras" panel: 19px titles, 17px blurbs and prices, a 56×32
    switch whose off state is drawn in --border
  - the bill bar: a navy block with a brass 22px total, a muted footnote
    and a slate divider

SCOPE
1. All four screens: the 760px column with the same margins as OR-044 and
   OR-045, kept local to each screen.
2. Settings: the five panels, each with a header strip.
   - Your details:
     - a 2-column field grid from sm
     - Save at its own width: `${buttonClass} self-start`, one token, so
       disabled-state.test:46 still holds
   - Phone for texts: the copy and the button side by side from sm. All
     three states and the code form stay.
   - How the email looks:
     - a 2-column field grid
     - swatches at 44px, up from 36px, so they pass the tap rule
     - the swatches keep their names in aria-label and title only, and
       their colours
     - the preview per Decision A
   - Sending:
     - the three selects in three columns from sm
     - a 22px checkbox inside its 44px label
     - the pause line stays: "Nothing sends while this is on…" and the
       system-pause line
   - Billing: a panel with the one link.
3. Billing:
   - The "Settings" back link stays as it is, with no arrow.
   - "Your plan": a panel whose rows are DetailsTable's <dl>, flush to the
     panel edges.
     - DetailsTable gains a `flush` option: no outer border or radius.
     - Label cells keep --surface and muted ink.
   - The plan action sits in a ruled footer.
   - "Invoices": a panel. Each row reads date · amount · status · link,
     the link pushed right and given .tap now that it stands alone
     (A:260).
   - Every notice and every plan state stays.
4. Cancel: one plain panel (panelClass and its body).
   - The Fixed sentence, "Cancel my plan" and "Keep my plan" are
     unchanged.
   - Still one <form>. None of the banned words, comments included.
   - It does not use sendCardClass: that class is the dashboard's send
     card.
5. Add-ons:
   - The "Extras" and "Texting your clients" bands become panels with the
     <h2> as the strip, its text still direct.
   - Rows at 19, 17 and 17px. The muted note stays 15px.
   - The switch grows to 56×32, as drawn. Its off state stays in
     --foreground (Decision D).
   - The config form, "Go to Settings" and the lender summary all stay.
   - The bill bar stays on the bar pair: radius 12, 22/24px padding, 17px
     rows, the total at 22px in --on-bar. Its divider stays border-on-bar,
     and the NEXT_BILL footnote stays in full strength (Decision B).
6. Docs:
   - settings.md, billing.md, cancel.md and addons.md updated.
   - settings.md:62-64, stale since OR-043a, fixed.
   - 02-system's panel note narrowed: "never as a wrapper in page.tsx" is
     the dashboard's rule (call-list.test:78), not every screen's.
   - The reskin-screen-log row.

REFUSED FROM THE DESIGN (each in the OR-040 audit)
- The inline preview <div>, its 12px eyebrow and attribution, and its demo
  body: "You bought in 2019 for $712,000. Homes on Oakdale have recently
  sold for about $1,040,000." (A:485, :493, :43-45). The real email, with
  its MLS attribution, stays in the sandboxed iframe.
- The new swatch hexes (#0e9f6e, #b42d17, #5b3fb8). They change the email
  and reset saved accents (A:378-389, :489).
- Copy:
  - visible swatch names
  - "Pacific" for the timezone
  - "← Settings"
  - the reworded add-on blurbs (A:355, :357)
- The README's opacity motion and rgba hovers.

DECISIONS

A. Where the email preview goes. Default: under "How the email looks", as
   its own framed panel (DigestPreviewPanel framed), in the 760px column.
   - Drawn as specced, the sticky column is about 352px wide: 1200, less
     64px of margins, less 760, less a 24px gap. That leaves about 304px
     inside the panel.
   - The frame's max-w-full clamps both 600 and 380 to that, so the
     Desktop/Phone toggle would change nothing at 1440 as well as on
     phones. That is a dead control (invariant 1).
   - Under the form, the frame has about 710px. Desktop shows 600 and
     Phone shows 380, as they do today.
   - The sender-name and accent state stays in AppearanceForm, which
     renders the preview panel. page.tsx stays a server component.
   - settings-ui.test:8 pins `lg:grid-cols-2`. It is rewritten on purpose
     to pin the property that matters: the preview follows the live
     sender name and accent.
   - Say "sticky" to take the design's column. The toggle would then have
     to go, and that removes a working control.

B. The bill bar's brass total, muted footnote and slate divider. Default:
   refused.
   - None has a dark value or a checked pair (A:475, :486).
   - addons-ui.test:71 would go red on each: only text-on-bar and
     border-on-bar are allowed in the bar.
   - Say "tokens" to add all three as tokens, each with a dark value and
     a pair in tokens.test.

C. Billing's coloured statuses (the green "Active" chip and green "Paid").
   Default: plain text, as today.
   - The design colours two happy states and is silent on "Payment
     failed", "Set to end", "Ended" and "Not active". Colouring some
     statuses and not others invents a scheme the product hasn't defined.
   - Say "chips" to give every plan and invoice status a tag from the
     checked pairs. Then each status needs its own decision.

D. The add-on switch's off state. Default: keep it in --foreground.
   - The design draws off in --border: the track at 3.61:1, against
     --foreground's 17.9:1. It reads as unavailable, which is 05-open #9's
     problem.
   - A:138 flags it against §2.5.
   - Say "border" to take it. addons-ui.test:22 would then need to prove
     that off still reads as a choice, not a disabled control.

PROPERTY TESTS (each proven both ways)
- Every block on the four screens is a panel; the strips carry
  panelHeaderClass.
- Settings: the preview is DigestPreviewPanel framed, rendered by
  AppearanceForm, and fed by its live state. This replaces the
  lg:grid-cols-2 pin.
- In the browser, at 1440, settings' preview frame is 600px wide with
  Desktop pressed and 380px with Phone. Measured in showNote's prepare
  step, so a squeezed preview fails as a capture, not only as a
  screenshot difference.
- The swatches are at least 44px.
- Billing's plan rows are a <dl> through DetailsTable flush. The invoice
  links carry .tap.
- Cancel: one <form>, the Fixed strings, no banned words (as now).
- The bill bar: addons-ui:71 unchanged. Every colour in it is on-bar.
- The switch: off is --foreground, and off and on rows differ only in the
  switch (as now).

ACCEPTANCE CRITERIA
1. Existing tests pass. settings-ui.test:8 is converted on purpose and
   named. Fixed strings are unchanged.
2. The new property tests pass, each proven both ways.
3. Step 0 (three fresh-seed captures, the third after two match), then the
   exact comparison, all on one day. Expected to change:
   - settings
   - billing
   - billing-cancel
   - addons
   - addons-dark
   - addons-lender-form
   Everything else byte-identical.
4. Browser pass green at both widths. Settings' preview frame measured at
   1440 with Desktop and with Phone.
5. No dependency, no schema change, no copy change, no new colour token
   (under B's default).
6. Two deliberate breaks, each red in CI on its intended signal only, each
   reverted to an identical tree:
   - The preview moved into a 352px column: the settings prepare step is
     red (the frame is under 600px).
   - The bill total coloured with a literal brass: addons-ui:71 is red.
7. pnpm verify passes, CI green before merge.

DO NOT
- Move the email preview out of its iframe, or into a column too narrow
  for its own toggle
- Change a swatch's colour, or a Fixed string
- Add a status colour, a brass or a muted-on-navy without a token, a dark
  value and a pair
- Remove a control, a notice or a state the code has today
```

## Found while drafting, not absorbed

- **The sticky preview would kill its own toggle.** This is the third time
  a design has removed the mechanism that makes a control work. v0 dropped
  the delete confirmation. OR-045's design dropped "Add to group"'s submit
  at 390. This design makes the preview too narrow for Desktop/Phone to
  differ. Same root: a static comp shows the control, not what it does.
- **The sticky offset would sit under the view-as banner.** The banner is
  sticky at top-0, and a preview stuck at top:24px would slide under it.
  That is moot under A's default.
- **02-system's panel rule was over-stated.** I wrote "never as a wrapper
  in page.tsx" for the dashboard's pinned three-component page. It isn't
  a rule for Billing or Cancel, whose sections live in page.tsx today.
- **Unseen states, for OR-044a:**
  - Billing: almost all of it. Only the active state is captured, and
    there are six notices, past due, set to end and no plan.
  - Add-ons: lender on, call-list refused and on, and the texting band.
  - Settings: the phone states and both pause lines.

## Director's decisions

- A: the preview below the form. "A static comp shows the control, not what it
  does" goes into 01-constraints.md in OR-048.
- B: refuse the brass, the muted footnote and the slate divider.
- C: plain text for billing statuses. Colouring half a state machine makes the
  uncoloured half read as neutral.
- D: the switch's off state stays --foreground.
- Log in 05-open: anything sticky at top: 24px slides under the view-as banner.
