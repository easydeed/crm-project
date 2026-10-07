# OR-041 — Checks that measure the property

Drafted by the builder. Approved by the Director with Decisions A, B and C as
defaulted and the notes at the end.

```
TASK: OR-041
BRANCH: chore/property-checks

OBJECTIVE
Make the checks measure what their names say before any design is
applied:
- the phone tap-size check exempts only a link inside a sentence
- every test that pins an exact class string or whitespace on a screen
  the apply packets will touch asserts its property instead
No screen changes at 1440. At 390, the standalone links that the
narrowed check turns red are fixed, except those Decision A assigns.

WHY
OR-040 found 16 test failures in the Claude design. 7 of them were
tests pinning a string while the property they protect survived. Run
the apply packets against those tests and they produce noise in both
directions:
- red on a 2px border that changes nothing the test cares about
- green on things that matter, if the string happens to survive
The tap-size check is the twelfth finding: it passes standalone links
at 19 to 39px. The apply packets should be measured by checks that
work.

WHAT THE NARROWED CHECK FINDS TODAY
I ran the written rule over every captured screen at 390, signed in and
out. The rule: a link is inline only if its own parent holds text
outside it.

Six screens were measured in OR-039. The full sweep finds 13 kinds of
link on 10 screens:

| Screen | Link | Height today |
|---|---|---|
| home | "See the sample note" (button-styled) | 39px |
| home | "Create an account", "Sign in" | 23px |
| sample, sample-text-dark | "Back" | 23px |
| login | "Create an account" | 23px |
| register | "Sign in" | 23px |
| dashboard, dashboard-call-open | "Open settings" (button-styled) | 39px |
| dashboard, dashboard-call-open | "Open people" | 23px |
| people, people-bulk-bar | "Add people", "Review them" | 23px |
| people, people-bulk-bar | the four filter chips ("All (51)" …) | 23px |
| people, people-bulk-bar | every row's name link and "Edit" (51 rows, 102 links) | 19px |
| billing | "Settings" back link | 19px |
| billing-cancel | "Keep my plan" | 23px |

The one link the rule is meant to exempt stays exempt: "add those
here", inside a sentence on start-few.

SCOPE
1. e2e/checks.ts: isInlineLink becomes "the link's parent element has a
   non-empty text node of its own" (rule as written in 01-constraints
   §1.2). One function changes; nothing else in the check does.
2. Fix the red links (Decision A) with the existing .tap class. It is
   a 44px inline-flex box under 640px and nothing above, so 1440 cannot
   move. Button-styled links (`${buttonClass} inline-block`) take .tap
   too. Their 39px comes from the button padding; .tap is unlayered, so
   it wins over the layered inline-block on a phone.
3. Pinned-string tests become property tests (table below). A small
   test helper, src/test/jsx.ts, extends start-reskin's ancestor walk.
   It finds a JSX element by its text or by a {expression} child, and
   returns its className tokens and those of its ancestors and
   descendants, with shared-class identifiers (buttonClass,
   mutedClass, …) resolved to their strings. Test-only; no dependency;
   typescript is already used this way.
4. Docs:
   - 01-constraints §1.2: the exemption caveat goes, because the check
     now enforces the rule as written; record the twelfth finding as
     closed
   - §1.4: drop the bullet about standalone links
   - 05-open item 8: closed
5. Decision C items, if taken.

THE CONVERSIONS
Each row: the property, then the new assertion. Each new test is proven
both ways before the packet ships: a probe that breaks the property
must go red, and a cosmetic change that keeps it (the OR-040 design's
version) must stay green.

| Test today | Property it protects | New assertion |
|---|---|---|
| review-ui.test.ts:96, card exact class | Cards are outlined in --border, the OR-032 exception | The card <li>'s classes contain a border colour of border-border and none of border-rule; any width, radius or padding |
| start-reskin.test.ts:56, drop zone `border border-dashed border-border p-6` | The drop target's edge is dashed --border, never fainter | The drop zone's classes include border-dashed and border-border |
| start-reskin.test.ts:55, skeleton exact `<li>` | Skeleton rows fill with --rule | Each skeleton row fills bg-rule, with no opacity and no other bg |
| addons-ui.test.ts:72, bill bar exact class | The bar is the inverted pair at full strength | The bar fills bg-foreground with text-background. **Stronger:** no descendant carries a text-* other than text-background, muted ink, a bg-* or opacity. The OR-040 design's brass total and muted footnote would fail this. Today's test would pass them if the bar's own class string survived. |
| addons-ui.test.ts:83-85, settings-reskin.test.ts:13, `className={`mt-1 ${mutedClass}`}>{…}` | These secondary lines use mutedClass | The element rendering {row.rowNote}, {note}, {KEEPS_SETTINGS} and {children} carries mutedClass; spacing is free |
| settings-reskin.test.ts:18,20, cancel whitespace | "Cancel my plan" is the primary button; "Keep my plan" is a plain link to Billing | The <button> whose text is "Cancel my plan" has className={buttonClass}, alone or with layout-only additions. The <Link> whose text is "Keep my plan" has linkClass and href="/app/settings/billing". Indentation is free. |
| settings-reskin.test.ts:26-27, phone buttons | Every phone verification button shows the disabled state | Every <button> in phone-verification.tsx carries buttonClass |
| people-ui.test.ts:18,20, grid-cols string, flex-col | People shows name, address and status only, and stacks on a phone | Render the list (renderToStaticMarkup, as addons-ui does) with one row of each status. Each row has exactly a checkbox, the name link, the address, Edit and the status cell; no email, no phone. The string pins go. Layout is free. |
| people-ui.test.ts:59, `sticky bottom-0` | The bulk bar stays in reach while scrolling | The bar's classes include bottom-0 and either sticky or fixed |
| people-ui.test.ts:157, currentClass exact | The current filter is ink on blue-soft, marked by weight too | currentClass contains bg-blue-soft and font-semibold, and its text colour is text-foreground or absent; never text-blue |
| people-ui.test.ts:162, slice from `<p className="text-right">` | The status cell says only the schema status and "Unsubscribed" | Find the cell by its {contactStatusLabel(row.status)} child, wherever it sits. The words allowlist is unchanged. |
| sweep.test.ts:22, the toggle ternary | Unpressed toggles are outlined like controls; pressed is filled | The toggle's class expression: pressed branch fills bg-foreground; unpressed carries border-border |

Not converted, and why:
- top-bar.test.ts:24 (`bg-blue-soft` on the current link). It protects
  a property today. The marker changes on purpose in OR-043, which
  rewrites it against your navy decision.
- settings-ui.test.ts:17 (`lg:grid-cols-2`). It holds the preview beside
  its form, which is layout as product. OR-046 decides it.
- review-ui.test.ts:33-34 (`grid-cols-1`, `md:grid-cols-3`). The design
  keeps both.
- The token-pair assertions (`bg-${bg} text-${fg}`, people-ui:138,
  call-list:155). These already assert a property: the pair.

DESIRED BEHAVIOR

1. DECISION A — the People row links. Default: owned by the People
   packet, not fixed here.
   - Making each row's name and "Edit" 44px at 390 grows 51 rows by
     about 50px each, about 2,500px of scroll. The row is about to be
     redesigned in the People apply packet anyway: the Claude design
     moves Edit and changes the grid.
   - So the narrowed check gets one allowlist entry, in the shape of
     design-debt: { screen: 'people' and 'people-bulk-bar', links: row
     name and row Edit, owner: the People apply packet }. It fails both
     ways: a new small link is red, and a listed one that has become
     44px is red until its entry is deleted.
   - Every other link in the table is fixed in this packet.
   - Say "fix all" to fix the rows here too, at 390, now.

2. DECISION B — the helper's resolution. Default: resolve shared-class
   identifiers by importing ui.ts.
   - A test asking "does this element use mutedClass" should accept
     `${mutedClass} mt-2` and refuse a copy of mutedClass's string.
     shared-classes.test.ts already refuses copies across the tree, so
     the helper resolves identifiers and the two tests agree.
   - The alternative is matching identifier names only, which is
     simpler. It misses a screen that inlines the string, but
     shared-classes would catch that anyway.

3. DECISION C — fold in the two held items from OR-038. Default: yes.
   They belong to "checks that work":
   - PROJECT_STATE's enforcement note gains your "Probe with the real
     thing" paragraph, verbatim. This packet's two-way proof of every
     conversion is that rule applied.
   - e2e/screens.spec.ts gains the stale-build comment: Playwright
     serves `next start`, the last build; rebuild before any probe or
     capture.
   Say no to keep them for a later packet.

ACCEPTANCE CRITERIA
1. Every existing test passes, except the converted ones, which are
   replaced by tests of the same property.
2. Each conversion is proven both ways, by a local probe:
   - red when its property breaks
   - green on the OR-040 design's cosmetic version
   The report lists both results per test.
3. The narrowed check, run on today's main before the fixes, is red on
   exactly the links in the table above. After the fixes it is green,
   with only Decision A's entry listed.
4. The browser pass is 47/47 at both widths.
5. The desktop comparison (exact, OR-030a), from a fresh seed: 0 of 23
   screens change. .tap applies under 640px only. Phone captures change
   on 10 screens; the report names each with the measured height.
6. 01-constraints §1.2 and §1.4 and 05-open item 8 are updated;
   PROJECT_STATE per Decision C.
7. No dependency, no schema change, no copy change. No test loosened:
   every removed assertion maps to a stronger or equal property in the
   table.
8. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - The bill bar gains a muted footnote inside it. The new property
     test goes red. The old exact-string test would have stayed green,
     because the bar's own class didn't change.
   - "Keep my plan" loses .tap. The narrowed check goes red on
     billing-cancel at 390. The old check passed this link at 23px.
9. pnpm verify passes, CI green before merge.

DO NOT
- Apply anything from the Claude design
- Change the top-bar marker, the settings preview layout or the review
  grid (named above as not converted, each for a reason)
- Loosen any assertion into "contains some class"; each new test names
  its tokens
- Exempt a link by adding a stray text node to its parent
```

