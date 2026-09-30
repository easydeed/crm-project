# OR-031 — Re-skin: People

Drafted by the builder. Approved by the Director with Decisions A and B as
defaulted and the amendment at the end.

```
TASK: OR-031
BRANCH: feat/reskin-people

OBJECTIVE
The People list, the person page and the edit form restyled with the
OR-028 tokens. Same columns, filters, bulk bar, groups and delete
confirmation. Clears the four People debt files.

WHY
The largest screen in the app and the second most tested. It holds the
one confirmation the export would have removed entirely: delete.

SCOPE
- src/app/app/people/ui.ts: fieldClass's outline (debt)
- people-bulk-bar.tsx: the bar's divider (debt); the Delete button
  (Decision B)
- group-manager.tsx, [id]/add-to-group.tsx: secondary text (debt)
- people-list.tsx: the status column (Decision A)
- people-filters.tsx: the current filter marked like the top bar
- people-board.tsx, [id]/person-detail.tsx, [id]/edit/person-form.tsx:
  tokens only where they already use shared classes; no new structure
- src/app/design-debt.test.ts: delete the four entries
- src/app/app/people/people-ui.test.ts: new assertions only; all 11
  existing tests stay exactly as they are
- Out of scope:
  - /app/people/import (OR-035)
  - the review queue (OR-032)
  - everything under /admin

CURRENT STATE (read from the code)
- The list is a three-column grid,
  grid-cols-[auto_minmax(0,1fr)_auto]: a checkbox; the name, address
  and Edit link; a right-aligned status as plain text, with
  "Unsubscribed" on its own line. A test pins the columns and asserts
  no email, phone, engagement or candidates.
- Filters (status, group, missing email) are links: the current one is
  font-semibold with aria-current="page". The state lives in the URL.
- The bulk bar sticks to the bottom and exists only when something is
  selected. Its divider is border-foreground/20. Add to group, remove
  from group, Export and Delete all use the same foreground-filled
  buttonClass.
- Delete asks with window.confirm, using the tested copy: "…They'll stop
  getting the monthly note. If you import them again later, they'll come
  back." The person page asks the same way. The copy is pinned, and
  "cannot be undone" is forbidden.
- fieldClass (people/ui.ts) outlines inputs with border-foreground/20,
  about 1.5:1. It is shared by People, the edit form, the review queue's
  no-parcel panel, /app/start and the settings details form.
- group-manager.tsx and add-to-group.tsx use text-foreground/80 for
  secondary lines.

DESIRED BEHAVIOR

1. Debt:
   - fieldClass takes --border (3.61:1 on white, 4.22:1 dark)
   - the bulk bar's divider takes --rule
   - the two text-foreground/80 lines take mutedClass (--muted-ink)
   - all four debt entries are deleted
   Because fieldClass is shared, inputs on the review queue, /app/start
   and settings also get a visible 3:1 outline in this packet. The report
   lists those screens, as OR-030 did for mutedClass.

2. DECISION A — status as tags. APPROVED: yes.
   - The status column renders the same label text as a tag, using the
     call-tag pairs already in the contrast test:

     | Status        | Pair                          |
     |---------------|-------------------------------|
     | On the map    | --green-text on --green-soft  |
     | Needs a look  | --coral-text on --coral-soft  |
     | Couldn't find | --muted-ink on --surface      |
     | Unsubscribed  | --muted-ink on --surface, on its own line as now |

   - Text carries the meaning; colour only repeats it.
   - The column stays right-aligned, and the grid is unchanged.

3. DECISION B — Delete looks destructive. APPROVED: yes.
   - Delete becomes an outlined button: --coral-text words and a --border
     outline, on --background.
   - The other bulk actions keep the foreground fill.
   - It applies to the bulk bar and the person page.
   - The confirmation, its copy and window.confirm are unchanged: this
     restyles the button, not the question.

4. Filters: the current filter gets the top bar's treatment: --blue-soft
   behind it with --foreground text (15.30:1). aria-current stays. The
   links, their hrefs and the URL state don't change.

5. The person page and the edit form take tokens through the shared
   classes only. No layout change.

6. What the export has that we do not bring, each for a reason:
   - its engagement tags ("Opening", "Never opened", "Quiet"): only the
     statuses in the schema exist
   - search over email: the list columns and search are ours
   - the 140-row "Farm" scope: farming lists arrive through the MLS
     import, not a second view
   - delete on click with a toast: our delete asks first, and says a
     re-import brings them back
   - its 517-line component: ours stays split across files under 300
     lines

ACCEPTANCE CRITERIA
1. All 11 people-ui.test.ts tests and people-preview.test.ts pass
   unchanged, including:
   - name, address and status only
   - URL filters
   - the bulk bar only with a selection
   - groups staying on this page
   - four states
   - the edit form's defaults
   - the delete copy, never "cannot be undone"
2. New assertions:
   - each status maps to exactly its token pair
   - Delete is the outlined coral-text button, and the confirm copy
     sits beside it unchanged
   - the current filter carries bg-blue-soft and aria-current
3. design-debt.test.ts: the four People entries are deleted, and the
   /app scan passes
4. The contrast test passes unchanged: every pair used is already in
   it
5. The browser pass is 37/37 at both widths. The bulk bar stays sticky
   and its controls are at least 44px on phones.
6. The desktop comparison (exact, OR-030a) is run from a fresh seed,
   and every changed screen is listed with its reason. Expected:
   - people, people-bulk-bar, person-detail
   - review-queue and the start screens (fieldClass)
   - settings, if its details form renders fieldClass
7. docs/audits/reskin-screen-log.md gains the OR-031 row
8. No dependency, no schema change, no copy change, no test loosened
9. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - an engagement word ("Opening") rendered in the status column: the
     list-columns test goes red
   - "cannot be undone" added to the bulk bar's confirm: the delete-copy
     test goes red
10. pnpm verify passes, CI green before merge

DO NOT
- Add, remove or reorder a column, filter or bulk action
- Change the delete copy, or replace window.confirm with a custom dialog
- Use colour alone to carry a status
- Bring the export's engagement tags, farm scope or email search
- Touch /app/people/import, the review queue or /admin
```

## Amendment (Director)

```
Amendment to OR-031:

fieldClass reaches four screens across three packets. Report the input
outline's contrast before and after on each screen it touches — review
queue, /app/start, settings, People — so the log shows this as an
accessibility fix that happened to arrive early, not a styling change
that leaked.

That is the fourth shared definition to move a later packet's screens
early (mutedClass in OR-030, now fieldClass). Add a line to
reskin-screen-log.md naming the pattern: shared classes in people/ui.ts
move every screen that uses them, so a screen's baseline may change in a
packet that does not own it. It is expected, and each packet lists it.
```

Builder's note: the settings details form imports its own fieldClass from
settings/field.ts, not the shared one in people/ui.ts. The shared class
reaches People, the edit form, the review queue's no-parcel panel and
/app/start; settings is OR-034's.
