# OR-038 — Re-skin: marketing

Drafted by the builder. Approved by the Director with Decisions A, B, C
and D as defaulted and the amendment at the end.

```
TASK: OR-038
BRANCH: feat/reskin-marketing

OBJECTIVE
Restyle / and /sample in place with the OR-028 tokens, and give the
home page the Fraunces display type the font was bundled for. Same
story, same words, same three links. Bring both pages, and /sample's
plain text in dark mode, under the browser pass and the exact desktop
comparison for the first time. Close two holes the drafting found in
the checks marketing now sits under.

WHY
This is the only screen a prospect sees before deciding anything, and
it is the last one nothing measures. It also enters under the
whole-tree scan, clean. Before adding colour and type under those
checks, I tested whether they would catch the export's two signature
moves. Neither would:

1. Fraunces outside marketing. design-scope.test.ts is titled
   "Fraunces stays on the marketing page", but it checks a list of four
   directories. I put font-serif on the shared preview panel's heading
   (src/app/digest/preview-panel.tsx). That panel renders on the person
   page and in settings, as well as on /sample. design-scope stayed
   green: 4 passed. This is the scope species again, the tenth check.
2. The export's shadows. The audit counts 14 arbitrary shadows, all in
   marketing or auth, all built on rgba(14,23,41,a). I put one on the
   home CTA. design-debt stayed green: 3 passed. The same file with
   text-[#0e1729] goes red. The scan matches a colour by its notation,
   hex or a utility name, not by being a colour. That is the eleventh
   check, the keyword species.
Both were trialled locally and reverted; the tree is clean on main.

SCOPE
- src/app/home-story.tsx: the restyle (Decisions A and B)
- src/app/sample/page.tsx: tokens only. It is already on linkClass and
  the shared panel, so I expect nothing to move.
- e2e/screens.ts: home, sample and sample-text-dark join SCREENS
  (Decision C), in a capture-only first commit
- design-scope.test.ts: Fraunces checked across the whole tree by
  allowlist (Decision D)
- design-debt.test.ts: the colour rules gain functional notation:
  rgb(), rgba(), hsl(), hsla(), oklch(), oklab(), lab(), lch(), hwb()
  and color-mix(). I grepped src/app: nothing carries any today, so
  this adds no entries.
- docs/audits/OR-027-v0-audit.md: one correction. Lines 129, 438 and
  463 say the marketing page is out of scope or off-limits. You retired
  that rule in OR-028, because the page now lives in this repo. Each
  line keeps its text and gains a note saying so, rather than being
  rewritten.
- reskin-screen-log.md: the OR-038 row, and the re-skin marked done
- Out of scope:
  - every word on / and /sample
  - the email itself (src/digest), and the panel's iframe canvas
  - /admin, /u, /login and /register

CURRENT STATE (read from the code)
- / is HomeStory in a centred max-w-xl column:
  - the "onrecord" wordmark (a <p>, 15px semibold)
  - the h1 "A note about their house, from the county record." in Inter,
    26px semibold
  - five 17px paragraphs, all from canonicalFacts: the address and
    name, the street median, what the county taxes, the difference, and
    that California lets some homeowners carry it
  - "See the sample note" (buttonClass), then "Create an account" and
    "Sign in" (linkClass)
- /sample has the wordmark, DigestPreviewPanel ("A sample note for
  Marilyn", from fullDigest()) and a "Back" link.
- No hex, opacity colour or palette colour on either page. --blue is
  used nowhere in src/app.
- Fraunces is loaded (fonts.ts, weights 500 and 600) and mapped to
  --font-serif in globals.css. No rendered element uses it.
- Neither page is in SCREENS. I probed /, /sample and /sample's plain
  text in dark mode, signed out, at 390 and 1440 against the existing
  layout rules. 7 passed, no problems.

WHAT THE EXPORT DOES, AND WHAT WE TAKE
Taken:
- Fraunces as the display face (Decision A)
- Its quietness. The export's hero h1 is actually Inter at weight 680.
  Fraunces appears on section headings, at weight 500 to 560, with
  slight negative tracking. That is the register I'd use.

Not taken, each for a reason:
- The eleven sections. Each one is new copy, and new copy is a claim
  (invariant 5). Copy is Cursor's, and positioning is yours (see
  "Found").
- "Three past clients… We tell you which three" and call-list.tsx.
  These promise clients. OR-026 settled that MLS homes go to whoever
  lives there now.
- proof-band: count-up figures ("1 state", "4 minutes", "$19/mo"). It
  is a stat band (no stat cards), and the animation is motion we would
  then have to gate.
- The footer's href="#" links (invariant 1), and its privacy and terms
  links. Those pages do not exist in src/app.
- The mobile menu. It is still tabbable when closed (the audit,
  line 242), and the page has three links.
- scroll-fx (parallax and reveal) and the animated SurveyPlat
  background. Neither carries anything, and the plat sits at
  opacity 0.14.
- The 14 rgba ink shadows and the blue glow on the CTA. After this
  packet, the scan catches them.
- "Prop 13 saves $2,600/yr" as a pill. Our page says what the
  difference is. A pill reading "saves" moves it towards a consumer
  benefit claim.

DESIRED BEHAVIOR

1. DECISION A — Fraunces on the home <h1> only. Default: yes.
   - font-serif, weight 500 (bundled), tracking -0.01em,
     text-[32px] with sm:text-[40px], leading-tight, --foreground.
     These sizes are the export's section-heading range, scaled to a
     max-w-xl column.
   - The wordmark stays Inter. It is the same mark on /login and
     /register, which may not carry Fraunces, and one brand mark in two
     faces is worse than one in the plainer face.
   - /sample stays Inter. Its only heading belongs to the shared panel,
     and Decision D keeps that panel Fraunces-free.
   - The five paragraphs stay Inter, 17px, --foreground. They are the
     facts, and nothing on this page is muted.
   - Say "wordmark too" to set the home wordmark in Fraunces as well.
     Login and register would then show a different mark.

2. DECISION B — the CTA stays buttonClass. Default: yes.
   - "See the sample note" keeps the product's one primary style
     (--foreground fill). A prospect then sees the same button they
     will press inside the app.
   - The alternative is the export's blue CTA, bg-blue with
     text-on-blue. The pair is already in tokens.test.ts, so it is
     accessible in both themes. It would be the first use of --blue in
     src/app, and a marketing-only button class: a second primary style
     that shared-classes would then have to own.
   - Say "blue" for that. The glow shadow stays out either way.

3. DECISION C — capture the marketing. Default: yes.
   - SCREENS gains:
     - { name: 'home', path: '/', loggedOut: true }
     - { name: 'sample', path: '/sample', loggedOut: true }
     - sample-text-dark: /sample, logged out, in dark mode, with
       "Plain text" pressed
   - Screen gains an optional colorScheme. openScreen calls
     page.emulateMedia({ colorScheme }) before navigating. That is the
     only change to the harness.
   - sample-text-dark answers your carry-forward: the OR-037 dark-mode
     preview fix is held by a test and not a capture. After this, both.
   - The first commit makes this change alone, so all three have a
     measured "before". 20 to 23 screens; 41 to 47 browser checks.
   - Say "no dark capture" to add only home and sample.

4. DECISION D — the Fraunces check inverts to an allowlist over the
   whole tree. Default: yes.
   - Every file under src that names Fraunces or font-serif must be one
     of: fonts/fonts.ts, globals.css, layout.tsx (it puts the font
     variables on <html>), and home-story.tsx.
   - It fails both ways, like design-debt: a new file is red, and a
     listed file that no longer names it is red.
   - This replaces the four-directory test. It does not sit beside it,
     because the new one covers those directories too. The test keeps
     its name, which is now true.
   - The alternative is adding app/digest to the directory list. That
     fixes today's hole and leaves the next one: /u, the root error
     page, and any new route.

5. The functional-colour rules in design-debt. These are not a
   decision. They are how marketing enters "clean" meaning what it says.

ACCEPTANCE CRITERIA
1. Every existing test passes unchanged, including marketing.test.ts
   (one Oakdale story), except:
   - design-scope's Fraunces test is replaced by Decision D's
   - design-debt's rules gain functional notation, with no new entries
2. New assertions:
   - the home <h1> is font-serif, and is the only element on / that is
   - Fraunces allowlist, whole tree, failing both ways (Decision D)
   - home-story uses buttonClass and linkClass, with no copy of either
     string (shared-classes already holds this; checked, not assumed)
   - design-debt: a probe file carrying rgba(…) is reported as debt.
     This is a test of the rule itself, so it cannot be vacuous.
3. design-debt.test.ts holds the same permanent entries as now
4. The contrast test passes unchanged
5. The browser pass is 47/47 at both widths
6. The desktop comparison (exact, OR-030a), from a fresh seed, runs from
   the capture-only commit to the restyle. Expected: home only, for the
   <h1>. sample and sample-text-dark should be byte-identical; if they
   move, the report says why.
7. reskin-screen-log.md gains the OR-038 row and states that the
   re-skin is complete. "Found, not fixed" keeps only what "Found"
   below adds, and the assessor question.
8. No dependency, no schema change, no copy change, no test loosened
9. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - Fraunces leaks through the shared panel: font-serif on
     preview-panel's <h2>. The new allowlist test goes red. Today's
     test passes this exact change (trialled: 4 passed).
   - The export's shadow returns: the CTA gains
     shadow-[0_18px_44px_-40px_rgba(14,23,41,0.4)]. design-debt goes
     red as new debt. Today's scan passes this exact change (trialled:
     3 passed).
   No debt entry is cleared here, so there is no cleared-debt-returns
   break. Both breaks are changes the current checks were shown to
   miss.
10. pnpm verify passes, CI green before merge

DO NOT
- Change, add or remove any words on / or /sample
- Add a section, a footer, a menu, a stat, a pill or an animation
- Put Fraunces anywhere but the home <h1> (or the wordmark, if you say
  so)
- Use opacity, a shadow or a gradient for decoration
- Link to privacy or terms pages that do not exist, or invent a support
  address
- Import anything from reference/
```

