# OR-044 — The dashboard, and the panel class

Drafted by the builder; approved by the Director with all three decisions as defaulted.

```
TASK: OR-044
BRANCH: feat/dashboard-panels

OBJECTIVE
The dashboard takes the design's panels, built from one shared panel class
that the later screen packets reuse. The design's structure is taken. Its
sample sentences are not: the dashboard keeps the product's real ones.

WHAT THE DESIGN DRAWS (App Screens v2, D:819-898 at 390, D:1118-1183 at 1440)
- Three blocks in a 760px column. Today the column is 672px.
- Send card ("hero"): a plain panel, with no header strip.
  - Its h1 is 24px at 1440.
  - "Preview it" is the primary button and "Skip this month" a link. Today
    it is the other way round.
- "Worth a call this month" is a panel:
  - a --surface header strip, 19px semibold
  - rows divided by --rule
  - a 26px numeral on each row
  - name 19px, sentence 17px
  - a secondary "Call" button
- The open call panel:
  - a two-column table, with labels in a --surface cell
  - rows: Phone, Email, House, On the record
  - then "Mark as called" (primary) and "Not now" (secondary)
- "Your homeowners" is a panel with a header strip.
- Not drawn: loading, empty, error, quiet, paused, called, dismissed,
  undo, the text notice, "Recorded against the property", and dark mode.

SCOPE
1. The panel class, in people/ui.ts. It is the design's "every grouping
   is a panel".
   - panelClass: border border-rule, rounded-xl, overflow-hidden, on the
     page background.
   - panelHeaderClass: bg-surface, border-b border-rule, 19px semibold,
     px-5 py-3.5, sm:px-6.
   - The send card keeps sendCardClass. It is the plain variant (no strip)
     and already rounded-xl on --rule. Its padding moves to the design's
     values.
   - Panels go inside the components, never as wrappers in page.tsx.
     call-list.test.ts:78 pins page.tsx to three components, and it stays
     unchanged.
2. Send card: the scheduled state's actions follow Decision A. The h1 goes
   to 24px at sm and up. Every other state keeps its one action.
3. Call list:
   - a panel with its header strip
   - rows divided by --rule
   - numerals per Decision B
   - name 19px, sentence 17px, meta stays 15px muted
   - Call/Close become secondaryButtonClass, as drawn
   - Mark as called stays primary, Not now stays secondary
   - The quiet line, the empty states, the text notice, and the called and
     dismissed rows all render inside the same panel body. That covers
     every state the design didn't draw.
4. Call panel:
   - The <dl> becomes the design's two-column table, labels in --surface
     cells with muted ink. That is 4.56:1, the tightest allowed pair,
     stated and tested.
   - The tel: and mailto: links keep .tap. The audit measured them at 26px
     as drawn (A:131).
   - The content stays the code's:
     - "On the record" is renderRecord
     - "Recorded against the property" is renderLoan, with its heading
     - "Nothing recorded on this house yet."
5. Homeowners: a panel with its header strip. The body keeps today's
   sentence and the "Open people" link.
6. Column width 672 → 760px on the dashboard only (Decision C).
7. Dark mode: panels use rule, surface and background only. All three
   have dark values, so it follows.
8. Docs:
   - 03-screens/dashboard.md rewritten
   - 02-system gains the panel class, and its stale "rounded-lg" for the
     send card is fixed
   - 05-open #14 closed or kept, per Decision A
   - a reskin-screen-log row

REFUSED FROM THE DESIGN (each quoted from the OR-040 audit, §6)
- The demo call-list sentences: "1187 Oakdale Ave just listed. Four doors
  down." and "Taxed on $817,800. His street sells near $1,040,000."
  - They turn a recorded sale into a listing and rewrite the tax template.
  - The real sentences come from src/signals/*.
- "On the record: 1187 Oakdale Ave listed at $1,065,000…" (D:857).
  - It is an MLS listing under a recorded label, with no MlsAttribution.
  - That breaks invariant 9 and the recorded/MLS rule.
- "51 people on your list. 44 are matched to a house."
  - It needs a new query, and it is a counter on the dashboard.
  - Refused in A:494. The current sentence stays.
- The "height/opacity" motion (R:191). Opacity never shows state.
- Literal hexes. Every colour is a token.

DECISIONS

A. "Preview it" and "Skip this month". Default: take the swap.
   - Preview becomes the primary button, a link to the preview.
   - Skip becomes a form button styled as a link (linkBaseClass +
     text-blue, 44px tall). It stays a server action, never an anchor:
     an <a> can't post, so it would be a dead control.
   - Why: skipping a month is the less common, less reversible-feeling
     choice, and the primary button should be the safe one.
   - sendCardClass's comment changes from "at most one action" to "at
     most one primary action". 05-open #14 closes as decided.
   - Say "keep" to leave Skip as the primary button and Preview as the
     link. #14 then stays open.

B. The row numerals. Default: ink, 26px bold, aria-hidden. The list
   changes from <ul> to <ol>, so screen readers count it.
   - The design draws them blue. OR-042 decided blue is for text links
     only, and a blue numeral reads as a link.
   - Say "blue" to allow it as a second use of --blue. 02-system and
     system.test would then name numerals as allowed. 5.17:1 on white.
   - Say "none" to drop them. The order still shows the ranking.

C. The 760px column. Default: dashboard only.
   - The other screens take it in their own packets, if their designs
     draw it.
   - Say "everywhere" to put it in a shared class now. Every /app screen
     would then move in this packet.

NOT IN THIS PACKET
- linkClass to 17px. It is shared: moving it moves every screen with a
  link. The dashboard's links stay 15px for now. I propose the one global
  move ride with OR-047, the last apply packet, so screens don't shift
  twice.
- 05-open #13: the empty call list and the quiet line name no next
  action. That's a copy decision. It stays open, and it is the next
  four-states gap on this screen.

PROPERTY TESTS (each proven both ways)
- Panels: each of the call list and homeowners renders:
  - an element with panelClass's shape (border-rule, rounded-xl)
  - a header carrying bg-surface, a border-b rule and 19px semibold
  - its h2 inside that header
  The send card is the plain variant: no bg- fill on it, and no header
  strip.
- Call panel:
  - labels on bg-surface with text-muted-ink
  - values on the page background
  - tel: and mailto: links carry .tap
  - "Recorded against the property" is still rendered from renderLoan
- No blue numeral (under the default B). system.test already holds blue
  to page and surface.
- Under A:
  - Preview it is the primary-shaped link
  - Skip this month is a <button> inside a <form> with its action, never
    an <a>
- Call/Close carry secondaryButtonClass. disabled-state.test's pin on
  call-entry.tsx is checked rather than loosened.

ACCEPTANCE CRITERIA
1. Every existing test passes, or is converted on purpose and named in the
   report.
2. The new property tests pass, each proven red on a break and green on a
   cosmetic change.
3. The desktop exact comparison, after step 0 (three fresh-seed captures,
   the third after two match). Expected to change:
   - dashboard
   - dashboard-dark
   - dashboard-quiet
   - dashboard-quiet-dark
   - dashboard-call-open
   Every other screen is byte-identical, unless the report names it with a
   cause. The baseline and the comparison are taken on the same day.
4. Browser pass green at both widths. At 390, the tel: and mailto: links
   are at least 44px tall.
5. No dependency, no schema change, no copy change except under Decision
   A's emphasis (no words change). No test loosened.
6. Two deliberate breaks, each red in CI on its intended signal only, each
   reverted to an identical tree:
   - The call list's header strip loses bg-surface: the panel test is red.
   - The tel: link loses .tap: the mobile browser pass is red on tap-44,
     and the unit tests stay green.
7. pnpm verify passes, CI green before merge.

DO NOT
- Use a design sentence in place of a signal's real sentence
- Put an MLS figure under "On the record", or anywhere without
  MlsAttribution
- Add a count, a percentage or a tile
- Wrap the page's components in page.tsx
- Use opacity, a hover fill, an rgba or a literal hex
```

## Found while drafting, not absorbed

- **02-system and dashboard.md say `rounded-lg` for the send card.** The
  code has been `rounded-xl` since OR-042. Fixed in this packet's docs.
- **The design's "Call" is secondary.** The audit didn't flag the
  primary-to-secondary change. I'm taking it as drawn and naming it here,
  so it isn't a silent emphasis change.
- **OR-042's deferral of the panel class isn't written down in the repo.**
  It lives only in the packet conversation. This packet's 02-system entry
  will be its first record.

## Director's decisions

- A: take the swap. Skip is a form button styled as a link: an `<a>` can't
  post, so it would be a dead control.
- B: ink numerals, aria-hidden, in an `<ol>`.
- C: 760px on the dashboard only.
- Fix the stale `rounded-lg` in 02-system and dashboard.md.
- 02-system records the panel class (and that OR-042 deferred it).
- linkClass to 17px rides with OR-047. 05-open #13 stays open: Jerry's call.