## Found while drafting, not absorbed

- **The six links measured in OR-039 were a sample, not the set.** The
  full sweep finds 13 kinds on 10 screens, including every People row.
  05-open item 8 understated it. The draft corrects it.
- **Carried to OR-043:** your dark-mode decision for the navy bar (its
  own dark token pair, not inverted), recorded here so the chrome
  packet starts from it.
- **Not in this packet:** the §7 doc changes for the next handoff:
  - mechanisms written down
  - dark artboards and behaviour annotations required
  - "sample content is the product's own output"
  - "Fixed means not reworded, split, restyled into pieces or removed"
  They change docs/ui-spec, not checks. I'd make them a short docs
  packet before the next design brief goes out, rather than widen this
  one.

## Director's notes on approval

- **A.** Allowlist the People row links, failing both ways, owned by the People packet
  (OR-045). Write the owner into the entry itself, not just the log: "the pattern that
  keeps biting is a list whose comment claims one thing while the list says another."
- **B.** Resolve shared-class names by importing ui.ts. "Any other approach is a second
  copy of the same facts."
- **C.** Fold in both held items.
- Proving each conversion both ways is "what separates a conversion from a rewrite".
  Without the second half, thirteen pinned strings become thirteen pinned properties
  that happen to agree with today's code.
- The §7 doc changes become **OR-048**, run after the apply packets: "A doc correction
  written before the design lands is a guess; written after, it's a finding."
- Dark mode for the navy bar (for OR-043): its own dark token pair, not inverted.
