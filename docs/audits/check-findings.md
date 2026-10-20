# Checks that checked less than their names said

Nineteen times on this project, a check was found passing while it verified less than it
claimed. Each was found by breaking something on purpose, or by looking at a state no check
had looked at. This register is what the principles in `PROJECT_STATE.md` ("Enforcement, not
instruction") were drawn from. Read it before trusting a green run.

The numbering is the reviews'. Seventeen numbers are stated in them. Two, #1 and #10, are
inferred, with the reason given. Each entry says what the check claimed, what it actually
checked, the kind of failure, and the test that holds the property now. Tests are cited by
file and name, and `src/app/constraints-citations.test.ts` fails if one stops existing.

## The kinds

| Kind | Findings | The principle it fed |
|---|---|---|
| Compared against the wrong thing | #1, #2, #3, #17 | Enforcement, not instruction: a check that throws, not a line that describes |
| A keyword or a list, not the property | #4, #5, #6, #7, #19 | Prefer an allowlist; a test named for a property checks the property |
| Scope: named directories, not the tree | #8, #9, #10 | Scan trees, not lists |
| Notation: the spelling, not the value | #11, #18 | Match values, not spellings |
| A carve-out wider than its name | #12 | Scan trees, not lists (an exemption is a scope) |
| Check drift: the check transforms or copies what it checks | #13, #15, #16 | Prove the transformation applied |
| Fixtures that expire | #14 | Moving dates stay out of the seed |

## The nineteen

1. **CI "Push schema" reported success while doing nothing.** *Found in OR-017a; fixed in
   OR-000d. Inferred as #1: the reviews never number it, but name it beside #2 as the same
   shape, and it is the earliest.*
   - Claimed: every merge's schema reached the database.
   - Checked: nothing. drizzle-kit hit a TTY prompt and threw, and the step exited 0 anyway.
   - Held now by: `src/db/migrations.test.ts` “schema reaches a database only through
     committed migrations” and `src/db/migrations.test.ts` “CI fails a step on any
     non-zero exit, including inside a pipe”.

2. **The horizontal-scroll check measured a viewport that grew with the page.** *OR-017c.*
   - Claimed: no screen scrolls sideways at 390px.
   - Checked: scrollWidth against innerWidth, which a phone widens to fit the content. It
     passed on all 13 screens and hid a 4px overflow on `/u`.
   - Held now by: `e2e/checks.ts` “rule: 'no-horizontal-scroll'”, measured against
     clientWidth, and `e2e/checks.ts`
     “expect(scrollWidth).toBe(page.viewportSize()?.width)”.

3. **The desktop comparison allowed a per-pixel threshold.** *OR-030a.*
   - Claimed: a screen that changed would be reported.
   - Checked: Playwright's default 0.2 per-pixel threshold, which passed a muted-text change
     from #3d3d3d to #63708a. `--update-snapshots` also left baselines older than they
     looked.
   - Held now by: `src/app/desktop-compare.test.ts` “the desktop comparison is exact: no
     per-pixel threshold, no allowed pixels” and `src/app/desktop-compare.test.ts` “a
     baseline rewrites every screen, and a comparison rewrites none”.

4. **The People columns test banned engagement words by name.** *OR-031.*
   - Claimed: no engagement labels in the People list.
   - Checked: that `engagement` and `last-opened` were absent. The export's real labels
     ("Opening", "Quiet", "Never opened") contained neither.
   - Held now by: `src/app/app/people/people-ui.test.ts` “the status column says only the
     schema status and Unsubscribed, never an engagement label”, an allowlist of the words
     in the cell.

5. **The disabled-state test pinned a class string.** *OR-033a.*
   - Claimed: the disabled look is readable.
   - Checked: that a string matched. A break failed on the string, not on contrast.
   - Held now by: `src/app/disabled-state.test.ts` “disabled is --surface, --muted-ink and a
     --border ring: pairs the contrast test checks”, which reads the pair out of the class
     and requires it to be a checked pair.

6. **The disabled-state test checked a list of files.** *OR-034.*
   - Claimed: every button looks disabled when it is.
   - Checked: the files on its list. The phone-verification buttons were not on it, and
     looked live while a code was sending.
   - Held now by: `src/app/shared-classes.test.ts` “buttonClass is defined once; the only
     copies of its string are the listed ones”, over the whole tree, and
     `src/app/app/settings/settings-reskin.test.ts` “phone verification uses buttonClass, so
     its buttons look disabled while a code is sending”.

7. **The found-nothing test banned `red|error|destructive`.** *OR-035.*
   - Claimed: found-nothing is not shown as an error.
   - Checked: three words. `text-coral-text` contains none of them. The listing-side note's
     contrast was held only by a comment.
   - Held now by: `src/app/app/start/start-reskin.test.ts` “%s renders %s at full contrast:
     no muted ink, no colour, no fill, on it or around it”, which walks every element around
     each framing sentence, found-nothing included. The keyword line is still in
     `src/signup/signup.test.ts` “found-nothing is a neutral fork: a status line with the
     upload path, never an error”, beside its `role="status"` check. It is not what holds
     the property.

8. **Clearing a debt entry removed the only check on those files.** *OR-036.*
   - Claimed: `/login` and `/register` use tokens only.
   - Checked: nothing. The tokens-only scan walked `src/app/app`. The debt entries for login
     and register were the only colour guard there, and clearing them removed it.
   - Held now by: `src/app/design-debt.test.ts` “all of src/app is tokens only, apart from
     the debt listed here” and `src/app/design-debt.test.ts` “listed debt outside /app is
     exact too”.

9. **The tokens-only scan covered three named directories.** *OR-037.*
   - Claimed: all of the app uses tokens.
   - Checked: three directories. `src/app/digest` drew the email preview's plain text
     #ededed on white in dark mode, 1.17:1, on four screens.
   - Held now by: `src/app/design-debt.test.ts` “all of src/app is tokens only, apart from
     the debt listed here”, over the whole tree, and the `sample-text-dark` capture.

10. **The Fraunces scope test checked four directories.** *OR-038. Inferred as #10: the review
    says "both holes are real… That's eleven", and OR-038's report names this one "the tenth
    check" and the next "the eleventh".*
    - Claimed: Fraunces appears only on the marketing page.
    - Checked: four directories. `font-serif` on the shared preview panel passed.
    - Held now by: `src/app/design-scope.test.ts` “Archivo stays on the marketing page: only
      the listed files under src name it, and only marketing files import them”, over every
      file under `src`. Archivo replaced Fraunces as the marketing face in OR-053; the
      allowlist moved with it.

11. **The colour scan matched spellings, not values.** *OR-038.*
    - Claimed: no colour outside the tokens.
    - Checked: hex and named utilities. `rgba()`, `hsl()` and the other functional forms
      passed, so the export's 14 ink shadows did too.
    - Held now by: `src/app/design-debt.test.ts` “the scan matches a colour however it is
      written, and leaves tokens alone”.

12. **The tap-size check's "inline link" exemption was wider than its name.** *Found in
    OR-039; numbered in OR-040; fixed in OR-041.*
    - Claimed: only a link inside a sentence is exempt from 44px.
    - Checked: whether the link's nearest block held any other text. Every link placed in a
      page column passed, and standalone links at 19 to 39px went unmeasured.
    - Held now by: `e2e/checks.ts` “const isInlineLink”: a link is inline only when its own
      parent holds words of its own.

13. **The copy detector held a typed copy of buttonClass.** *OR-042.*
    - Claimed: no file copies the primary button's string.
    - Checked: for a frozen string. After buttonClass changed, it would hunt for the old one
      and pass forever.
    - Held now by: `src/app/shared-classes.test.ts` “buttonClass is defined once; the only
      copies of its string are the listed ones”, which reads the string from `ui.ts`.

14. **The seed's dated events expired.** *OR-043.*
    - Claimed: the dashboard captures show the call tags.
    - Checked: whatever the seed's fixed 2024–25 dates still reached. As the windows moved
      past them, three of the four call-tag kinds stopped rendering, and no test failed.
    - Held now by: `src/db/fixtures/seed-dates.test.ts` “no recorded event in the seed is
      newer than the seed has ever had”, the events dated from each run in
      `src/db/fixtures/e2e-live.ts`, and `scripts/live-data.ts` “the live events no longer
      reach it”, which stops the run if the tags disappear.

15. **The bill bar test skipped every `text-[…]`.** *OR-046.*
    - Claimed: every colour in the bill bar is on the bar pair.
    - Checked: every `text-` token except arbitrary values, so `text-[#d4a84b]`, the design's
      brass, would have passed.
    - Held now by: `src/app/app/addons/addons-ui.test.ts` “the bill bar is the bar pair at
      full strength, which the contrast test checks”, where an arbitrary text value must be a
      size.

16. **The link copy detector stripped a size that was about to change.** *OR-047.*
    - Claimed: no file copies the link's string.
    - Checked: for the string with `text-[15px] ` stripped. After the move to 17px the strip
      would have matched nothing, and the detector would have gone quiet.
    - Held now by: `src/app/shared-classes.test.ts` “linkClass is defined once; the only
      copies of its string are the listed ones”, which strips any size and fails if the strip
      misses.

17. **The cron route's test called the handler that existed, not the one the platform calls.**
    *OR-051.*
    - Claimed: the cron tick works.
    - Checked: POST, called directly, and only its refusal. Vercel calls a cron path with GET and
      an `Authorization: Bearer` header, so the route answered every real cron with a 405 and the
      job runner never ran on Vercel. Nothing had deployed, so nothing showed it.
    - Held now by: `src/app/api/cron/tick/route.test.ts` “every cron path in vercel.json is a route
      that answers the method Vercel calls it with” and `src/app/api/cron/tick/route.test.ts` “a
      request shaped like Vercel's cron runs the scheduler and the runner”.

18. **The no-opacity scan read class names, not styles.** *OR-052; closed in OR-053.*
    - Claimed: no source file under `src/app` uses opacity, for any state.
    - Checked: Tailwind `opacity-NN` utilities only. The marketing design's recorder stamp was
      `style="opacity:.85"`, and a style prop or a CSS rule would have passed.
    - Held now by: `src/app/disabled-state.test.ts` “no source file under src/app sets opacity
      in a style either: not in a style prop, not in CSS”, which also proves its pattern on
      each spelling.

19. **"Fonts are bundled" checked one way of fetching them.** *OR-052; closed in OR-053.*
    - Claimed: no build fetches fonts from Google.
    - Checked: imports of `next/font/google`. The marketing design loaded Archivo with a
      `<link>` to fonts.googleapis.com, which the test could not see.
    - Held now by: `src/app/design-scope.test.ts` “fonts are bundled: nothing imports
      next/font/google or links to Google Fonts, so no page fetches from Google”, which scans
      src and public for either Google host and proves its pattern on each spelling.

## Near misses

The reviews did not number these, but each is the same failure, caught before it cost
anything:

- **The rgba probe was padded with spaces** (OR-038). Tailwind writes those spaces as
  underscores, so the probe passed its own rule and would have missed every real case. This
  became "Probe with the real thing".
- **A keyword scan for a demo password** (OR-036). It could not express "no credential on
  any page" honestly as a source scan, so it was deleted rather than shipped as a ninth
  vacuous check. The rule is now held by tests of the property (`01-constraints.md` §4).
- **A proof line that passed whether or not the check worked** (OR-046). It was discarded and
  replaced.
- **Two vacuous proofs in OR-044a.** One break went red on typecheck, not on the test. The
  other reused an existing agent key, so the agent was "used" and the test stayed green. That
  one also showed the test could not see duplicate keys, and it gained a uniqueness check.
