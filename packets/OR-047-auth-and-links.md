# OR-047 — Sign in, create account, and links at 17px

Drafted by the builder; approved by the Director with all four decisions as defaulted.

```
TASK: OR-047
BRANCH: feat/auth-and-links

OBJECTIVE
Links move to the body's 17px. Links inside a sentence match their
sentence. The two signed-out forms take the navy wordmark bar and a panel.
No credential appears anywhere, mocks included.

CORRECTION FIRST
My OR-044 report said "Recorded against the property" wraps to three lines
in the call panel's 88px label column at 390. I didn't measure it.
Measured with the bundled Inter at weight 500 and 17px, in Chromium:
- It wraps to four lines, not three.
- "Recorded" overflows the cell by 4px (scrollWidth 92 against 88).
- Line counts by column width:

  | Label column | Lines |
  |---|---|
  | 96–116px | 4 |
  | 118–168px | 3 |
  | 170px and up | 2 |

- Two lines would need 170px, which leaves the value column about 118px at
  390.
- The mobile capture doesn't show this row, because the first entry has
  only "On the record". Nothing could have caught it. Decision D.

WHAT THE DESIGN DRAWS (D:220-268, README:169-174; 390, "identical column at 1440")
- A navy header holding the wordmark, as a <span>, not a link: 18px bold,
  44px tall. No nav, no identity line.
- A 384px column.
  - The h1 is 24px.
  - The form sits in a panel: a --rule border, radius 12, padding 24/20.
  - Labels are 16px semibold; fields 48px and 17px.
  - The error line and the plan line are 17px.
  - The cross-link is 17px, centred, 44px tall.
- Register:
  - "At least 10 characters" as a muted span tied to the input by
    aria-describedby
  - a rule
  - "Optional" after Brokerage, DRE number and Phone
- Login is drawn in the mismatch state, with the fields PREFILLED:
  value="dana@coastlinerealty.com" and a masked password (A:157).

SCOPE
1. Links (commit 1, so the comparison can separate the two causes).
   - linkClass and linkBaseClass go to 17px.
   - Two variants for the cases a single size gets wrong (Decision A):
     - inlineLinkClass, with no size, inherits its sentence. Five places:
       - "Contact us" (system-paused card)
       - "here" (text notice)
       - "Settings" (text notice)
       - the closings "few" link
       - "Go to Settings" (add-on row)
     - metaLinkClass, 15px, for the links the design keeps at 15px:
       "Log out" and the People row's "Edit" (README:75, :94, :112).
   - shared-classes.test:19 strips `text-[15px] ` from linkBaseClass to
     find size-less copies. After the move that strip matches nothing, and
     the test goes quietly weaker. It is updated to strip the new size, so
     it still catches copies.
2. The call panel's label column per Decision D.
3. /login and /register (commit 2).
   - Bar: a <header> on the bar pair. bg-bar, text-on-bar, the wordmark
     18px bold. Per Decision B, not a link.
   - The column is max-w-sm. Login stays vertically centred; register sits
     at the top, as drawn.
   - h1 at 24px, literal text unchanged (sweep.test:14).
   - The form in a plain panel (panelClass), padding 24/20.
     - Labels 16px semibold. Fields stay fieldClass.
     - The error line is 17px.
     - The submit is full width.
   - Login: Email and Password. The labels and button names stay exactly
     as they are: e2e/auth.setup signs every capture in through them.
   - Register:
     - The password's requirement becomes a muted 15px line under the
       label, outside it, and the input points at it with
       aria-describedby. The input's accessible name stays "Password".
       The input has no accessible name or description today; the audit
       endorses this fix (A:453).
     - A rule before the optional fields. The "Optional" suffixes per
       Decision C.
     - The plan line at 17px, still built from PLAN_LINE.
   - The cross-links ("Create an account", "Sign in") use linkClass: 17px,
     .tap, centred.
   - No defaultValue or value on any auth input. A test holds it, and
     01-constraints' credential line will say "including mocks" in OR-048
     (A:419).
4. Docs: login.md, register.md, 02-system's link rows (three classes), the
   call-panel row in dashboard.md, a reskin-screen-log row with the two
   causes kept apart.

REFUSED
- The prefilled email and masked password (A:157; never show a credential).
- Typing "$19 a month, up to 250 homeowners". The line stays PLAN_LINE.
- Fraunces on these pages. The design uses Inter, and design-scope.test
  holds it.

DECISIONS

A. Three link sizes instead of one. Default: linkClass 17px,
   inlineLinkClass inherits its sentence, metaLinkClass 15px.
   - The design keeps meta links (Log out, row Edit) at 15px and draws
     body links at 17px.
   - A link inside a 15px sentence would stand 2px taller than its words
     at 17px.
   - Say "one size" to move every link to 17px. Five inline links would
     then outgrow their sentences, and Log out and Edit would be bigger
     than drawn.

B. The auth bar's wordmark. Default: a <span>, as drawn. It is not a
   control.
   - As a link it could only go to "/" or to /app (which bounces a
     signed-out visitor back to /login). The column already has the
     cross-link.
   - Say "link" to make it a link to "/", with the on-bar focus ring
     (chrome.test's rule).

C. Register's "Optional" after three fields. Default: refused.
   - It is new copy, and it changes three accessible names (A:356).
   - The field labels stay as they are. The rule before them groups them
     without words.
   - Say "take" to add it: true, short, and it tells a new agent what they
     can skip.

D. The call panel's label column. Default: 120px at 390, 170px from sm.
   - At 120px: three lines, and "Recorded" no longer overflows. The value
     column keeps about 168px at 390.
   - From sm there is room for 170px, which gives two lines. The column is
     88px at every width today, so the same four-line overflow happens at
     1440 too.
   - Say "170" to use 170px at 390 as well: two lines there, leaving about
     118px for the phone, email and house values.

PROPERTY TESTS (each proven both ways)
- Every linkClass use stands on its own line or row, never inside a
  sentence. Inline links use inlineLinkClass. "Inside a sentence" means
  the parent element has a direct letter-bearing text node, the same rule
  as e2e checks.ts.
- metaLinkClass appears only on Log out and the People row's Edit.
- The auth bar: bg-bar / text-on-bar, the wordmark has no href (B), no
  blue inside it.
- No auth <input> has value or defaultValue.
- The register password input has aria-describedby pointing at the
  requirement's id, and its label holds no other text.
- The call panel's label column is at least 118px at 390 and 170px from sm (D).

ACCEPTANCE CRITERIA
1. Existing tests pass, or are changed on purpose and named:
   - shared-classes.test:19's strip is strengthened, not weakened.
   - Every Fixed string is unchanged.
   - auth.setup still signs in through "Email", "Password" and "Sign in".
2. The new property tests pass, each proven both ways.
3. Step 0 (three fresh-seed captures, the third after two match), then the
   exact comparison, taken commit by commit and all on one day:
   - Links commit: every screen with a linkClass link changes. That is
     expected to be 26 of 27; unsubscribe has its own CSS. The report lists
     any that don't change, and why.
   - Auth commit: only login and register change.
4. Browser pass green at both widths. The call panel's label column
   measured at 390, and "Recorded against the property" checked for no
   overflow, with the line count reported.
5. No dependency, no schema change, no copy change (under C's default), no
   new colour.
6. Two deliberate breaks, each red in CI on its intended signal only, each
   reverted to an identical tree:
   - defaultValue="dana@coastline.example" on the login email: the
     no-credential test is red.
   - The text notice's "here" back on linkClass: the inline-link test is
     red.
7. pnpm verify passes, CI green before merge.

DO NOT
- Prefill any auth field, in code, fixtures or mocks
- Rename a label or button that auth.setup signs in through
- Put Fraunces on /login or /register
- Type the price
```

## Found while drafting, not absorbed

- **My OR-044 "three lines" was a guess, and wrong.** I reported it as an
  observation. It was four lines, with an overflow, and the capture
  couldn't show it. Same lesson as the Edit link's 163px: measure, don't
  describe.
- **A global link size would have broken the design's own hierarchy.** It
  draws meta links at 15px. "Move linkClass to 17px" was right for body
  links and wrong for Log out and Edit. The split is the honest version.
- **Unseen states for OR-044a:**
  - login: mismatch (the state the design draws), signing in, dark mode
  - register: each error, creating account, dark mode
  - root loading and error
  - view-as "Exit"

## Director's decisions

- A: three link sizes (linkClass 17px, inlineLinkClass inherits, metaLinkClass 15px).
- B: the auth wordmark is a <span>.
- C: refuse "Optional" ×3.
- D: the call panel label column 120px at 390, 170px from sm.
- For OR-048's enforcement note, beside "probe with the real thing": a dimension
  stated from reading is a guess.
