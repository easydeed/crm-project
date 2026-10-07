# OR-042 — System tokens and shared classes

Drafted by the builder. Approved by the Director with Decisions A, B, C and D as
defaulted, the correction accepted, and the amendment at the end.

```
TASK: OR-042
BRANCH: feat/system-tokens

OBJECTIVE
Put the Claude design's system into the two places every screen
already reads from:
- the tokens in src/app/globals.css
- the shared classes in src/app/app/people/ui.ts and status-tag.ts
Every pair is checked in light and dark before anything renders it.
No screen's markup changes in this packet. Every screen moves only
because a shared class it already uses moved.

WHY
OR-043 to OR-047 build on this. A pair that is wrong here is wrong on
every screen after it. OR-040's worst findings were all here:
- a navy surface that turned light in dark mode
- brass and a muted footnote with no dark value
- blue words on blue-soft
- a token rename that would have repointed --green
OR-041 made the checks measure properties, so this packet is measured
by checks that work.

A CORRECTION FIRST
Your navy decision says the dedicated pair is "the pattern already used
for the inverted bill bar in OR-033, which has survived two packets".
It isn't. The bill bar is `bg-foreground text-background`
(src/app/app/addons/bill-bar.tsx:9), and --foreground is #ededed in
dark. In dark mode the bill bar is already a light bar on a dark page:
exactly the inversion you've ruled out for the top bar. It survived
because nothing renders it in dark: no dark capture includes /app/addons.
So "don't invert" has no precedent yet; this packet creates it. Decision
C asks whether the bill bar follows.

SCOPE
1. Tokens (globals.css, light and dark)
   - --rule darkens one step, from the design (README:28):
     - light #dce3ee → #c9d2e0 (1.29 → 1.52 on the page)
     - dark #262d3a → #2e3644 (1.43 → 1.63). The design gave none.
       This is the same proportional step, and still decorative.
   - New: the bar pair, for every dark surface (Decision A). Light
     values are the design's; dark values are mine, computed below.
     | Token | Light | Dark | For |
     |---|---|---|---|
     | --bar | #0e1729 | #202b4f | the navy surface |
     | --on-bar | #ffffff | #ededed | words, links and the focus ring on it |
     | --bar-current | #ffffff | #ededed | the current-page pill |
     | --on-bar-current | #0e1729 | #0a0a0a | words on the pill |
   - Not added, each for an OR-040 reason:
     - brass #d4a84b: no dark value would hold on any bar
     - --on-navy-muted: muted on an inverted surface
     - --navy-rule
     - hover #1f44cc and #1a2440, and rgba(255,255,255,.12): hover
       carries no information; underline and the existing fills
       already show it
     - the --rust / --green renames: --coral-text and --green-text
       stay as named
2. tokens.test.ts PAIRS gains:
   - on-bar / bar, TEXT
   - on-bar-current / bar-current, TEXT
   - bar-current / bar, NON_TEXT (the pill's edge)
   - on-bar / bar, NON_TEXT (the focus ring on the bar)
   - blue / surface, TEXT, only if Decision B is yes
3. Shared classes (ui.ts), following README:70-82:
   - buttonClass: 48px minimum height, 17px semibold, wider padding.
     disabledClass is unchanged.
   - secondaryButtonClass, new. It promotes call-entry.tsx's local
     secondaryClass, a copy that has dodged the shared-classes check
     because it isn't a copy of buttonClass. Background fill, 1.5px
     --border, 17px semibold, 48px.
   - destructiveButtonClass becomes secondaryButtonClass's shape with
     --coral-text words, which is exactly what the design draws.
   - fieldClass: 48px, 1.5px --border, 17px text.
   - linkClass: 17px, and blue if Decision B is yes. The
     underline-offset and focus outline stay.
   - mutedClass: unchanged, 15px --muted-ink.
   - sendCardClass: --rule border (now darker), radius as the design's
     panel.
4. status-tag.ts and call-tags.ts: the shared tag shape becomes the
   design's chip: 15px semibold, 8px 12px padding, 6px radius. Every
   pair stays the one tokens.test checks.
5. The bill bar moves to the bar pair (Decision C), so the new tokens
   have a real use in this packet and no token ships unrendered.
6. A new dark capture: addons-dark, which renders the bill bar and the
   switch in dark. The bar pair is then held by a capture, not only by
   ratios.

THE BAR PAIR, COMPUTED
| Pair | Light | Dark | Floor |
|---|---|---|---|
| --on-bar on --bar | 17.90 | 11.80 | 4.5 |
| --on-bar-current on --bar-current | 17.90 | 16.91 | 4.5 |
| --bar-current against --bar (pill edge) | 17.90 | 11.80 | 3 |
| focus ring (--on-bar) on --bar | 17.90 | 11.80 | 3 |
| --bar against the page (does it read as a bar) | 17.90 | 1.43 | decorative |
| --bar against --surface | 17.90 | 1.25 | decorative |

The dark bar candidates I tried, by separation from the page:
#141c33 (1.17), #1a2240 (1.27, already --blue-soft dark), #202b4f
(1.43), #24305a (1.55). I chose #202b4f:
- it separates from the page as much as --rule does today (1.43)
- it is not --blue-soft's value, so a current filter chip can never
  look like the bar
- --muted-ink and --blue would still clear 4.5 on it (5.45 and 5.27),
  though neither is paired there
The pill is the light thing on the dark bar in both themes. That is
what keeps the bar reading as the bar.

DESIRED BEHAVIOR

1. DECISION A — the bar pair as four tokens. Default: yes.
   - The bar, its words, its current pill and the pill's words. These
     are the pairs the top bar (OR-043), the bulk bar (OR-045) and the
     bill bar need.
   - The view-as banner is INK_COLOR #0E1729, which is the light --bar
     value: 1.00:1 against it. OR-043 must change the banner. It is
     named here so the token isn't chosen around a conflict nobody has
     seen.
   - The alternative is two tokens (bar and on-bar), with the pill
     reusing --background and --foreground. In dark that is a black
     pill on a navy bar, 1.43:1 at the edge, so the current page
     barely shows. Say "two tokens" if you'd rather.

2. DECISION B — blue text links. Default: yes, for text links only.
   - The design's links are --blue (README:30, :75). You said blue earns
     a place as a system decision, not a marketing one; this is that
     decision.
   - For: links read as links without relying on the underline alone,
     for this user at this distance.
     - 5.17:1 light and 7.55:1 dark on the page.
     - Blue on --surface is 4.73 and 6.58, added as a checked TEXT
       pair so a link in a called row or a panel strip is held.
   - Never blue:
     - nav links
     - filter chips
     - button-styled links
     - anything on --blue-soft (4.42:1, the §2.3 rule)
     These stop using linkClass's colour. They don't override it
     afterwards, because two text-colour utilities on one element are
     settled by stylesheet order, not class order. currentClass's
     text-foreground beside a blue linkClass would be exactly that
     race.
   - Say "ink" to keep links in the surrounding text colour. Then the
     blue-on-surface pair is not added, and --blue stays unused.

3. DECISION C — the bill bar onto the bar pair. Default: yes.
   - Today it inverts to a light bar in dark. On the bar pair it stays
     navy in both themes, like the top bar will.
   - The OR-041 property test changes deliberately: "the inverted pair
     at full strength" becomes "the bar pair at full strength". It
     names --bar and --on-bar, and still refuses muted ink, other text
     colours, fills and opacity inside it.
   - Say no to keep it inverting, recorded as the one surface that does.

4. DECISION D — the panel class. Default: not in this packet.
   - The panel (--rule border, 12px radius, --surface header strip) is
     the design's strongest idea. But a shared class with no user is
     code nothing renders.
   - It arrives with its first user, OR-044 (dashboard), and is
     shared from that day.
   - The same goes for labelClass (16px semibold) and the 24px h1. Those
     are per-screen today, so each screen packet adopts them as it is
     restyled.
   - Say "now" to define the panel here and apply it in 044 to 047.

ACCEPTANCE CRITERIA
1. tokens.test.ts:
   - every token has a light and a dark value
   - every new pair clears its floor in both schemes
   - the ratios in this draft are the test's
2. No colour anywhere that isn't a token. The design-debt scan is
   unchanged and green.
3. shared-classes.test.ts: call-entry's secondaryClass is gone,
   replaced by secondaryButtonClass. No copies anywhere.
4. Property tests, each proven both ways as in OR-041:
   - buttonClass, secondaryButtonClass and fieldClass are at least 48px
     tall (min-h-12) and 17px
   - destructiveButtonClass is secondaryButtonClass plus --coral-text,
     and never filled
   - with Decision B: linkClass is text-blue, and no element combines
     linkClass's colour with a fill of --blue-soft
   - the bill bar per Decision C
5. The browser pass is 49/49: 47 plus addons-dark at both widths.
   Every control is ≥44px at 390; that is free at 48px.
6. The desktop comparison (exact), from a fresh seed, lists every
   changed screen with its reason. Expected: nearly all 23, because
   buttons, inputs and links grow. The report names any that don't
   move, and why.
7. 02-system.md updated:
   - tokens
   - pairs with ratios
   - the shared classes table
   - the bar pair and why it doesn't invert
8. No dependency, no schema change, no copy change, no test loosened.
9. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - The bar pair loses its dark value: --bar has no entry in the dark
     block. tokens.test goes red on "every colour token has a light and
     a dark value". This is OR-040's brass, caught.
   - A muted footnote on the bill bar, the design's on-navy-muted. The
     bar property test goes red.
10. pnpm verify passes, CI green before merge.

DO NOT
- Change any screen's markup, copy, layout or h1
- Add brass, on-navy-muted, navy-rule, hover colours or any rgba
- Rename --coral-text, --green-text or any existing token
- Use --blue for words on --blue-soft, for nav links or for chips
- Touch src/digest (the email keeps its own design)
```