## Found while drafting, not absorbed

- **Positioning versus PROJECT_STATE validation #3.** The test there is
  ten seconds on the marketing page, after which the answer should be
  "it tells me who to call". The page as written is about the note and
  the tax difference. It never mentions a call list. That is a copy
  and positioning decision, for you and Cursor, not a re-skin. Fraunces
  will make the current headline more prominent, not change what it
  says.
- **No privacy policy or terms page exists.** Register collects names,
  emails and phone numbers. The export links to both pages, and we will
  not link to pages that don't exist. This is a product and legal item
  with no owner. I'm recording it in "Found, not fixed".

## Director's ruling on the found items

- The comprehension gap is recorded. It is a copy decision for Jerry,
  not a re-skin one. The "it tells me who to call" hero rewrite exists
  and never shipped.
- The missing privacy and terms pages are recorded as their own item,
  with no owner, flagged for Jerry. In California this is a CCPA
  question, not only a missing page. Note for the record: src/app has
  no footer and links to neither page. The links to nothing are in the
  export. The gap in this repo is that the pages do not exist while
  register collects names, emails and phone numbers.

## Amendment (Director)

```
Additional to OR-038:

Add to the enforcement note in PROJECT_STATE.md:

  Match values, not spellings. The tokens-only scan recognised hex and
  named utilities but not rgba(), hsl() or any functional notation, so
  the same colour passed or failed depending on how it was written.
  A check should match the thing, in every form the thing can take.
```
