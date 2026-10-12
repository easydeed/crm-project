# OR-048 — What this project leaves behind: the constraints document and the findings register

Drafted by the builder for the Director. Approved: A and B as defaulted; C "refresh", with Current task left blank for whoever picks this up.

```
TASK: OR-048
BRANCH: docs/constraints-lessons

OBJECTIVE
Write down what the project learned, where the next person will read it, in
a form that fails the build when it stops being true. Four lessons, the
sixteen findings, and the citations that say what enforces each rule.

CORRECTION FIRST
The sixteen findings are not in PROJECT_STATE.md. It has six enforcement
principles, distilled from some of them. The numbered list exists only in
review messages. I rebuilt it from those messages:
- 14 numbers are stated in the reviews.
- #1 and #10 are inferred. #1 is the CI "Push schema" step, the earliest
  check that "reported success while doing nothing". #10 is the
  design-scope Fraunces hole, the first of OR-038's "both holes", "That's
  eleven".
- Each is listed in Decision A's table with its packet and the reviewer's
  words.

WHAT I MEASURED
- 01-constraints.md cites its enforcement as `file.test.ts:line`, 56
  times.
  - 14 point at a blank line, e.g. `top-bar.test.ts:4`, the top-bar rule
    in §8.
  - 21 point somewhere other than a test's first line.
  - 21 land on a `test(` line.
  The document that says what enforces each rule has drifted from the
  enforcement. That is check drift (#13, #15, #16) in prose.
- 01-constraints.md §1.4 ("What the browser pass does not see") is stale
  since OR-044a:
  - It names a paused account, a system-paused account and the view-as
    banner as unmeasured. All three are captured.
  - It says dark mode is measured on one screen. It is measured on six:
    sample-text-dark, dashboard-dark, dashboard-quiet-dark, addons-dark,
    login-dark and register-dark.
  - It names the People row links as an owned exception. That ended in
    OR-045.
- 01-constraints.md §4's credential line says "Not enforced by a test".
  Since OR-047 and OR-044a it is enforced twice: auth-panels.test (no
  value or defaultValue on an auth input) and e2e-agents.test (no capture
  types an e2e login or the e2e password).

SCOPE
1. 01-constraints.md, a new §9 "Reading a design":
   - "A static comp shows the control, not what it does." The rule is to
     name what each drawn control does, and check that the drawn layout
     still lets it do that. Three instances:
     - The v0 export: Delete fired on click with a toast, so there was
       no confirmation.
     - The OR-045 design: "Add to group" at 390 is a select with no
       submit. It would be a dead control.
     - The OR-046 design: the sticky preview column, about 304px wide.
       Desktop (600) and Phone (380) would render the same, so the
       toggle would be a dead control.
     Enforced by:
     - people-panels.test: an "Add to group" submit at every width.
     - showNote's prepare: 600px and 380px measured at 1440.
     - people-ui.test: window.confirm on Delete.
   - "A dimension stated from reading is a guess." Measure in the
     renderer, at the width that matters, and report the number. Three
     instances:
     - OR-044 "three lines" was 4 lines and a 4px overflow.
     - OR-045's Edit link: the plan gave it .tap and a 44px minimum
       width. Measured at 390 it was 162.9×44, stretched across its grid
       cell, until justify-self-start pinned it at 44×44. No reading of
       the classes predicted that.
     - OR-044a's settings explanation was wrong; the cause was the 09:00
       default.
2. 01-constraints.md §4: "Never show a password, a demo login or any
   credential on any page, including mocks and captures."
   - It cites the design's prefilled login (OR-047, refused).
   - "Not enforced by a test" becomes its two tests.
3. 01-constraints.md §1.4 brought up to date against e2e/screens.ts and
   e2e/screens/*. It points at 05-open #29 for what is still unseen.
4. PROJECT_STATE.md "Enforcement, not instruction" gains two
   paragraphs, beside "Probe with the real thing":
   - "Prove the transformation applied." A check that transforms its
     input before asserting (strips a size, skips a token family, holds
     a copy of the value) must fail when the transformation no longer
     applies. Otherwise it goes quiet when the code moves. Three
     instances: buttonClass held as a typed copy (#13, OR-042), the
     text-[…] skip in addons-ui (#15, OR-046), and the size strip in
     shared-classes (#16, OR-047). shared-classes.test's
     `not.toMatch(/text-\[/)` is the pattern.
   - "A dimension stated from reading is a guess." Short here, with the
     detail in §9.
   - Its "Last updated" date.
5. The findings register per Decision A.
6. The citations per Decision B.

DECISIONS

A. Where the sixteen findings live. Default: docs/audits/check-findings.md.
   - One row per finding:
     - number
     - packet
     - what the check claimed
     - what it actually checked
     - its species
     - the principle it fed
     - the test that now holds it
   - PROJECT_STATE's enforcement section links to it in one line, and
     keeps only principles.
   - The species, in the reviews' words:
     - compared against the wrong thing (#1–#3)
     - keyword / list instead of property (#4–#7)
     - scope (#8–#10)
     - notation (#11)
     - a carve-out wider than its name (#12)
     - check drift (#13, #15, #16)
     - fixtures that expire (#14)
   - The rows the reviews did not count stay out of the numbering, listed
     under it as "near misses":
     - the space-padded rgba probe
     - the no-op proof line
     - the OR-044a vacuous proofs
   - Say "inline" to put the table in PROJECT_STATE.md itself. It is
     authoritative and read first, but it would grow by about 40 lines of
     history in a file meant for principles.

B. The citations in 01-constraints.md. Default: cite each test by file and
   test name instead of line, with a unit test that reads the document and
   fails both ways:
   - A cited file that doesn't exist, or a cited name with no
     test('<name>' in that file, is red.
   - Every rule with an "Enforced by" names at least one test.
   - Names survive tests being added above them; lines don't. Re-pointing
     the 56 citations is part of this packet. Each one is checked against
     the property the rule states, not just moved to the nearest test(.
   - Say "lines" to keep lines and require each to be a test( line. That
     breaks on every edit above a cited test.
   - Say "leave" to fix §1.4 and the credential line only. The 35 drifted
     citations would stay, and a reader would trust them.

C. PROJECT_STATE.md's "Current phase" ("Pre-implementation… No production
   code written"), "Build order", "Current task: none" and "Last approved
   commit: none". Default: not in this packet.
   - All four are stale by about forty packets.
   - They are product state, Jerry's to declare. I list them in the
     report.
   - Say "refresh" to have me write the facts: the phase as the merged
     packets show it, and the last approved commit as main's head.

NOT IN THIS PACKET
- The texter stand-in for e2e (05-open #28): its own packet, as approved.
- 05-open #30 (the 09:00 default): a product decision.
- 03-screens/*.md citations. They use lines too, and they will have
  drifted the same way. If B is taken, the same test can widen to them in
  a later packet. 01-constraints is the file read first.

PROPERTY TESTS (each proven both ways)
- Under B, a citation to a missing file is red, and a cited test name not
  in its file is red.
- Under B, a rule section with "Enforced by" and no citation is red.
- Under B, a green cosmetic change (rewording a rule's prose) stays green.

ACCEPTANCE CRITERIA
1. Every existing test passes. No code under src/ changes except the one
   new test.
2. The new test passes, each property proven both ways.
3. Step 0 (three fresh-seed captures, the third after two match), then
   the exact comparison against main, same day: 72 of 72 byte-identical.
   A docs packet moves nothing.
4. Browser pass green at both widths.
5. Every instance named in the new text is checked against its packet's
   merged code or report before it is written. None is written from
   memory.
6. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - A citation renamed to a test that doesn't exist: the citation test is
     red.
   - The credential rule's citation to e2e-agents.test pointed at a
     missing file: the citation test is red. auth-panels.test and
     e2e-agents.test stay green.
7. pnpm verify passes, CI green before merge.

DO NOT
- Restate a finding without its packet and the check that now holds it
- Write an instance from memory
- Change a rule's meaning while moving its citation
- Touch Current phase, Build order or Last approved commit (under C's
  default)
```

## Found while drafting, not absorbed

- **The register was never written down.** "Already in PROJECT_STATE.md"
  was a reasonable belief: the principles are there, and they read like a
  summary of a list. The list itself lived in sixteen review messages.
- **The constraints document had the same disease it describes.** 35 of
  its 56 enforcement pointers had drifted. The rule "Enforced by" was a
  line in a document, checked by nothing. That is the first sentence of
  PROJECT_STATE's enforcement section.
- **01-constraints.md is 495 lines.** The 300-line rule is enforced on
  source files only. A §9 takes it past 540. It is still one document a
  designer reads first, so I propose leaving its length alone.