## Found while drafting, not absorbed

- **The bill bar inverts in dark today** (the correction above). Not
  seen because no dark capture includes it. Decision C, and the new
  addons-dark capture, close it.
- **call-entry.tsx's secondaryClass is a second button style that the
  shared-classes check can't see.** That check looks for copies of
  buttonClass's string, and this is a different string doing a shared
  job. Promoted in this packet. It is the same species as the earlier
  copies: a check that finds copies of one thing, not every
  shared-style job done locally.
- **For OR-043:** the view-as banner is the same colour as the light
  bar (1.00:1). It must change when the bar becomes navy.

## Director's notes on approval

- The correction is accepted. "The reasoning I gave was right and the evidence was wrong." The
  decision stands; this packet sets the precedent rather than following it.
- C: the bill bar moves onto the bar pair, with an addons-dark capture behind it.
- A: four tokens. The pill stays the light thing on a dark bar in both themes.
- B: blue for text links only. Nav links, filter chips and button-styled links take ink explicitly
  and stop inheriting, because relying on cascade order "works until someone reorders a class
  string".
- D: no panel class yet; it ships with its user in OR-044.
- call-entry's secondary button folds in, under the check that already exists.

## Amendment (Director)

```
Amendment to OR-042:

Add an addons-dark capture, and while the capture set is being touched,
add a dashboard-dark capture too. The bill bar's inversion went unseen
for three packets because dark mode is captured on exactly one screen
(sample-text-dark). Two is not coverage either, but the dashboard is
where the new bar tokens, the call tags and the send card all meet, and
it is the screen an agent opens most.

Report what the dashboard-dark capture reveals. If it is clean, say so.
```
