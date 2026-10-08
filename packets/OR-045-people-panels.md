# OR-045 — People and the person page

Drafted by the builder; approved by the Director with all three decisions as defaulted and one amendment.

```
TASK: OR-045
BRANCH: feat/people-panels

OBJECTIVE
/app/people and /app/people/[id] take the design's panels and table rows,
on the OR-044 panel class. Every group control stays. The row links reach
44px, so the two TAP_DEBT entries this packet owns come off the list.

WHAT THE DESIGN DRAWS (D:570-670, 900-978 People; D:673-755, 981-1062 Person)

People
- A title row with "Review them" and a primary "Add people".
- One panel. Its strip holds Search and four status chips.
- A "Select all" row.
- Ruled rows:
  - 22px checkbox
  - ink name link, 17px semibold
  - address, 15px muted
  - "Edit"
  - a status chip in a 124px column
  - the selected row on --surface
- "Export this list" sits under the panel. A "Groups" panel follows.
- A navy bulk bar with "Add to group", "Export" and "Delete".

Person
- A Details panel: a label column on --surface, muted.
- An "On the record" strip.
- An "Add to group" panel.
- "Preview their email", drawn as an inline <div>.
- Edit and Delete sit top right at 1440, and under "On the record" at 390.

Edit person: drawn at 390 only, as one "Their details" panel.
Per-person review: not drawn. It is a redirect today.

SCOPE
1. People list:
   - The page title row as drawn. The count line and both links stay.
   - One panel. Search and the filters move into its header strip. All
     three filter rows stay (Decision A).
   - Rows become the design's grid (sm: four columns):
     - The checkbox label keeps today's 44x44 at 390.
     - The name is ink: linkBaseClass + text-foreground, semibold 17px,
       underline on hover only.
     - The address is muted.
     - Edit is blue. The status keeps its text-right wrapper (A:473), with
       a 124px column from sm.
     - Rows divided by --rule. A selected row takes --surface; the
       blue-on-surface pair is already checked, 4.73:1.
   - "Export this list" stays a button.
   - GroupManager becomes a "Groups" panel. Rename, Delete group and the
     per-group counts all stay. They exist and work, so they are not
     dropped because the design left them undrawn.
   - The bulk bar per Decision B. "Remove from group" stays. "Add to
     group" keeps its button at 390, where the design drops it: a select
     with no submit would be a dead control.
2. Tap targets. The two TAP_DEBT entries owned by OR-045 are deleted:
   - The name link: .tap, so it is 44px tall at 390.
   - Edit: .tap and a 44px minimum width. It is about 27px wide today.
   tap-allowlist.ts fails both ways, so a stale entry also turns it red.
3. Person page:
   - Details: a panel with no strip. The <dl> keeps its semantics: dt
     labels in a --surface column, muted (140px, 104px at 390); dd values
     on the page. Every field stays, including "Updated by the homeowner
     on …", Notes, Calls and Groups.
   - "On the record": a panel with a strip heading, holding "{address} ·
     APN {apn}" and "Wrong house?" at 44px. The words are the same; the
     label becomes the strip. "Review this match" and "Fix the address"
     gain .tap.
   - Edit and Delete placed as drawn: top right from sm, under "On the
     record" at 390.
   - "Add to group": a panel with a strip. Both of its states stay, and so
     does "Manage groups" (A:491, A:517).
   - "Preview their email": a panel with a strip around the existing
     DigestPreviewPanel. It stays a sandboxed iframe, and the toggles keep
     their look (preview-panel.test, sweep.test).
4. Edit person: a "Their details" panel around the existing form. "Back to
   {name}" gains .tap.
5. Page column: the design's People width, measured from D:570 at build
   time and kept local to these screens (as OR-044's Decision C).
6. tokens.test.ts: the comment on muted-ink on --surface (4.56:1, no
   headroom) names its new dependents: the call panel's labels (OR-044)
   and the person Details labels. Comment only; the pair is unchanged.
7. Docs:
   - people.md, person-detail.md and person-edit.md updated
   - person-detail.md:88's stale "no preview captured" fixed (OR-043a
     captures the plain text)
   - a reskin-screen-log row

REFUSED FROM THE DESIGN (each quoted in the OR-040 audit)
- Dropping "Remove from group" (A:113, :180, :491) and "Manage groups"
  (A:114, :350, :491).
- The inline preview <div>, its 12px text, and its demo body: "is asking
  $1,065,000", "recently sold for about $1,040,000" (A:481-482, :497,
  :155). The real email, with its MlsAttribution, stays in the iframe.
- The current chip's blue words on --blue-soft, 4.42:1 (A:136). The
  current chip keeps ink words on --blue-soft.
- Copy:
  - "← Back to …" (the arrow)
  - the Edit page's "Change it and we re-check the house."
  - splitting the Fixed string "Saved. We re-checked the address." into a
    chip and a sentence (A:347, :493)
- The README's hover fills and hex hovers (#1F44CC, #1A2440); its opacity
  motion.

DECISIONS

A. The filters. Default: all three filter rows stay, restyled as chips in
   the panel strip.
   - The design draws Status only. Group and Email appear only when they
     apply, as today; the seed shows neither.
   - The current chip is --blue-soft with ink words, as now. Inactive
     chips have a --rule outline, 44px.
   - people-ui.test:190's pin on a local currentClass and exactly five
     aria-current links stays true.
   - Say "status only" to drop the other two. That removes working
     filters, so I'd not.

B. The bulk bar. Default: navy, as drawn, on the bar pair.
   - --bar, with words in --on-bar and focus rings in outline-on-bar. The
     bar is the system's only dark surface, and it is already tokenised
     for both themes (OR-042).
   - Export: a page-background button. Delete: page background with
     coral words, as destructiveButtonClass.
   - The selects use fieldClass.
   - It stays sticky at the bottom. people-ui.test:79 accepts sticky or
     fixed, and sticky can't cover the last row.
   - Two new pairs in tokens.test: on-bar on bar is already checked;
     background against bar NON_TEXT is added.
   - Say "light" to keep today's page-background bar with a rule on top.

C. The Edit page. Default: in this packet, structure only. One panel; no
   new words; the Fixed "Saved" string stays whole. Say "later" to leave
   it for OR-046.

PROPERTY TESTS (each proven both ways)
- The People list and each person-page block render inside panelClass.
  Strips carry panelHeaderClass.
- The row name link has no text-blue, and is ink by linkBaseClass +
  text-foreground. Edit carries .tap and a 44px minimum width.
- The current filter chip never has blue words. people-ui:190 already
  bans text-blue in the file, and stays.
- The bulk bar:
  - under B: --bar fill, --on-bar words, outline-on-bar focus
  - "Remove from group" present
  - an "Add to group" submit button at every width (no max-sm:hidden on
    it)
- The person page:
  - "Manage groups" links to /app/people
  - the preview is still an iframe with sandbox=""
  - dt labels on --surface in muted ink
- tap-allowlist.ts has no OR-045 entries. Its own both-ways rule keeps
  them from returning unused.

ACCEPTANCE CRITERIA
1. Every existing test passes, or is converted on purpose and named.
   people-ui.test's Fixed strings are unchanged.
2. The new property tests pass, each proven both ways.
3. Step 0 (three fresh-seed captures, the third after two match), then the
   desktop exact comparison, all on one day. Expected to change: people,
   people-bulk-bar, person-detail. Every other screen is byte-identical
   unless the report names it with a cause.
4. Browser pass green at both widths with both OR-045 TAP_DEBT entries
   deleted. people-bulk-bar at 390 is measured and its bar reported.
5. No dependency, no schema change, no copy change.
6. Two deliberate breaks, each red in CI on its intended signal only, each
   reverted to an identical tree:
   - Edit loses .tap: the mobile tap-44 check is red on people.
   - "Remove from group" is deleted from the bulk bar: people-ui.test is
     red.
7. pnpm verify passes, CI green before merge.

DO NOT
- Remove a group control, a filter or a field the code has today
- Draw the email preview outside its sandboxed iframe
- Put blue words on --blue-soft
- Add a hover fill, an rgba, a hex or opacity
- Add a TAP_DEBT entry
```

## Found while drafting, not absorbed

- **The design drops "Add to group"'s button at 390** (D:969-974), leaving
  a select with nothing to submit it. The audit didn't list this. It is the
  same dead-control shape as Skip-as-a-link, and the packet keeps the
  button.
- **The design's preview text would break two rules at once**: a price
  with no document number beside a street figure that reads like a value
  estimate. The real email already handles both.
- **States with no capture on these screens** go to OR-044a. The list is
  long: empty list, no results, Group and Email filters, populated groups,
  enabled bulk actions, the Unsubscribed tag, view-as, needs-review and
  couldn't-find person pages, the HTML preview, the edit screen and the
  per-person review entry.

## Director's decisions

- A: keep all three filter rows. "The comp doesn't show it" is not a reason
  to delete behaviour.
- B: navy bulk bar on the bar tokens; Export and Delete on page background;
  background-against-bar as a NON_TEXT pair.
- C: the edit page in this packet, structure only.

## Amendment

```
The Edit link is ~27px wide today and needs a 44px minimum width, not
just .tap. Report its measured width and height at 390 after the fix,
not just that the check passes — the tap rule is about the smaller
dimension, and a link that is 44 tall and 30 wide satisfies a height
check while failing the rule.
```
