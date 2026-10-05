# OR-035 — Re-skin: /app/start and import

Drafted by the builder. Approved by the Director with Decisions A and B as
defaulted. The Director's note: a token swap must not make something fainter than
it is today.

```
TASK: OR-035
BRANCH: feat/reskin-start

OBJECTIVE
Signup step 2 (/app/start) and /app/people/import restyled with the
OR-028 tokens. The MLS search, the closings list, the upload and paste
form, column mapping and the import result all stay as they are.
Clears the four start and import debt files and swaps this packet's
four linkClass copies. Adds the guard the MLS framing copy has never
had: that it renders at full contrast.

WHY
OR-026 settled how the MLS import is described: homes the agent sold,
written to whoever lives there now, usually the buyer, while past
clients come from the agent's own list. Those sentences are what stop
an agent mailing a stranger thinking it's a client.

The copy's own comment says "said plainly, at full contrast". No test
checks that. The tests check the words exist in START_COPY, not how
they render. A restyle is exactly when a sentence like that gets
greyed into a footnote.

The export has nothing comparable: no MLS search, no closings list,
no framing. Its "add people" is a modal with paste and upload. There is
nothing to borrow here except colour.

SCOPE
- start/start-flow.tsx (debt):
  - the where-to-find panel's border-foreground/20: --rule
  - the searching skeleton's bg-foreground/10. The debt note calls this
    the panel's tint; it is actually the skeleton rows. Decision A.
- start/closings-results.tsx (debt): the list's divide-foreground/15
  and border-foreground/15: --rule
- people/import/import-form.tsx (debt):
  - its local fieldClass (file input and textarea) border-foreground/20:
    --border. It keeps its own mt-2 and max-w-xl rather than the
    shared mt-1 and max-w-sm, so nothing reflows.
  - the drop zone's dashed border-foreground/30: Decision B
  - the drag-over tint bg-foreground/5: --surface
- people/import/column-mapping.tsx (debt): the select's
  border-foreground/20: --border
- the four linkClass copies from reskin-screen-log.md:
  - start/error.tsx, two links: `tap ${linkClass}`. No 15px today, but
    they sit in a 15px paragraph.
  - import-result.tsx's local linkClass (adds inline-block): becomes
    `${linkClass} inline-block`
  - import-result.tsx's <summary> (cursor-pointer, no 15px; inside 15px
    details): becomes `cursor-pointer ${linkClass}`
  Their rows leave "Found, not fixed".
- design-debt.test.ts: delete the four entries and the OR-035 owner
- new tests only. signup.test.ts, closings.integration.test.ts and the
  import tests stay exactly as they are.
- Out of scope:
  - every word in src/signup/copy.ts and on these screens
  - the import-form tab's selected underline. It marks a tab, not a
    link, and it carries state in weight and underline, not colour.
  - MlsAttribution's own styling (src/digest)

CURRENT STATE (read from the code)
- /app/start, top to bottom:
  - the intro (START_COPY.intro)
  - "Find my closings": an MLS agent ID field and a button
  - then one of four states:
    - a malformed ID: an inline error plus a where-to-find panel
    - searching: a skeleton list
    - found: the closings list
    - nothing: a neutral status line
  - "Upload a list": the import form, always shown
  - "Skip for now"
- The closings list:
  - each row is a checkbox, the address, the close date and price, and
    MlsAttribution
  - the listing-side framing note sits above the list, and the
    fewer-than-expected note when there are 1 to 4 closings
  - signup.test.ts holds the attribution on every row
- After import: addedLine ("…We don't get email addresses from the MLS,
  so add those next…") and the "Add their emails" link.
- Existing guards:
  - the framing words exist (signup.test.ts:88)
  - found-nothing is a status, never an alert, and is not
    "red|error|destructive" (:54)
  - the attribution renders on every listing (:71)

FOUND WHILE READING (closed by this packet's new test)
- Nothing tests that the framing sentences render at full contrast.
  intro, listingSideNote, fewNote, nothing and addedLine could all take
  mutedClass and every test would pass.
- The found-nothing test forbids the strings "red|error|destructive".
  text-coral-text contains none of them. A restyle that coloured the
  found-nothing line coral, the system's "something is wrong" colour,
  would pass. This is the word-list failure again, from the side PROJECT_STATE now
  warns about.
- One property test covers both. The element that renders each framing
  sentence carries no colour utility and no mutedClass, so it draws in
  --foreground. It is checked by finding the element around each
  START_COPY expression in the source, not by listing forbidden
  colours.

DESIRED BEHAVIOR

1. Debt as listed in SCOPE; all four entries and the OR-035 owner
   deleted.

2. DECISION A — the skeleton rows fill with --rule, not --surface.
   APPROVED: --rule.
   - The debt note says --surface. On white, --surface is 1.09:1 (1.15
     dark), and the rows would effectively vanish. The shape is the
     point of a skeleton: "a list is coming".
   - Today's foreground/10 is 1.23:1. --rule is 1.29:1 (1.43 dark),
     which keeps the shape at about today's weight with a token.
   - The rows stay static, so reduced motion still needs nothing.
   - Say "surface" to follow the note.

3. DECISION B — the drop zone's dashed edge in --border, not --rule.
   APPROVED: --border.
   - The debt note says --rule. Today's edge is foreground/30, 1.96:1.
     --rule (1.29:1) would make the drag target fainter than it is now,
     on the one screen whose job is getting a file in.
   - --border is 3.61:1 light and 4.22:1 dark. Dashed keeps it reading
     as a drop zone, not a field.
   - Same reasoning as OR-032's card exception: a boundary that tells
     you where to act. The file input inside already has its own --border
     outline, so either answer is accessible. This one is about not
     regressing.
   - Say "rule" to follow the note. The edge then gets fainter than
     today.

4. The framing sentences render at full contrast, in --foreground,
   with no muted ink and no status colour. The restyle changes no class
   on them. The test makes that permanent.

5. What we do not do, each for a reason:
   - The export's modal "add people" dialog. Our import is a page with
     a URL and a four-state result, which the import tests hold.
   - A spinner in place of the skeleton. The skeleton is static and
     needs no reduced-motion handling.
   - Colour on the import result's counts ("on the map", "need a
     look"). The People list carries status tags since OR-031. Here the
     counts are a summary sentence, and colouring them would repeat the
     list without adding anything.

ACCEPTANCE CRITERIA
1. signup.test.ts, closings.integration.test.ts and the import tests
   pass unchanged, including the attribution, framing-words and
   found-nothing tests.
2. New assertions:
   - Full contrast, by property: for each of START_COPY.intro,
     listingSideNote, fewNote and nothing, and addedLine(…), the JSX
     element that renders it carries no text-* colour utility, no
     mutedClass and no bg-* fill.
   - the skeleton rows use the Decision A token, and the drop zone edge
     the Decision B token
   - import-form, column-mapping and closings-results carry no
     foreground-opacity colour (also covered by design-debt)
   - start/error.tsx and import-result.tsx use linkClass, with no copy
     of its string
3. design-debt.test.ts: the four entries and the OR-035 owner are
   deleted, and the /app scan passes
4. The contrast test passes unchanged
5. The browser pass is 37/37 at both widths
6. The desktop comparison (exact, OR-030a), from a fresh seed, lists
   every changed screen. Expected:
   - import and the five start screens: the file input outline and the
     drop zone edge
   - start-few and start-found: the list dividers
   - start-malformed: the where-to-find panel
   The skeleton is not captured.
7. reskin-screen-log.md:
   - gains the OR-035 row
   - drops the four fixed linkClass rows from "Found, not fixed"
8. No dependency, no schema change, no copy change, no test loosened
9. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - Cleared debt returns: the closings list divider back to
     divide-foreground/15. design-debt.test.ts goes red as new debt,
     and nothing else.
   - The framing note greyed: listingSideNote's paragraph takes
     mutedClass. The new full-contrast test goes red. The existing
     framing-words test stays green, which proves the gap was real:
     before this packet, nothing would have caught it.
10. pnpm verify passes, CI green before merge

DO NOT
- Mute, shrink, colour or move any framing sentence, or put one behind
  a disclosure
- Make found-nothing look like an error in colour, role or words
- Remove or restyle MlsAttribution on any closing
- Change any copy, the four start states, or the import's four-state
  result
```

## Found while drafting, not absorbed

- None outside this packet's files. Both gaps above are closed by its
  own new test.
